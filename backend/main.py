from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import asyncio
import copy
from datetime import datetime, timezone
import json
import math
import os
import random
import re
import time
load_dotenv()

# ── In-memory data store ──────────────────────────────────────────────
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "shared", "nexus_truth.json")
store = {
    "data": {},
    "alerts": [],
    "last_update": 0,
    "boot_time": 0,
    "history": {},
    "connections": {},
    "demo_mode": False,
    "supplier_risks": {},
}
alert_counter = 100


def load_seed_data():
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, "r") as f:
            return json.load(f)
    return {}


def get_client():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


# ── History generation (7-day random walk per SKU) ─────────────────────
def generate_history(inventory):
    """Generate 7 days of simulated hourly data for each SKU."""
    history = {}
    hours = 7 * 24  # 168 data points
    for item in inventory:
        sku = item["id"]
        base_shopify = item["systems"]["shopify"]
        base_amazon = item["systems"]["amazon"]
        base_wms = item["systems"]["wms"]

        points = []
        s, a, w = base_shopify * 0.85, base_amazon * 0.85, base_wms * 0.92
        for h in range(hours):
            day = h // 24
            hour = h % 24

            # Demand pattern: higher during business hours
            demand_mult = 1.2 if 9 <= hour <= 21 else 0.7

            # Shopify: higher volatility, trending up
            s += random.gauss(0.15, 1.5) * demand_mult
            # TikTok spike for Alpine Ridge Jacket on day 5
            if sku == "SKU-101" and day == 5 and 10 <= hour <= 16:
                s += random.gauss(8, 3)

            # Amazon: moderate volatility
            a += random.gauss(0.12, 1.2) * demand_mult
            if sku == "SKU-101" and day >= 5:
                a += random.gauss(2, 1)

            # WMS: slow-moving (physical), occasional restocks
            w += random.gauss(0, 0.3)
            if h % 48 == 0 and random.random() < 0.3:
                w += random.gauss(5, 2)

            s = max(10, s)
            a = max(5, a)
            w = max(10, w)

            ts = int(time.time()) - (hours - h) * 3600
            points.append({
                "ts": ts,
                "day": day,
                "hour": hour,
                "shopify": round(s),
                "amazon": round(a),
                "wms": round(w),
                "total": round(s + a + w),
            })

        # Compute daily velocity (orders per day approximation)
        daily_velocity = []
        for d in range(7):
            day_pts = [p for p in points if p["day"] == d]
            if day_pts:
                vel = max(0, day_pts[-1]["shopify"] - day_pts[0]["shopify"]) + \
                      max(0, day_pts[-1]["amazon"] - day_pts[0]["amazon"])
                daily_velocity.append({"day": d, "velocity": max(1, round(vel))})

        history[sku] = {
            "hourly": points,
            "daily_velocity": daily_velocity,
            "sparkline": [p["total"] for p in points[::12]],  # every 12 hours = 14 points
        }
    return history


def generate_connections():
    """Simulated connection status for each system."""
    now = time.time()
    return {
        "shopify": {"status": "connected", "last_sync": now - random.randint(10, 120), "latency_ms": random.randint(45, 180)},
        "amazon": {"status": "connected", "last_sync": now - random.randint(30, 300), "latency_ms": random.randint(80, 250)},
        "wms": {"status": "connected", "last_sync": now - random.randint(5, 60), "latency_ms": random.randint(20, 80)},
        "shipbob": {"status": "connected", "last_sync": now - random.randint(60, 600), "latency_ms": random.randint(100, 350)},
        "pos": {"status": "connected", "last_sync": now - random.randint(15, 180), "latency_ms": random.randint(30, 120)},
    }


def clamp(value, low, high):
    return max(low, min(high, value))


def _sigmoid(x):
    return 1 / (1 + math.exp(-x))


def _extract_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = re.search(r"(\d+(\.\d+)?)", str(value))
    return float(match.group(1)) if match else None


def _days_until(date_str):
    try:
        target = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        return max(0, int((target - now).total_seconds() // 86400))
    except Exception:
        return None


def compute_stockout_forecast(item):
    """Rule-based stockout probability forecast for 7/14 day horizons."""
    sku_id = item.get("id")
    sku_history = store.get("history", {}).get(sku_id, {})
    vel_series = [p.get("velocity", 0) for p in sku_history.get("daily_velocity", [])]
    recent_vel = [v for v in vel_series[-3:] if v > 0]

    if recent_vel:
        daily_demand = sum(recent_vel) / len(recent_vel)
    else:
        daily_demand = max(1.0, float(item.get("committed", 0)) / 14.0)

    available = max(0.0, float(item.get("available", 0)))
    lead_time_days = max(1.0, float(item.get("lead_time_days", 30)))
    reorder_point = max(1.0, float(item.get("reorder_point", 50)))
    days_to_stockout = available / max(1.0, daily_demand)

    lead_pressure = _sigmoid((lead_time_days - days_to_stockout) / 6.0)

    def horizon_risk(days):
        horizon_push = _sigmoid((days - days_to_stockout) / 2.8)
        base = 0.05 + 0.65 * horizon_push + 0.25 * lead_pressure
        if available <= reorder_point:
            base += 0.08
        return clamp(base, 0.01, 0.99)

    risk_7 = round(horizon_risk(7) * 100, 1)
    risk_14 = round(horizon_risk(14) * 100, 1)
    confidence = clamp(0.55 + min(0.3, len(vel_series) * 0.03), 0.55, 0.9)

    return {
        "daily_demand": round(daily_demand, 2),
        "days_to_stockout": round(days_to_stockout, 1),
        "risk_7d": risk_7,
        "risk_14d": risk_14,
        "confidence": round(confidence, 2),
    }


def enrich_inventory_with_forecasts(inventory):
    enriched = []
    for item in inventory:
        updated = dict(item)
        updated["stockout_forecast"] = compute_stockout_forecast(item)
        enriched.append(updated)
    return enriched


def build_action_recommendations(inventory, returns_data, alerts, tariffs):
    """Rank top actions by expected impact, urgency, and confidence."""
    candidates = []

    for item in inventory:
        systems = item.get("systems", {})
        forecast = item.get("stockout_forecast", {})
        max_channel = max(systems.get("shopify", 0), systems.get("amazon", 0))
        gap = max(0, max_channel - systems.get("wms", 0))
        risk_value = int(item.get("risk_value", 0))

        if item.get("discrepancy") and risk_value > 0:
            candidates.append({
                "kind": "sync",
                "title": f"Sync {item.get('name', item.get('id'))} to WMS truth",
                "rationale": f"{gap}-unit listing gap is exposing ${risk_value:,.0f} of annualized risk.",
                "command": f"sync_inventory:{item.get('id')}",
                "expected_impact": max(1, risk_value),
                "urgency": clamp(gap / 30 + risk_value / 50000, 0, 1),
                "confidence": 0.92,
                "sku": item.get("id"),
            })

        risk_7d = forecast.get("risk_7d", 0)
        if risk_7d >= 55:
            channel = "shopify" if systems.get("shopify", 0) >= systems.get("amazon", 0) else "amazon"
            channel_units = int(systems.get(channel, 0))
            if channel_units <= 0:
                continue
            exposure = int((risk_7d / 100) * max(1, item.get("available", 0)) * item.get("unit_cost", 25) * 4)
            candidates.append({
                "kind": "pause",
                "title": f"Pause {channel.title()} listing for {item.get('id')}",
                "rationale": f"{risk_7d:.1f}% 7-day stockout risk with ~{forecast.get('days_to_stockout', 0)} days of coverage.",
                "command": f"pause_channel:{channel}:{item.get('id')}",
                "expected_impact": max(1, exposure),
                "urgency": clamp(risk_7d / 100, 0, 1),
                "confidence": 0.78,
                "sku": item.get("id"),
            })

    in_limbo = returns_data.get("in_limbo", 0)
    frozen_value = int(returns_data.get("total_frozen_value", 0))
    avg_days = returns_data.get("average_days_stuck", 0)
    if in_limbo > 0 and frozen_value > 0:
        candidates.append({
            "kind": "returns",
            "title": "Release inspected returns to ATP",
            "rationale": f"{in_limbo} units and ${frozen_value:,.0f} remain frozen for ~{avg_days} days.",
            "command": "release_returns",
            "expected_impact": frozen_value,
            "urgency": clamp(avg_days / 30 + in_limbo / 40, 0, 1),
            "confidence": 0.88,
            "sku": None,
        })

    for tariff in tariffs:
        current_rate = tariff.get("current_rate", 0)
        proposed_rate = tariff.get("scenarios", [{}])[0].get("rate", current_rate)
        delta = proposed_rate - current_rate
        if delta <= 0:
            continue

        country = tariff.get("country")
        affected = [i for i in inventory if i.get("country_of_origin") == country]
        if not affected:
            continue

        exposure = 0
        for item in affected:
            unit_cost = float(item.get("unit_cost", 25))
            true_atp = int(item.get("true_atp", 0))
            exposure += int(true_atp * unit_cost * delta * 4)

        eff_date = tariff.get("scenarios", [{}])[0].get("effective_date")
        days_to_effective = _days_until(eff_date) if eff_date else None
        urgency = clamp((1 - (days_to_effective or 30) / 90), 0.2, 1.0)
        candidates.append({
            "kind": "tariff",
            "title": f"Shift sourcing away from {country}",
            "rationale": f"Tariff delta of {delta * 100:.0f} pts could add ~${exposure:,.0f} annualized landed cost.",
            "command": None,
            "expected_impact": max(1, exposure),
            "urgency": urgency,
            "confidence": 0.66,
            "sku": None,
        })

    if not candidates:
        return []

    max_impact = max(1, max(c["expected_impact"] for c in candidates))
    scored = []
    for c in candidates:
        impact_component = clamp(c["expected_impact"] / max_impact, 0, 1)
        score = 100 * (0.5 * impact_component + 0.3 * c["urgency"] + 0.2 * c["confidence"])
        c["score"] = round(score, 1)
        c["expected_risk_reduction_usd"] = int(c["expected_impact"])
        scored.append(c)

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:3]
    for idx, rec in enumerate(top, start=1):
        rec["rank"] = idx
    return top


def score_supplier_risk(extracted):
    """Compute supplier risk profile from parsed document and live context."""
    supplier = str(extracted.get("supplier") or "Unknown Supplier").strip()
    origin = str(extracted.get("origin") or "Unknown").strip()
    anomalies = extracted.get("anomalies", []) or []

    severity_weights = {"critical": 20, "warning": 12, "info": 5}
    severity_score = 0
    counts = {"critical": 0, "warning": 0, "info": 0}
    for anomaly in anomalies:
        if not isinstance(anomaly, dict):
            counts["warning"] += 1
            severity_score += severity_weights["warning"]
            continue
        sev = str(anomaly.get("severity", "info")).lower()
        if sev not in counts:
            sev = "info"
        counts[sev] += 1
        severity_score += severity_weights[sev]
    severity_score = clamp(severity_score, 0, 65)

    factory_load = _extract_number(extracted.get("factory_load"))
    capacity_score = 0
    if factory_load is not None and factory_load > 80:
        capacity_score = clamp((factory_load - 80) * 0.8, 0, 15)

    tariffs = store.get("data", {}).get("tariffs", [])
    tariff_score = 0
    tariff_delta = 0
    for tariff in tariffs:
        country = str(tariff.get("country", "")).lower()
        if country and country in origin.lower():
            current = tariff.get("current_rate", 0)
            proposed = tariff.get("scenarios", [{}])[0].get("rate", current)
            tariff_delta = max(0, (proposed - current) * 100)
            tariff_score = clamp(tariff_delta, 0, 12)
            break

    same_origin_count = len([
        item for item in store.get("data", {}).get("inventory", [])
        if str(item.get("country_of_origin", "")).lower() in origin.lower()
    ])
    concentration_score = clamp(same_origin_count * 2, 0, 8)

    total_score = round(clamp(severity_score + capacity_score + tariff_score + concentration_score, 0, 100), 1)
    confidence = round(clamp(0.55 + min(0.25, len(anomalies) * 0.05) + (0.08 if factory_load else 0), 0.55, 0.92), 2)

    return {
        "supplier": supplier,
        "origin": origin,
        "po_number": extracted.get("po_number"),
        "score": total_score,
        "confidence": confidence,
        "components": {
            "severity": round(severity_score, 1),
            "capacity": round(capacity_score, 1),
            "tariff": round(tariff_score, 1),
            "concentration": round(concentration_score, 1),
            "tariff_delta_pts": round(tariff_delta, 1),
        },
        "severity_counts": counts,
        "updated_at": int(time.time()),
    }


def upsert_supplier_risk(profile):
    supplier = profile.get("supplier", "Unknown Supplier")
    store["supplier_risks"].setdefault(supplier, {"latest": None, "history": []})
    current = store["supplier_risks"][supplier]
    prev = current.get("latest")
    prev_score = prev.get("score") if prev else None
    if prev_score is None:
        trend = "new"
    elif profile["score"] > prev_score + 3:
        trend = "up"
    elif profile["score"] < prev_score - 3:
        trend = "down"
    else:
        trend = "flat"

    next_profile = dict(profile)
    next_profile["trend"] = trend
    current["history"].append(next_profile)
    current["history"] = current["history"][-10:]
    current["latest"] = next_profile
    return {"supplier": supplier, "latest": next_profile, "history": current["history"]}


def supplier_risk_leaderboard():
    board = []
    for supplier, payload in store.get("supplier_risks", {}).items():
        latest = payload.get("latest")
        if latest:
            board.append({
                "supplier": supplier,
                "score": latest.get("score", 0),
                "trend": latest.get("trend", "flat"),
                "confidence": latest.get("confidence", 0),
                "origin": latest.get("origin", "Unknown"),
                "updated_at": latest.get("updated_at", 0),
                "history_points": len(payload.get("history", [])),
            })
    board.sort(key=lambda x: x["score"], reverse=True)
    return board


# ── Dynamic root cause generation ──────────────────────────────────────
def _find_item_by_sku(sku_id):
    """Look up a live inventory item by SKU ID."""
    if not sku_id or "inventory" not in store.get("data", {}):
        return None
    for item in store["data"]["inventory"]:
        if item["id"] == sku_id:
            return item
    return None


def get_root_cause(alert):
    """Build a dynamic root cause chain using live data from the alert."""
    msg = alert.get("message", "").lower()
    sku_id = alert.get("sku")
    item = _find_item_by_sku(sku_id)
    risk = alert.get("risk", 0)
    risk_str = f"${risk / 1000:.1f}K" if risk < 1_000_000 else f"${risk / 1_000_000:.2f}M"

    # ── Oversold / Gap alerts ──
    if "oversold" in msg or "gap" in msg:
        name = item["name"] if item else "Unknown SKU"
        sys = item["systems"] if item else {}
        wms = sys.get("wms", 0)
        shopify = sys.get("shopify", 0)
        amazon = sys.get("amazon", 0)
        max_listed = max(shopify, amazon)
        gap = max_listed - wms
        source = "Shopify" if shopify >= amazon else "Amazon"
        return {"chain": [
            {"label": "Root Cause", "text": f"{source} webhook delay — {name} listed at {max_listed} vs WMS truth of {wms}"},
            {"label": "Effect", "text": f"{gap}-unit oversell against stale inventory count on {source}"},
            {"label": "Impact", "text": f"{risk_str} capital at risk — backorder fulfillment required for {gap} units"},
            {"label": "Action", "text": f"Sync {sku_id} to WMS truth ({wms} units) across all channels"},
        ]}

    # ── Tariff alerts ──
    if "tariff" in msg:
        tariffs = store.get("data", {}).get("tariffs", [])
        # Extract country from message
        country = "Vietnam"
        for t in tariffs:
            if t["country"].lower() in msg:
                country = t["country"]
                break
        tariff = next((t for t in tariffs if t["country"] == country), None)
        if tariff:
            current = tariff["current_rate"]
            proposed = tariff["scenarios"][0]["rate"] if tariff["scenarios"] else current
            eff_date = tariff["scenarios"][0].get("effective_date", "TBD") if tariff["scenarios"] else "TBD"
            affected = [i for i in store.get("data", {}).get("inventory", []) if i.get("country_of_origin") == country]
            n_skus = len(affected)
            return {"chain": [
                {"label": "Root Cause", "text": f"{country} tariff increase — {current * 100:.0f}% to {proposed * 100:.0f}% effective {eff_date}"},
                {"label": "Effect", "text": f"{n_skus} SKUs sourced from {country} face higher landed cost"},
                {"label": "Impact", "text": f"{risk_str} annual exposure if no sourcing changes made"},
                {"label": "Action", "text": f"Shift affected SKUs to lower-tariff origin or negotiate pre-tariff bulk order"},
            ]}
        return {"chain": [
            {"label": "Root Cause", "text": "Geopolitical policy change affecting import duties"},
            {"label": "Effect", "text": "Landed cost increase pending for affected SKUs"},
            {"label": "Impact", "text": f"{risk_str} exposure across affected inventory"},
            {"label": "Action", "text": "Review sourcing alternatives and pre-tariff purchasing"},
        ]}

    # ── Demand spike alerts ──
    if "spike" in msg or "tiktok" in msg or "velocity" in msg:
        name = item["name"] if item else "Unknown SKU"
        atp = item["true_atp"] if item else 0
        available = item.get("available", 0) if item else 0
        lead_time = item.get("lead_time_days", 30) if item else 30
        days_stock = max(1, round(available / max(1, atp * 0.1)))
        return {"chain": [
            {"label": "Root Cause", "text": f"Viral social media exposure driving demand surge for {name}"},
            {"label": "Effect", "text": f"Order velocity 3.2x normal — {available} units available, ~{days_stock} days of stock remaining"},
            {"label": "Impact", "text": f"{risk_str} at risk — stockout probable before next PO (lead time {lead_time}d)"},
            {"label": "Action", "text": f"Expedite PO for {sku_id} or reallocate {min(50, available)} units from wholesale channel"},
        ]}

    # ── Returns backlog alerts ──
    if "return" in msg or "backlog" in msg or "inspection" in msg:
        returns = store.get("data", {}).get("returns", {})
        in_limbo = returns.get("in_limbo", 0)
        frozen_val = returns.get("total_frozen_value", 0)
        avg_days = returns.get("average_days_stuck", 0)
        frozen_str = f"${frozen_val / 1000:.1f}K" if frozen_val < 1_000_000 else f"${frozen_val / 1_000_000:.2f}M"
        n_items = len(returns.get("items", []))
        return {"chain": [
            {"label": "Root Cause", "text": f"ShipBob inspection bottleneck — {n_items} return batches stuck avg {avg_days} days"},
            {"label": "Effect", "text": f"{in_limbo} units awaiting grading, {frozen_str} frozen in limbo"},
            {"label": "Impact", "text": f"Unavailable ATP reducing sellable stock — customer wait times increasing"},
            {"label": "Action", "text": f"Release {n_items} graded returns ({frozen_str}) back into sellable inventory"},
        ]}

    # ── Reorder point alerts ──
    if "reorder" in msg or "threshold" in msg:
        name = item["name"] if item else "Unknown SKU"
        available = item.get("available", 0) if item else 0
        reorder_pt = item.get("reorder_point", 50) if item else 50
        lead_time = item.get("lead_time_days", 30) if item else 30
        unit_cost = item.get("unit_cost", 25) if item else 25
        reorder_qty = max(reorder_pt * 2, 100)
        reorder_cost = reorder_qty * unit_cost
        return {"chain": [
            {"label": "Root Cause", "text": f"Sustained demand for {name} — {available} available vs {reorder_pt} safety threshold"},
            {"label": "Effect", "text": f"Only {available} units left, {lead_time}-day lead time for replenishment"},
            {"label": "Impact", "text": f"Stockout risk before next PO arrival — {risk_str} revenue at risk"},
            {"label": "Action", "text": f"Emergency reorder {reorder_qty} units (${reorder_cost:,.0f}) or transfer from another channel"},
        ]}

    return None


# ── Simulation engine ─────────────────────────────────────────────────
def simulate_tick():
    """Run one simulation tick: adjust counts, generate alerts."""
    global alert_counter
    data = store["data"]
    if not data or "inventory" not in data:
        return
    if store.get("demo_mode"):
        store["last_update"] = time.time()
        return

    for item in data["inventory"]:
        sys = item["systems"]

        for channel in ["shopify", "amazon", "pos"]:
            delta = random.choice([-3, -2, -1, -1, 0, 0, 0, 1, 1, 2])
            sys[channel] = max(0, sys[channel] + delta)

        if random.random() < 0.15:
            sys["wms"] = max(0, sys["wms"] + random.choice([-1, 0, 0, 1]))

        max_listed = max(sys["shopify"], sys["amazon"])
        physical = sys["wms"]
        item["true_atp"] = physical
        item["available"] = max(0, physical - item.get("committed", 0))

        gap = max_listed - physical
        if gap > 5:
            item["discrepancy"] = True
            item["risk_value"] = max(0, int(gap * item.get("unit_cost", 25) * 12))
        else:
            item["discrepancy"] = False
            item["risk_value"] = 0

        # Deduplicate: check if a similar alert already exists for this SKU in recent alerts
        recent_sku_alerts = [a for a in store["alerts"][:10] if a.get("sku") == item["id"]]
        has_reorder_alert = any("reorder" in a.get("message", "").lower() for a in recent_sku_alerts)
        has_gap_alert = any("gap" in a.get("message", "").lower() for a in recent_sku_alerts)

        reorder = item.get("reorder_point", 50)
        if item["available"] <= reorder and item["available"] > 0 and random.random() < 0.03 and not has_reorder_alert:
            alert_counter += 1
            store["alerts"].insert(0, {
                "id": f"SIM-{alert_counter}",
                "type": "WARNING",
                "message": f"{item['name']} approaching reorder point — {item['available']} available vs {reorder} threshold",
                "risk": item["risk_value"],
                "action": None,
                "sku": item["id"],
                "time": "just now",
            })

        if item["discrepancy"] and gap > 20 and random.random() < 0.04 and not has_gap_alert:
            alert_counter += 1
            store["alerts"].insert(0, {
                "id": f"SIM-{alert_counter}",
                "type": "CRITICAL",
                "message": f"{item['name']}: {gap}-unit gap detected — {channel_name(max_listed, sys)} vs WMS ({physical})",
                "risk": item["risk_value"],
                "action": "sync_inventory",
                "sku": item["id"],
                "time": "just now",
            })

    # Update connection latency slightly
    for key in store["connections"]:
        conn = store["connections"][key]
        conn["latency_ms"] = max(10, conn["latency_ms"] + random.randint(-15, 15))
        if random.random() < 0.02:
            conn["status"] = "degraded" if conn["status"] == "connected" else "connected"
        conn["last_sync"] = time.time() - random.randint(5, 120)

    store["alerts"] = store["alerts"][:25]
    store["last_update"] = time.time()


def channel_name(max_val, sys):
    if sys["shopify"] == max_val:
        return f"Shopify ({sys['shopify']})"
    return f"Amazon ({sys['amazon']})"


async def simulation_loop():
    """Background task that ticks every 5 seconds."""
    while True:
        await asyncio.sleep(5)
        simulate_tick()


# ── App lifecycle ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    seed = load_seed_data()
    store["data"] = copy.deepcopy(seed)
    store["alerts"] = copy.deepcopy(seed.get("alerts", []))
    store["boot_time"] = time.time()
    store["last_update"] = time.time()
    store["history"] = generate_history(seed.get("inventory", []))
    store["connections"] = generate_connections()
    store["demo_mode"] = False
    store["supplier_risks"] = {}

    task = asyncio.create_task(simulation_loop())
    yield
    task.cancel()


app = FastAPI(title="NexusLink API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── System prompt ─────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are NexusLink AI, an expert supply chain intelligence assistant for Ridgeline Outdoor Co.

You have real-time access to the company's unified data fabric including inventory positions across all channels (Shopify, Amazon, WMS, POS), tariff schedules, and returns pipeline.

Here is the current LIVE data (updates every 5 seconds):

{context}

AVAILABLE ACTIONS you can recommend the user trigger:
- sync_inventory:<SKU-ID> — Syncs all channel counts to match WMS for a specific SKU
- release_returns — Releases inspected returns back into sellable ATP
- pause_channel:<channel>:<SKU-ID> — Pauses listing on a specific channel for a SKU

When recommending an action, include the exact action string so the user can trigger it.

Guidelines:
- Be concise and data-driven. Use specific numbers from the data.
- When discussing inventory, reference exact counts from each system and the true ATP.
- When discussing tariffs, reference current rates, proposed rates, and calculate impact.
- When discussing returns, reference the frozen value and average days stuck.
- Flag discrepancies and risks proactively.
- Provide actionable recommendations with specific action commands when relevant.
- Format responses clearly with line breaks for readability.
- If asked about something not in the data, say so honestly.
- Keep responses under 200 words unless asked for detail."""


# ── Routes ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "NexusLink Supply Chain Data Fabric API is active"}


@app.get("/inventory")
async def get_inventory():
    data = store["data"]
    if not data:
        return {"error": "Data model not yet initialized"}
    inventory = enrich_inventory_with_forecasts(data.get("inventory", []))

    # Enrich alerts with root cause data
    enriched_alerts = []
    for alert in store["alerts"]:
        a = dict(alert)
        rc = get_root_cause(alert)
        if rc:
            a["root_cause"] = rc
        enriched_alerts.append(a)

    recommendations = build_action_recommendations(
        inventory=inventory,
        returns_data=data.get("returns", {}),
        alerts=enriched_alerts,
        tariffs=data.get("tariffs", []),
    )

    return {
        "inventory": inventory,
        "tariffs": data.get("tariffs", []),
        "returns": data.get("returns", {}),
        "alerts": enriched_alerts,
        "recommendations": recommendations,
        "supplier_risks": supplier_risk_leaderboard(),
        "demo_mode": bool(store.get("demo_mode")),
        "connections": store["connections"],
        "last_update": store["last_update"],
        "uptime": round(time.time() - store["boot_time"]),
    }


@app.get("/api/history")
async def get_history():
    """Return 7-day historical data for charts and sparklines."""
    return store.get("history", {})


@app.get("/api/health")
async def get_health():
    """Compute a 0-100 supply chain health score."""
    data = store["data"]
    if not data or "inventory" not in data:
        return {"score": 0, "breakdown": {}}

    inventory = data.get("inventory", [])
    returns = data.get("returns", {})
    alerts = store["alerts"]

    # Discrepancy score: fewer discrepancies = higher score (0-25)
    disc_count = sum(1 for i in inventory if i.get("discrepancy"))
    disc_score = max(0, 25 - disc_count * 5)

    # Risk value score: lower risk = higher score (0-25)
    total_risk = sum(i.get("risk_value", 0) for i in inventory)
    risk_score = max(0, 25 - min(25, total_risk / 5000))

    # Returns score: fewer stuck returns = higher score (0-25)
    stuck_days = returns.get("average_days_stuck", 0)
    frozen_val = returns.get("total_frozen_value", 0)
    returns_score = max(0, 25 - min(25, stuck_days * 0.5 + frozen_val / 5000))

    # Alert score: fewer critical alerts = higher score (0-25)
    critical_count = sum(1 for a in alerts if a.get("type") == "CRITICAL")
    warning_count = sum(1 for a in alerts if a.get("type") == "WARNING")
    alert_score = max(0, 25 - critical_count * 5 - warning_count * 2)

    total = round(disc_score + risk_score + returns_score + alert_score)
    total = max(0, min(100, total))

    return {
        "score": total,
        "breakdown": {
            "inventory_sync": round(disc_score),
            "risk_exposure": round(risk_score),
            "returns_flow": round(returns_score),
            "alert_health": round(alert_score),
        }
    }


@app.get("/api/recommendations")
async def get_recommendations():
    data = store.get("data", {})
    inventory = enrich_inventory_with_forecasts(data.get("inventory", []))
    recommendations = build_action_recommendations(
        inventory=inventory,
        returns_data=data.get("returns", {}),
        alerts=store.get("alerts", []),
        tariffs=data.get("tariffs", []),
    )
    return {
        "generated_at": int(time.time()),
        "demo_mode": bool(store.get("demo_mode")),
        "recommendations": recommendations,
    }


@app.get("/api/supplier-risks")
async def get_supplier_risks():
    leaderboard = supplier_risk_leaderboard()
    return {
        "total_suppliers": len(leaderboard),
        "suppliers": leaderboard,
    }


@app.post("/api/demo-mode")
async def set_demo_mode(payload: dict):
    raw_enabled = payload.get("enabled", False)
    if isinstance(raw_enabled, bool):
        enabled = raw_enabled
    else:
        enabled = str(raw_enabled).strip().lower() in ("1", "true", "yes", "on")

    store["demo_mode"] = enabled
    if not enabled:
        # Trigger one immediate tick so users can see drift resume right away.
        simulate_tick()
    store["last_update"] = time.time()
    return {
        "status": "success",
        "demo_mode": enabled,
        "message": "Demo mode enabled — simulation drift paused" if enabled else "Demo mode disabled — live simulation resumed",
    }


@app.post("/api/query")
async def query_intelligence(payload: dict):
    query = payload.get("query", "")
    history = payload.get("history", [])

    if not query.strip():
        return {"response": "Please ask a question about inventory, tariffs, or returns."}

    client = get_client()
    if not client:
        return {"response": "OPENAI_API_KEY not configured. Set it in backend/.env to enable AI queries."}

    context_data = {
        "inventory": store["data"].get("inventory", []),
        "tariffs": store["data"].get("tariffs", []),
        "returns": store["data"].get("returns", {}),
        "recent_alerts": store["alerts"][:5],
    }
    system = SYSTEM_PROMPT.format(context=json.dumps(context_data, indent=2))

    messages = [{"role": "system", "content": system}]

    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": query})

    try:
        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=1024,
            temperature=0.3,
            stream=True,
        )

        def generate():
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content

        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        return {"response": f"AI service error: {str(e)}"}


@app.post("/api/parse")
async def parse_document(payload: dict):
    text = payload.get("text", "")
    if not text.strip():
        return {"error": "No text provided"}

    client = get_client()
    if not client:
        return {"error": "OPENAI_API_KEY not configured."}

    inventory = store["data"].get("inventory", [])
    tariffs = store["data"].get("tariffs", [])
    alerts = store["alerts"][:10]

    parse_system = """You are NexusLink, an expert supply chain intelligence engine. Parse supplier documents and perform deep anomaly analysis by cross-referencing against live inventory, tariff, and alert data.

Return ONLY a JSON object (no markdown, no explanation) with these fields (include only fields found in the text):
- po_number, supplier, contact, style, quantity, unit_cost, ship_date, origin, hts_code, factory_load

- anomalies: Array of OBJECTS (not strings), each with:
  - "severity": "critical" | "warning" | "info"
  - "title": Short headline (e.g. "Unit Cost Escalation")
  - "detail": 1-2 sentence factual explanation with specific numbers
  - "impact": Dollar amount or percentage impact if calculable (e.g. "$4,000 added cost on this PO")
  - "recommendation": Actionable next step

Generate 4-6 anomalies by performing these analyses:
1. COST ANALYSIS: Compare unit cost to our records. Calculate total cost delta = (new_cost - old_cost) * quantity. Flag margin erosion.
2. LEAD TIME RISK: Compare ship date against reorder points & current available inventory. Will we stock out before shipment arrives? Calculate days of coverage = available_units / daily_sell_rate.
3. TARIFF EXPOSURE: Check origin country against upcoming tariff scenarios. Calculate landed cost with current vs proposed rates. Flag if HTS code falls under affected categories.
4. CAPACITY RISK: If factory load >85%, flag production bottleneck risk and potential for further delays.
5. INVENTORY CROSS-CHECK: Match style/SKU to current inventory. Flag channel discrepancies, oversell risk, or reorder urgency.
6. SUPPLIER CONCENTRATION: Note if this supplier/origin represents a single-source dependency.

Use real numbers from the data below. Be specific and quantitative — no vague statements.

LIVE INVENTORY:
""" + json.dumps(inventory, indent=2) + """

TARIFF SCENARIOS:
""" + json.dumps(tariffs, indent=2) + """

RECENT ALERTS:
""" + json.dumps(alerts[:5], indent=2)

    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": parse_system},
                {"role": "user", "content": f"Parse this document:\n\n{text}"},
            ],
            max_tokens=2048,
            temperature=0.1,
        )
        response_text = completion.choices[0].message.content

        try:
            start = response_text.index("{")
            end = response_text.rindex("}") + 1
            parsed = json.loads(response_text[start:end])

            if "anomalies" in parsed and parsed["anomalies"]:
                if isinstance(parsed["anomalies"][0], str):
                    parsed["anomalies"] = [
                        {"severity": "warning", "title": a, "detail": a, "impact": "", "recommendation": ""}
                        for a in parsed["anomalies"]
                    ]

            profile = score_supplier_risk(parsed)
            supplier_risk = upsert_supplier_risk(profile)
            return {"status": "success", "extracted": parsed, "supplier_risk": supplier_risk}
        except (ValueError, json.JSONDecodeError):
            return {"status": "success", "extracted": {"raw": response_text}}

    except Exception as e:
        return {"error": str(e)}


@app.post("/api/action")
async def execute_action(payload: dict):
    """Execute a supply chain action that mutates the live data."""
    global alert_counter
    action = payload.get("action", "")
    data = store["data"]

    if not data or "inventory" not in data:
        return {"error": "No data loaded"}

    if action.startswith("sync_inventory"):
        parts = action.split(":")
        sku_id = parts[1] if len(parts) > 1 else None

        synced = []
        for item in data["inventory"]:
            if sku_id and item["id"] != sku_id:
                continue
            if item["discrepancy"]:
                wms = item["systems"]["wms"]
                item["systems"]["shopify"] = wms
                item["systems"]["amazon"] = wms
                item["true_atp"] = wms
                item["discrepancy"] = False
                item["risk_value"] = 0
                synced.append(item["name"])

        if synced:
            alert_counter += 1
            store["alerts"].insert(0, {
                "id": f"ACT-{alert_counter}",
                "type": "INFO",
                "message": f"Inventory synced for {', '.join(synced)} — all channels now match WMS",
                "risk": 0,
                "action": None,
                "sku": sku_id,
                "time": "just now",
            })
            store["last_update"] = time.time()
            return {"status": "success", "message": f"Synced: {', '.join(synced)}"}
        store["last_update"] = time.time()
        return {"status": "no_change", "message": "No discrepancies to sync"}

    if action == "release_returns":
        returns = data.get("returns", {})
        released_value = returns.get("total_frozen_value", 0)
        returns["in_limbo"] = 0
        returns["total_frozen_value"] = 0
        returns["average_days_stuck"] = 0
        returns["items"] = []

        alert_counter += 1
        store["alerts"].insert(0, {
            "id": f"ACT-{alert_counter}",
            "type": "INFO",
            "message": f"Returns released — ${released_value:,} in frozen inventory returned to sellable ATP",
            "risk": 0,
            "action": None,
            "sku": None,
            "time": "just now",
        })
        store["last_update"] = time.time()
        return {"status": "success", "message": f"Released ${released_value:,} in returns"}

    if action.startswith("pause_channel"):
        parts = action.split(":")
        if len(parts) < 3:
            return {"error": "Format: pause_channel:<channel>:<SKU-ID>"}
        channel = parts[1].lower()
        sku_id = parts[2]

        for item in data["inventory"]:
            if item["id"] == sku_id and channel in item["systems"]:
                old_val = item["systems"][channel]
                if old_val <= 0:
                    store["last_update"] = time.time()
                    return {"status": "no_change", "message": f"{item['name']} already paused on {channel}"}
                item["systems"][channel] = 0

                alert_counter += 1
                store["alerts"].insert(0, {
                    "id": f"ACT-{alert_counter}",
                    "type": "INFO",
                    "message": f"{item['name']} paused on {channel.title()} (was {old_val} units)",
                    "risk": 0,
                    "action": None,
                    "sku": sku_id,
                    "time": "just now",
                })
                store["last_update"] = time.time()
                return {"status": "success", "message": f"Paused {item['name']} on {channel}"}

        return {"error": f"SKU {sku_id} or channel {channel} not found"}

    return {"error": f"Unknown action: {action}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
