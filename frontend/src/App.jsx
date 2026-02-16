import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/* ═══════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════════════════════════════════ */
const ToastCtx = createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((msg, type = "info") => {
    const id = ++idRef.current;
    setToasts(p => [...p.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: "12px 20px", borderRadius: 12, minWidth: 280, maxWidth: 400,
            background: t.type === "success" ? "rgba(34,197,94,0.15)" : t.type === "error" ? "rgba(239,68,68,0.15)" : t.type === "warning" ? "rgba(245,158,11,0.15)" : "rgba(96,165,250,0.15)",
            border: `1px solid ${t.type === "success" ? "rgba(34,197,94,0.3)" : t.type === "error" ? "rgba(239,68,68,0.3)" : t.type === "warning" ? "rgba(245,158,11,0.3)" : "rgba(96,165,250,0.3)"}`,
            color: t.type === "success" ? "#22c55e" : t.type === "error" ? "#f87171" : t.type === "warning" ? "#fbbf24" : "#60a5fa",
            fontSize: 13, fontWeight: 500, backdropFilter: "blur(16px)",
            animation: "toastIn 0.3s ease", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function useToast() { return useContext(ToastCtx); }

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATED NUMBER
   ═══════════════════════════════════════════════════════════════════════ */
function AnimNum({ value, prefix = "", suffix = "" }) {
  const [d, setD] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const e = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(e)) return;
    let s = prev.current;
    const dur = 600, step = (e - s) / (dur / 16);
    if (Math.abs(step) < 0.001) { setD(e); prev.current = e; return; }
    const t = setInterval(() => {
      s += step;
      if ((step > 0 && s >= e) || (step < 0 && s <= e)) { setD(e); prev.current = e; clearInterval(t); }
      else setD(Math.round(s));
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <span>{prefix}{d.toLocaleString()}{suffix}</span>;
}

/* ─── Stat Card ─── */
function Card({ label, value, sub, color = "#60a5fa", delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: "22px 18px",
      opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(16px)",
      transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HEALTH SCORE RING
   ═══════════════════════════════════════════════════════════════════════ */
function HealthRing({ score }) {
  const radius = 16, stroke = 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#fbbf24" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 18, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <svg width={38} height={38} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={19} cy={19} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={19} cy={19} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s" }} />
      </svg>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1 }}>Health</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CONNECTION STATUS PANEL
   ═══════════════════════════════════════════════════════════════════════ */
function ConnectionPanel({ connections }) {
  const systems = [
    { key: "shopify", label: "Shopify", icon: "🛍️" },
    { key: "amazon", label: "Amazon", icon: "📦" },
    { key: "wms", label: "WMS/NetSuite", icon: "🏭" },
    { key: "shipbob", label: "ShipBob", icon: "🚚" },
    { key: "pos", label: "POS", icon: "💳" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, padding: "10px 28px", borderBottom: "1px solid rgba(255,255,255,0.04)", overflowX: "auto" }}>
      {systems.map(s => {
        const conn = connections?.[s.key] || {};
        const status = conn.status || "unknown";
        const dotColor = status === "connected" ? "#22c55e" : status === "degraded" ? "#fbbf24" : "#ef4444";
        const ago = conn.last_sync ? Math.round((Date.now() / 1000 - conn.last_sync)) : 0;
        const agoStr = ago < 60 ? `${ago}s ago` : ago < 3600 ? `${Math.floor(ago / 60)}m ago` : `${Math.floor(ago / 3600)}h ago`;
        return (
          <div key={s.key} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 14px",
            borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 13 }}>{s.icon}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}50` }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>
                {conn.latency_ms ? `${conn.latency_ms}ms · ${agoStr}` : "—"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANOMALY PULSE MAP
   ═══════════════════════════════════════════════════════════════════════ */
function PulseMap({ inventory }) {
  const nodes = [
    { id: "shopify", label: "Shopify", x: 15, y: 30 },
    { id: "amazon", label: "Amazon", x: 85, y: 30 },
    { id: "wms", label: "WMS", x: 50, y: 10 },
    { id: "pos", label: "POS", x: 15, y: 70 },
    { id: "shipbob", label: "ShipBob", x: 85, y: 70 },
  ];
  const edges = [
    ["shopify", "wms"], ["amazon", "wms"], ["wms", "shipbob"], ["wms", "pos"], ["shopify", "pos"],
  ];

  const anomalyChannels = new Set();
  inventory.forEach(item => {
    if (item.discrepancy) {
      if (item.systems.shopify !== item.systems.wms) { anomalyChannels.add("shopify"); anomalyChannels.add("wms"); }
      if (Math.abs(item.systems.amazon - item.systems.wms) > 5) { anomalyChannels.add("amazon"); anomalyChannels.add("wms"); }
    }
  });

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  return (
    <div style={{ position: "relative", height: 120, marginBottom: 20, background: "rgba(255,255,255,0.015)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", top: 0, left: 0 }}>
        {edges.map(([a, b], i) => {
          const na = nodeMap[a], nb = nodeMap[b];
          const hasAnomaly = anomalyChannels.has(a) && anomalyChannels.has(b);
          return (
            <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={hasAnomaly ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"} strokeWidth={hasAnomaly ? 0.5 : 0.3}
              style={hasAnomaly ? { animation: "edgePulse 2s ease infinite" } : {}} />
          );
        })}
        {nodes.map(n => {
          const isAnomaly = anomalyChannels.has(n.id);
          return (
            <g key={n.id}>
              {isAnomaly && <circle cx={n.x} cy={n.y} r={4} fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth={0.3} style={{ animation: "nodePulse 1.5s ease infinite" }} />}
              <circle cx={n.x} cy={n.y} r={2.5} fill={isAnomaly ? "#ef4444" : "#60a5fa"} />
              <text x={n.x} y={n.y + 6} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={3} fontFamily="-apple-system, sans-serif">{n.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", top: 8, left: 12, fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: 1.5 }}>Channel Network</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CAUSAL CHAIN VISUALIZER
   ═══════════════════════════════════════════════════════════════════════ */
function CausalChain({ chain, onClose }) {
  if (!chain || !chain.length) return null;
  const colors = ["#f87171", "#fbbf24", "#fb923c", "#22c55e"];
  return (
    <div style={{
      margin: "16px 0", padding: 16, borderRadius: 14,
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      animation: "fadeUp 0.3s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.3)" }}>Causal Chain Analysis</span>
        {onClose && <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14 }}>✕</button>}
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
        {chain.map((node, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              flex: 1, padding: "10px 12px", borderRadius: 10,
              background: `${colors[i]}08`, border: `1px solid ${colors[i]}20`,
            }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors[i], marginBottom: 4, fontWeight: 600 }}>{node.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{node.text}</div>
            </div>
            {i < chain.length - 1 && <div style={{ padding: "0 6px", color: "rgba(255,255,255,0.15)", fontSize: 16 }}>→</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsPanel({ recommendations, onAction }) {
  if (!recommendations || recommendations.length === 0) return null;
  const actionable = recommendations.filter(rec => !!rec.command);
  const strategic = recommendations.filter(rec => !rec.command);
  return (
    <div style={{ marginBottom: 18, padding: 14, borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.6, color: "rgba(255,255,255,0.32)", marginBottom: 10 }}>
        AI Action Recommendations
      </div>
      {actionable.length === 0 && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", padding: "8px 4px" }}>
          No executable actions right now. Turn demo mode off or wait for fresh drift.
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {actionable.map((rec) => (
          <div key={`${rec.rank}-${rec.title}`} style={{
            padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 12, alignItems: "center",
          }}>
            <div style={{ minWidth: 26, height: 26, borderRadius: 999, background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#60a5fa", fontWeight: 700 }}>
              {rec.rank}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", fontWeight: 600 }}>{rec.title}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{rec.rationale}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 3 }}>
                Score {rec.score} · Est. impact ${(rec.expected_risk_reduction_usd || 0).toLocaleString()}
              </div>
            </div>
            <button onClick={() => onAction(rec.command)} style={{
              padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)",
              background: "rgba(34,197,94,0.12)", color: "#22c55e", fontSize: 10, fontWeight: 700, cursor: "pointer",
            }}>
              Execute
            </button>
          </div>
        ))}
      </div>
      {strategic.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(251,191,36,0.72)" }}>
          {strategic.length} strategy recommendation available in Tariffs tab (non-executable).
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SKU DETAIL MODAL
   ═══════════════════════════════════════════════════════════════════════ */
function SKUModal({ item, historyData, alerts, onAction, onClose }) {
  if (!item) return null;
  const sparkData = historyData?.sparkline?.map((v, i) => ({ i, v })) || [];
  const skuAlerts = alerts.filter(a => a.sku === item.id);
  const rootCause = skuAlerts.find(a => a.root_cause)?.root_cause;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeUp 0.2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(680px, 90vw)", maxHeight: "85vh", overflow: "auto",
        background: "#0d1117", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
        padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{item.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{item.id} · {item.category} · {item.country_of_origin}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 16, width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Channel Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Shopify", val: item.systems.shopify, color: "#60a5fa" },
            { label: "Amazon", val: item.systems.amazon, color: "#fbbf24" },
            { label: "WMS", val: item.systems.wms, color: "#22c55e" },
            { label: "POS", val: item.systems.pos, color: "#a78bfa" },
          ].map(ch => (
            <div key={ch.label} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>{ch.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: ch.color }}>{ch.val}</div>
            </div>
          ))}
        </div>

        {/* Sparkline enlarged */}
        {sparkData.length > 0 && (
          <div style={{ marginBottom: 20, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>7-Day Demand Trend</div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={sparkData}>
                <defs><linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} /><stop offset="100%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="v" stroke="#60a5fa" fill="url(#modalGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Key metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.25)" }}>True ATP</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa", marginTop: 4 }}>{item.true_atp}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.25)" }}>Risk Value</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: item.risk_value > 0 ? "#fbbf24" : "rgba(255,255,255,0.15)", marginTop: 4 }}>{item.risk_value > 0 ? `$${(item.risk_value / 1000).toFixed(1)}K` : "—"}</div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.25)" }}>Lead Time</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{item.lead_time_days}d</div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.25)" }}>Stockout (7d)</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: (item.stockout_forecast?.risk_7d || 0) >= 60 ? "#f87171" : "#fbbf24", marginTop: 4 }}>
              {item.stockout_forecast?.risk_7d != null ? `${item.stockout_forecast.risk_7d}%` : "—"}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
              {item.stockout_forecast?.days_to_stockout != null ? `~${item.stockout_forecast.days_to_stockout}d cover` : "No forecast"}
            </div>
          </div>
        </div>

        {/* Causal chain if discrepancy */}
        {rootCause && <CausalChain chain={rootCause.chain} />}

        {/* Recent alerts for this SKU */}
        {skuAlerts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>Recent Alerts</div>
            {skuAlerts.slice(0, 3).map((a, i) => (
              <div key={i} style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 4, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                <span style={{ color: a.type === "CRITICAL" ? "#f87171" : a.type === "WARNING" ? "#fbbf24" : "#60a5fa", fontWeight: 600, fontSize: 9, marginRight: 6 }}>{a.type}</span>
                {a.message}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {item.discrepancy && (
            <button onClick={() => { onAction(`sync_inventory:${item.id}`); onClose(); }} style={{
              flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
              background: "#60a5fa", color: "#07090f", fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>Sync to WMS</button>
          )}
          <button onClick={() => { onAction(`pause_channel:shopify:${item.id}`); onClose(); }} style={{
            flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)",
            background: "rgba(245,158,11,0.08)", color: "#fbbf24", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>Pause Shopify</button>
          <button onClick={() => { onAction(`pause_channel:amazon:${item.id}`); onClose(); }} style={{
            flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(251,146,60,0.2)",
            background: "rgba(251,146,60,0.08)", color: "#fb923c", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>Pause Amazon</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INVENTORY TAB (with chart, sparklines, search, filter)
   ═══════════════════════════════════════════════════════════════════════ */
function InventoryTab({ inventory, onAction, historyData, alerts, recommendations, onSelectSKU }) {
  const [hov, setHov] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [chainSKU, setChainSKU] = useState(null);
  const searchRef = useRef(null);

  const disc = inventory.filter(d => d.risk_value > 0).length;
  const totalRisk = inventory.reduce((a, b) => a + b.risk_value, 0);
  const criticals = inventory.filter(d => d.discrepancy).length;

  // Chart data: aggregate daily totals from history
  const chartData = (() => {
    const days = {};
    Object.values(historyData || {}).forEach(sku => {
      (sku.hourly || []).forEach(h => {
        const key = h.day;
        if (!days[key]) days[key] = { day: `Day ${key + 1}`, shopify: 0, amazon: 0, wms: 0 };
        days[key].shopify += h.shopify;
        days[key].amazon += h.amazon;
        days[key].wms += h.wms;
      });
    });
    return Object.values(days).sort((a, b) => a.day.localeCompare(b.day)).map(d => ({
      ...d,
      shopify: Math.round(d.shopify / 24),
      amazon: Math.round(d.amazon / 24),
      wms: Math.round(d.wms / 24),
    }));
  })();

  // Filter and sort inventory
  let items = [...inventory];
  if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()));
  if (filter === "critical") {
    items = items.filter(i => i.discrepancy && i.risk_value > 5000);
  } else if (filter === "warning") {
    items = items.filter(i => {
      const hasLowRiskDisc = i.discrepancy && i.risk_value <= 5000 && i.risk_value > 0;
      const nearReorder = typeof i.available === "number" && typeof i.reorder_point === "number" && i.available <= i.reorder_point;
      return hasLowRiskDisc || nearReorder;
    });
  } else if (filter === "ok") {
    items = items.filter(i => {
      const nearReorder = typeof i.available === "number" && typeof i.reorder_point === "number" && i.available <= i.reorder_point;
      return !i.discrepancy && !nearReorder;
    });
  }

  if (sortBy === "risk") items.sort((a, b) => b.risk_value - a.risk_value);
  else if (sortBy === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "atp") items.sort((a, b) => a.true_atp - b.true_atp);

  const cols = ["Product", "SKU", "Shopify", "Amazon", "WMS", "POS", "Velocity", "True ATP", "Risk", ""];

  // Expose searchRef for keyboard shortcut
  InventoryTab.searchRef = searchRef;

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <Card label="Discrepancies" value={<AnimNum value={disc} />} sub="Across all channels" color="#f87171" delay={0} />
        <Card label="SKUs Tracked" value={<AnimNum value={inventory.length} />} sub="Real-time sync active" color="#60a5fa" delay={80} />
        <Card label="Capital at Risk" value={<AnimNum value={totalRisk} prefix="$" />} sub="From inventory gaps" color="#fbbf24" delay={160} />
        <Card label="Critical" value={<AnimNum value={criticals} />} sub="Needs immediate action" color="#f87171" delay={240} />
      </div>

      <RecommendationsPanel recommendations={recommendations} onAction={onAction} />

      {/* Pulse Map */}
      <PulseMap inventory={inventory} />

      {/* Area Chart */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 20, padding: "14px 14px 8px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", marginBottom: 10, paddingLeft: 4 }}>7-Day Channel Inventory (Avg)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gShop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity={0.2} /><stop offset="100%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient>
                <linearGradient id="gAmz" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fbbf24" stopOpacity={0.2} /><stop offset="100%" stopColor="#fbbf24" stopOpacity={0} /></linearGradient>
                <linearGradient id="gWms" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }} />
              <Area type="monotone" dataKey="shopify" stroke="#60a5fa" fill="url(#gShop)" strokeWidth={1.5} name="Shopify" />
              <Area type="monotone" dataKey="amazon" stroke="#fbbf24" fill="url(#gAmz)" strokeWidth={1.5} name="Amazon" />
              <Area type="monotone" dataKey="wms" stroke="#22c55e" fill="url(#gWms)" strokeWidth={1.5} name="WMS" />
              <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Search + Filter Bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 300 }}>
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products or SKUs..."
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", fontSize: 12, outline: "none" }} />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.2)" }}>🔍</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["all", "critical", "warning", "ok"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 12px", borderRadius: 8, border: "1px solid",
              borderColor: filter === f ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.06)",
              background: filter === f ? "rgba(96,165,250,0.08)" : "transparent",
              color: filter === f ? "#60a5fa" : "rgba(255,255,255,0.3)",
              fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {[{ id: "risk", label: "Risk ↓" }, { id: "name", label: "Name" }, { id: "atp", label: "ATP ↑" }].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)} style={{
              padding: "6px 10px", borderRadius: 8, border: "1px solid",
              borderColor: sortBy === s.id ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.06)",
              background: sortBy === s.id ? "rgba(96,165,250,0.08)" : "transparent",
              color: sortBy === s.id ? "#60a5fa" : "rgba(255,255,255,0.3)",
              fontSize: 10, cursor: "pointer",
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Inline Causal Chain */}
      {chainSKU && (() => {
        const item = inventory.find(i => i.id === chainSKU);
        const alert = alerts.find(a => a.sku === chainSKU && a.root_cause);
        if (!item || !alert?.root_cause) return null;
        return <CausalChain chain={alert.root_cause.chain} onClose={() => setChainSKU(null)} />;
      })()}

      {/* Inventory List */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Unified Inventory Truth</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "glow 2s ease infinite" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Live — updates every 5s</span>
          </div>
        </div>
        {/* Header Row */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px 1fr 1fr 70px", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {cols.map(h => (
            <div key={h} style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", fontWeight: 500, textAlign: h === "Product" ? "left" : "right", paddingRight: h === "" ? 0 : 4 }}>{h}</div>
          ))}
        </div>
        {/* Empty State */}
        {items.length === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            No items match the &ldquo;{filter}&rdquo; filter.
            <button onClick={() => { setFilter("all"); setSearch(""); }} style={{ marginLeft: 8, padding: "4px 12px", borderRadius: 6, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Show All</button>
          </div>
        )}
        {/* Data Rows */}
        {items.map((item, i) => {
          const shopDisc = item.systems.shopify !== item.systems.wms && item.risk_value > 0;
          const amzDisc = Math.abs(item.systems.amazon - item.systems.wms) > 5 && item.risk_value > 0;
          const nearReorder = item.available != null && item.reorder_point != null && item.available <= item.reorder_point;
          const status = item.discrepancy ? (item.risk_value > 5000 ? "critical" : "warning") : nearReorder ? "warning" : "ok";
          const skuHistory = historyData ? historyData[item.id] : null;
          const sparkVals = skuHistory && skuHistory.sparkline ? skuHistory.sparkline : [];
          const trend = sparkVals.length > 1 ? (sparkVals[sparkVals.length - 1] > sparkVals[0] ? "up" : "down") : null;

          return (
            <div key={item.id}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              onClick={() => onSelectSKU(item)}
              style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px 1fr 1fr 70px",
                padding: "12px 14px", alignItems: "center", cursor: "pointer",
                background: hov === i ? "rgba(255,255,255,0.03)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.025)", transition: "background 0.15s",
              }}>
              {/* Product */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: status === "critical" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#22c55e", boxShadow: status === "critical" ? "0 0 8px rgba(239,68,68,0.4)" : "none" }} />
                <span>{item.name}</span>
                {item.stockout_forecast?.risk_7d != null && (
                  <span style={{
                    fontSize: 9, padding: "2px 6px", borderRadius: 999,
                    background: item.stockout_forecast.risk_7d >= 60 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.14)",
                    border: item.stockout_forecast.risk_7d >= 60 ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(245,158,11,0.24)",
                    color: item.stockout_forecast.risk_7d >= 60 ? "#f87171" : "#fbbf24",
                    fontWeight: 700,
                  }}>
                    {item.stockout_forecast.risk_7d}% 7d
                  </span>
                )}
              </div>
              {/* SKU */}
              <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{item.id}</div>
              {/* Shopify */}
              <div style={{ textAlign: "right", fontSize: 13, color: shopDisc ? "#f87171" : "rgba(255,255,255,0.5)", fontWeight: shopDisc ? 700 : 400 }}>{item.systems.shopify}{shopDisc ? " !" : ""}</div>
              {/* Amazon */}
              <div style={{ textAlign: "right", fontSize: 13, color: amzDisc ? "#fbbf24" : "rgba(255,255,255,0.5)" }}>{item.systems.amazon}</div>
              {/* WMS */}
              <div style={{ textAlign: "right", fontSize: 13, color: "#60a5fa", fontWeight: 600 }}>{item.systems.wms}</div>
              {/* POS */}
              <div style={{ textAlign: "right", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{item.systems.pos}</div>
              {/* Velocity (bar sparkline) */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 1, height: 20 }}>
                {sparkVals.length > 1 ? (() => {
                  const mn = Math.min(...sparkVals);
                  const mx = Math.max(...sparkVals);
                  const range = mx - mn || 1;
                  return sparkVals.slice(-7).map((v, bi) => (
                    <div key={bi} style={{
                      width: 4, borderRadius: 1,
                      height: Math.max(3, Math.round(((v - mn) / range) * 16)),
                      background: status === "critical" ? "rgba(248,113,113,0.6)" : trend === "up" ? "rgba(96,165,250,0.5)" : "rgba(251,191,36,0.5)",
                    }} />
                  ));
                })() : null}
                {trend && <span style={{ fontSize: 8, color: trend === "up" ? "#60a5fa" : "#fbbf24", marginLeft: 2 }}>{trend === "up" ? "\u2191" : "\u2193"}</span>}
              </div>
              {/* True ATP */}
              <div style={{ textAlign: "right", fontSize: 13, color: "#60a5fa", fontWeight: 700 }}>{item.true_atp}</div>
              {/* Risk */}
              <div style={{ textAlign: "right", fontSize: 13, color: item.risk_value > 0 ? "#fbbf24" : "rgba(255,255,255,0.15)", fontWeight: item.risk_value > 0 ? 600 : 400, lineHeight: 1.2 }}>
                {item.risk_value > 0 ? `$${(item.risk_value / 1000).toFixed(1)}K` : "\u2014"}
                {item.stockout_forecast?.risk_14d != null && (
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>
                    {item.stockout_forecast.risk_14d}% 14d
                  </div>
                )}
              </div>
              {/* Action */}
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                {item.discrepancy && (
                  <>
                    <button onClick={() => onAction(`sync_inventory:${item.id}`)} style={{
                      padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(96,165,250,0.2)",
                      background: "rgba(96,165,250,0.08)", color: "#60a5fa", fontSize: 9,
                      fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
                    }}>Sync</button>
                    <button onClick={() => setChainSKU(chainSKU === item.id ? null : item.id)} style={{
                      padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(251,191,36,0.2)",
                      background: chainSKU === item.id ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.05)",
                      color: "#fbbf24", fontSize: 9, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
                    }}>Why?</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TARIFF TAB (with interactive scenario strategy)
   ═══════════════════════════════════════════════════════════════════════ */
function TariffTab({ inventory, tariffs }) {
  const [sel, setSel] = useState("full");
  const [strategy, setStrategy] = useState("doNothing");

  const tariffRows = tariffs.map(t => {
    const affected = inventory.filter(i => i.country_of_origin === t.country);
    const proposed = t.scenarios[0]?.rate || t.current_rate;
    const avgCost = affected.length > 0 ? affected.reduce((a, b) => a + (b.unit_cost || 28.40), 0) / affected.length : 28.40;
    const currentLanded = avgCost * (1 + t.current_rate);
    const newLanded = avgCost * (1 + proposed);
    const annualImpact = affected.reduce((acc, i) => acc + (i.true_atp || 0) * (newLanded - currentLanded) * 4, 0);

    // Strategy-specific costs
    const mexicoLanded = avgCost * 0.85 * (1 + 0.05);
    const shiftSavings = t.country !== "Mexico" ? affected.reduce((acc, i) => acc + (i.true_atp || 0) * (newLanded - mexicoLanded) * 4, 0) : 0;
    const splitSavings = shiftSavings * 0.4;

    return { ...t, proposed, affected: affected.length, currentLanded, newLanded, annualImpact, avgCost, mexicoLanded, shiftSavings, splitSavings };
  });

  const filteredRows = sel === "full" ? tariffRows : tariffRows.filter(r => r.country.toLowerCase() === sel.toLowerCase());
  const totalImpact = filteredRows.reduce((a, b) => a + Math.max(0, b.annualImpact), 0);
  const totalAffected = filteredRows.reduce((a, b) => a + b.affected, 0);

  // Strategy-adjusted metrics
  const strategySavings = strategy === "shiftMexico"
    ? filteredRows.reduce((a, b) => a + b.shiftSavings, 0)
    : strategy === "splitSource"
      ? filteredRows.reduce((a, b) => a + b.splitSavings, 0)
      : 0;
  const adjustedImpact = totalImpact - strategySavings;

  const allDates = tariffs.flatMap(t => t.scenarios.map(s => s.effective_date)).filter(Boolean);
  const now = new Date();
  const daysToAct = allDates.length > 0 ? Math.max(0, Math.round((new Date(allDates.sort()[0]) - now) / (1000 * 60 * 60 * 24))) : 0;

  const impactSorted = [...tariffRows].filter(r => r.annualImpact > 0).sort((a, b) => b.annualImpact - a.annualImpact);
  const topThreat = impactSorted[0];
  const cheapestAlt = [...tariffRows].sort((a, b) => a.newLanded - b.newLanded)[0];

  // Bar chart data
  const scenarioData = tariffRows.map(t => {
    const doNothing = Math.round(t.avgCost * (1 + t.proposed) * t.affected * 12);
    const shiftMexico = t.country === "Mexico" ? Math.round(t.avgCost * (1 + 0.05) * t.affected * 12) : Math.round(t.avgCost * 0.85 * (1 + 0.05) * t.affected * 12);
    const splitSource = Math.round((doNothing * 0.6 + shiftMexico * 0.4));
    return { country: t.country, doNothing, shiftMexico, splitSource };
  });

  const strategies = [
    { id: "doNothing", label: "Do Nothing", desc: "Accept new tariff rates", color: "#f87171", icon: "⚠️" },
    { id: "shiftMexico", label: "Shift to Mexico", desc: "Move production to Monterrey", color: "#22c55e", icon: "🇲🇽" },
    { id: "splitSource", label: "Split Sourcing", desc: "60/40 current/Mexico split", color: "#60a5fa", icon: "⚖️" },
  ];

  return (
    <div>
      {/* Country filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { id: "vietnam", label: `\u{1F1FB}\u{1F1F3} Vietnam ${(tariffs.find(t => t.country === "Vietnam")?.current_rate * 100 || 0).toFixed(0)}\u2192${(tariffs.find(t => t.country === "Vietnam")?.scenarios[0]?.rate * 100 || 0).toFixed(0)}%` },
          { id: "china", label: `\u{1F1E8}\u{1F1F3} China ${(tariffs.find(t => t.country === "China")?.current_rate * 100 || 0).toFixed(0)}\u2192${(tariffs.find(t => t.country === "China")?.scenarios[0]?.rate * 100 || 0).toFixed(0)}%` },
          { id: "full", label: "All Countries" },
        ].map(s => (
          <button key={s.id} onClick={() => setSel(s.id)} style={{
            padding: "7px 14px", borderRadius: 8, border: "1px solid",
            borderColor: sel === s.id ? "rgba(96,165,250,0.35)" : "rgba(255,255,255,0.06)",
            background: sel === s.id ? "rgba(96,165,250,0.08)" : "transparent",
            color: sel === s.id ? "#60a5fa" : "rgba(255,255,255,0.35)",
            fontSize: 11, cursor: "pointer", transition: "all 0.2s"
          }}>{s.label}</button>
        ))}
      </div>

      {/* Strategy Selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {strategies.map(s => (
          <button key={s.id} onClick={() => setStrategy(s.id)} style={{
            padding: "16px 14px", borderRadius: 14, border: "2px solid",
            borderColor: strategy === s.id ? `${s.color}40` : "rgba(255,255,255,0.04)",
            background: strategy === s.id ? `${s.color}08` : "rgba(255,255,255,0.015)",
            cursor: "pointer", textAlign: "left", transition: "all 0.3s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: strategy === s.id ? s.color : "rgba(255,255,255,0.6)" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{s.desc}</div>
            {strategy === s.id && (
              <div style={{ marginTop: 8, fontSize: 11, color: s.color, fontWeight: 600 }}>
                {s.id === "doNothing" ? `+$${(totalImpact / 1000).toFixed(1)}K annual cost` :
                  `Saves $${(strategySavings / 1000).toFixed(1)}K/yr`}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Stat Cards (react to strategy) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {strategy === "doNothing" ? (
          <Card label="Annual Impact" value={<AnimNum value={Math.round(totalImpact)} prefix="$" />} sub="If no action taken" color="#f87171" />
        ) : adjustedImpact > 0 ? (
          <Card label="Remaining Cost" value={<AnimNum value={Math.round(adjustedImpact)} prefix="$" />} sub={`After ${strategy === "shiftMexico" ? "Mexico shift" : "split sourcing"}`} color="#fbbf24" />
        ) : (
          <Card label="Net Savings" value={<AnimNum value={Math.round(Math.abs(adjustedImpact))} prefix="$" />} sub="Saves more than the tariff cost" color="#22c55e" />
        )}
        <Card label="SKUs Affected" value={<AnimNum value={totalAffected} />} sub={`Across ${filteredRows.length} countries`} color="#fbbf24" delay={80} />
        <Card label="Days to Act" value={<AnimNum value={daysToAct} />} sub="Before new rates" color="#60a5fa" delay={160} />
      </div>

      {/* Scenario Comparison Chart */}
      {scenarioData.length > 0 && (
        <div style={{ padding: "14px 14px 8px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 20 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", marginBottom: 8, paddingLeft: 4 }}>Annual Cost by Strategy</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scenarioData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="country" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }} formatter={v => `$${v.toLocaleString()}`} />
              <Bar dataKey="doNothing" fill={strategy === "doNothing" ? "#f87171" : "rgba(248,113,113,0.25)"} name="Do Nothing" radius={[4, 4, 0, 0]} />
              <Bar dataKey="shiftMexico" fill={strategy === "shiftMexico" ? "#22c55e" : "rgba(34,197,94,0.25)"} name="Shift to Mexico" radius={[4, 4, 0, 0]} />
              <Bar dataKey="splitSource" fill={strategy === "splitSource" ? "#60a5fa" : "rgba(96,165,250,0.25)"} name="Split Sourcing" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Landed Cost Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Landed Cost by Country</span>
        </div>
        {filteredRows.map((item, i) => {
          const up = item.proposed > item.current_rate;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 0.5fr 1fr", padding: "12px 20px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{item.country}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{(item.current_rate * 100).toFixed(0)}%</div>
              <div style={{ textAlign: "right", fontSize: 13, color: up ? "#f87171" : "#22c55e", fontWeight: up ? 700 : 400 }}>{(item.proposed * 100).toFixed(0)}%{up ? " \u2191" : ""}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>${item.currentLanded.toFixed(2)}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: up ? "#fbbf24" : "rgba(255,255,255,0.4)", fontWeight: up ? 600 : 400 }}>${item.newLanded.toFixed(2)}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{item.affected}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: item.annualImpact > 0 ? "#f87171" : "rgba(255,255,255,0.15)", fontWeight: item.annualImpact > 0 ? 700 : 400 }}>
                {item.annualImpact > 0 ? `+$${(item.annualImpact / 1000).toFixed(1)}K` : "\u2014"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Causal Chain for tariff threat */}
      {topThreat && (
        <CausalChain chain={[
          { label: "Threat", text: `${topThreat.country} tariff ${(topThreat.current_rate * 100).toFixed(0)}% \u2192 ${(topThreat.proposed * 100).toFixed(0)}% in ${daysToAct} days` },
          { label: "Exposure", text: `${topThreat.affected} SKUs, $${(totalImpact / 1000).toFixed(1)}K annual cost increase` },
          { label: "Strategy", text: strategy === "doNothing" ? "No action planned \u2014 full impact absorbed" : strategy === "shiftMexico" ? `Shift to Mexico: saves $${(strategySavings / 1000).toFixed(1)}K/yr` : `Split sourcing 60/40: saves $${(strategySavings / 1000).toFixed(1)}K/yr` },
          { label: "Action", text: strategy === "doNothing" ? "Select a mitigation strategy above" : `Execute ${strategy === "shiftMexico" ? "Mexico shift" : "split sourcing"} before ${allDates[0] || "deadline"}` },
        ]} />
      )}

      {/* Recommendation */}
      {topThreat && cheapestAlt && topThreat.country !== cheapestAlt.country && (
        <div style={{ marginTop: 16, padding: 18, borderRadius: 14, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#22c55e", marginBottom: 6 }}>AI Recommendation</div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: 0 }}>
            Shift production from {topThreat.country} (landed ${topThreat.newLanded.toFixed(2)}/unit post-tariff) to{" "}
            <strong style={{ color: "#22c55e" }}>{cheapestAlt.country}</strong> (landed ${cheapestAlt.newLanded.toFixed(2)}/unit).{" "}
            Potential annual savings: <strong style={{ color: "#22c55e" }}>${totalImpact >= 1000000 ? `${(totalImpact / 1000000).toFixed(2)}M` : `${(totalImpact / 1000).toFixed(1)}K`}</strong> across {topThreat.affected} affected SKUs.{" "}
            {daysToAct > 0 ? `${daysToAct} days to act before new rates take effect.` : "New rates are already in effect."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AI QUERY TAB
   ═══════════════════════════════════════════════════════════════════════ */
function AITab({ onAction }) {
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState([{ role: "sys", text: "NexusLink AI connected. Powered by GPT-4o with live data access. Ask me anything about inventory, tariffs, or returns — I can also take actions like syncing inventory." }]);
  const [typing, setTyping] = useState(false);
  const ref = useRef(null);
  const toast = useToast();

  const send = useCallback(() => {
    if (!q.trim() || typing) return;
    const userQuery = q;
    setMsgs(p => [...p, { role: "user", text: userQuery }]);
    setQ("");
    setTyping(true);

    const history = msgs
      .filter(m => m.role === "user" || m.role === "ai")
      .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    fetch(`${API}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userQuery, history }),
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMsgs(p => [...p, { role: "ai", text: err.response || "Error connecting to AI." }]);
        setTyping(false);
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/plain")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        setMsgs(p => [...p, { role: "ai", text: "" }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const current = accumulated;
          setMsgs(p => { const u = [...p]; u[u.length - 1] = { role: "ai", text: current }; return u; });
        }
        setTyping(false);
      } else {
        const data = await res.json();
        setMsgs(p => [...p, { role: "ai", text: data.response || "No response." }]);
        setTyping(false);
      }
    }).catch(() => {
      setMsgs(p => [...p, { role: "ai", text: "Failed to reach AI service." }]);
      setTyping(false);
    });
  }, [q, msgs, typing]);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const sugg = [
    "What's happening with the Alpine Ridge Jacket?",
    "Show Vietnam tariff exposure",
    "Returns stuck in limbo?",
    "Which SKUs are critical right now?",
  ];

  const renderMessage = (text) => {
    const actionRegex = /(sync_inventory:\S+|release_returns|pause_channel:\S+:\S+)/g;
    const parts = text.split(actionRegex);
    return parts.map((part, i) => {
      if (part.match(actionRegex)) {
        return (
          <button key={i} onClick={() => { onAction(part); toast("Action triggered: " + part, "success"); }} style={{
            display: "inline-block", margin: "4px 2px", padding: "3px 10px", borderRadius: 6,
            background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.25)",
            color: "#60a5fa", fontSize: 11, fontWeight: 600, cursor: "pointer"
          }}>
            ▶ {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "min(calc(100vh - 200px), 640px)" }}>
      <div style={{ flex: 1, overflow: "auto", paddingRight: 4, marginBottom: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "78%", padding: "12px 16px", borderRadius: 14,
              background: m.role === "user" ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${m.role === "user" ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.05)"}`,
              fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap"
            }}>
              {m.role === "ai" ? renderMessage(m.text) : m.text}
            </div>
          </div>
        ))}
        {typing && msgs[msgs.length - 1]?.text === "" && (
          <div style={{ display: "flex", gap: 5, padding: "10px 16px" }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#60a5fa", opacity: 0.4, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
          </div>
        )}
        <div ref={ref} />
      </div>
      {msgs.length <= 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {sugg.map((s, i) => (
            <button key={i} onClick={() => setQ(s)} style={{
              padding: "6px 12px", borderRadius: 18, background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)",
              fontSize: 11, cursor: "pointer", transition: "all 0.2s"
            }}>{s}</button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, padding: 5, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about inventory, tariffs, suppliers, returns..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.75)", fontSize: 13, padding: "10px 12px" }} />
        <button onClick={send} disabled={typing} style={{
          padding: "10px 18px", borderRadius: 10, background: typing ? "rgba(96,165,250,0.3)" : "#60a5fa",
          border: "none", color: "#07090f", fontSize: 12, fontWeight: 700, cursor: typing ? "default" : "pointer"
        }}>Send</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PARSER TAB
   ═══════════════════════════════════════════════════════════════════════ */
function ParserTab() {
  const [parsed, setParsed] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [extractedFields, setExtractedFields] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [supplierRisk, setSupplierRisk] = useState(null);
  const [supplierLeaderboard, setSupplierLeaderboard] = useState([]);

  const defaultEmail = `From: nguyen.thanh@vietextile.com
To: sourcing@ridgelineoutdoor.com
Subject: RE: PO #VT-2024-0892 — Updated Lead Time

Hi Sarah,

Please note the following updates for PO #VT-2024-0892:

- Style: AR-4420 Alpine Ridge Jacket
- Quantity: 2,500 units
- Unit cost: $28.40 (was $26.80 — raw material increase)
- New ship date: March 15, 2026 (delayed 12 days)
- Origin: Ho Chi Minh City, Vietnam
- HTS Code: 6201.93.30

Factory is at 94% capacity.

Best,
Nguyen Thanh
Viet Textile Manufacturing Co.`;

  const [emailText, setEmailText] = useState(defaultEmail);

  const FIELD_LABELS = {
    po_number: "PO Number", supplier: "Supplier", contact: "Contact",
    style: "Style", quantity: "Quantity", unit_cost: "Unit Cost",
    ship_date: "Ship Date", origin: "Origin", hts_code: "HTS Code",
    factory_load: "Factory Load",
  };

  const fetchSupplierRisks = useCallback(() => {
    fetch(`${API}/api/supplier-risks`)
      .then(res => res.json())
      .then(data => setSupplierLeaderboard(data.suppliers || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSupplierRisks();
  }, [fetchSupplierRisks]);

  const handleParse = () => {
    setParsing(true); setParsed(false); setExtractedFields([]); setAnomalies([]); setSupplierRisk(null);
    fetch(`${API}/api/parse`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: emailText }),
    }).then(res => res.json()).then(data => {
      setParsing(false);
      if (data.status === "success" && data.extracted) {
        const ext = data.extracted;
        const fields = Object.entries(ext)
          .filter(([k]) => k !== "anomalies" && k !== "raw")
          .map(([k, v]) => [FIELD_LABELS[k] || k.replace(/_/g, " "), String(v)]);
        setExtractedFields(fields);
        setAnomalies(ext.anomalies || []);
        setSupplierRisk(data.supplier_risk || null);
        fetchSupplierRisks();
        setParsed(true);
      } else if (data.error) {
        setExtractedFields([["Error", data.error]]); setParsed(true);
      }
    }).catch(() => {
      setParsing(false); setExtractedFields([["Error", "Failed to reach backend."]]); setParsed(true);
    });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: parsed ? "1fr 1fr" : "1fr", gap: 20, transition: "all 0.3s" }}>
        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.8, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>Supplier Email</div>
          <textarea value={emailText} onChange={e => setEmailText(e.target.value)}
            style={{
              width: "100%", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14, padding: 18, fontSize: 12, lineHeight: 1.8, color: "rgba(255,255,255,0.55)",
              minHeight: 340, resize: "vertical", outline: "none", fontFamily: "inherit",
            }} />
          <button onClick={handleParse} disabled={parsing} style={{
            marginTop: 14, padding: "11px 20px", borderRadius: 10, border: "none", width: "100%",
            background: parsing ? "rgba(96,165,250,0.25)" : parsed ? "rgba(34,197,94,0.15)" : "#60a5fa",
            color: parsing ? "rgba(255,255,255,0.4)" : parsed ? "#22c55e" : "#07090f",
            fontSize: 12, fontWeight: 700, cursor: parsing ? "default" : "pointer", transition: "all 0.3s"
          }}>
            {parsing ? "Parsing with GPT-4o..." : parsed ? "Parsed — Click to Re-parse" : "Parse with NexusLink AI"}
          </button>
        </div>
        {parsed && extractedFields.length > 0 && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.8, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>Extracted Data</div>
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 14, overflow: "hidden" }}>
              {extractedFields.map(([k, v], i) => (
                <div key={k + i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 18px", borderBottom: i < extractedFields.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none"
                }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: v.toLowerCase().includes("delay") || v.includes("+") || v.includes("increase") ? "#fbbf24" : "rgba(255,255,255,0.7)", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                </div>
              ))}
            </div>
            {anomalies.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.8, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>
                  Intelligence Report &mdash; {anomalies.length} findings
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {anomalies.map((a, i) => {
                    const isObj = typeof a === "object" && a !== null;
                    const sev = isObj ? (a.severity || "info") : "info";
                    const sevColor = sev === "critical" ? "#ef4444" : sev === "warning" ? "#f59e0b" : "#60a5fa";
                    const sevBg = sev === "critical" ? "rgba(239,68,68,0.06)" : sev === "warning" ? "rgba(245,158,11,0.06)" : "rgba(96,165,250,0.06)";
                    const sevBorder = sev === "critical" ? "rgba(239,68,68,0.15)" : sev === "warning" ? "rgba(245,158,11,0.15)" : "rgba(96,165,250,0.12)";
                    const sevLabel = sev === "critical" ? "CRITICAL" : sev === "warning" ? "WARNING" : "INFO";
                    return (
                      <div key={i} style={{ background: sevBg, border: `1px solid ${sevBorder}`, borderRadius: 12, padding: "12px 16px", animation: `fadeUp 0.3s ease ${i * 0.08}s both` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.2, color: sevColor, background: `${sevColor}15`, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>{sevLabel}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{isObj ? a.title : a}</span>
                          {isObj && a.impact && (
                            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: sevColor, fontFamily: "monospace" }}>{a.impact}</span>
                          )}
                        </div>
                        {isObj && a.detail && (
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: isObj && a.recommendation ? 8 : 0 }}>{a.detail}</div>
                        )}
                        {isObj && a.recommendation && (
                          <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ opacity: 0.6 }}>→</span> {a.recommendation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {supplierRisk?.latest && (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.14)" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.6, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                  Supplier Risk Model
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{supplierRisk.latest.supplier}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: supplierRisk.latest.score >= 70 ? "#f87171" : supplierRisk.latest.score >= 45 ? "#fbbf24" : "#22c55e" }}>
                    {supplierRisk.latest.score}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", marginBottom: 10 }}>
                  Trend: {supplierRisk.latest.trend} · Confidence {(supplierRisk.latest.confidence * 100).toFixed(0)}% · Origin {supplierRisk.latest.origin}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {Object.entries(supplierRisk.latest.components || {}).filter(([k]) => k !== "tariff_delta_pts").map(([k, v]) => (
                    <div key={k} style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.28)" }}>{k}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {supplierLeaderboard.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.28)", marginBottom: 6 }}>
                  Tracked Suppliers
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {supplierLeaderboard.slice(0, 4).map((s, i) => (
                    <div key={`${s.supplier}-${i}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{s.supplier}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                        {s.score} · {s.trend}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN APP (Wrapper with ToastProvider)
   ═══════════════════════════════════════════════════════════════════════ */
export default function NexusLink() {
  return (
    <ToastProvider>
      <NexusLinkApp />
    </ToastProvider>
  );
}

function NexusLinkApp() {
  const [tab, setTab] = useState("inventory");
  const [data, setData] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newAlerts, setNewAlerts] = useState(false);
  const [historyData, setHistoryData] = useState({});
  const [healthScore, setHealthScore] = useState(0);
  const [selectedSKU, setSelectedSKU] = useState(null);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const toast = useToast();

  const fetchData = useCallback(() => {
    fetch(`${API}/inventory`).then(res => res.json()).then(d => {
      if (d.error) { setError(true); return; }
      setDemoMode(Boolean(d.demo_mode));
      setData(prev => {
        if (prev && d.alerts && d.alerts.length > (prev.alerts?.length || 0)) {
          setNewAlerts(true);
          setTimeout(() => setNewAlerts(false), 3000);
        }
        return d;
      });
      setLoading(false);
    }).catch(() => { if (!data) { setError(true); setLoading(false); } });
  }, [data]);

  const fetchHistory = useCallback(() => {
    fetch(`${API}/api/history`).then(res => res.json()).then(setHistoryData).catch(() => {});
  }, []);

  const fetchHealth = useCallback(() => {
    fetch(`${API}/api/health`).then(res => res.json()).then(d => {
      setHealthScore(d.score || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    fetchHistory();
    fetchHealth();
    const i1 = setInterval(fetchData, 5000);
    const i2 = setInterval(fetchHealth, 10000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "1") setTab("inventory");
      else if (e.key === "2") setTab("tariffs");
      else if (e.key === "3") setTab("ai");
      else if (e.key === "4") setTab("parser");
      else if (e.key === "/") { e.preventDefault(); InventoryTab.searchRef?.current?.focus(); setTab("inventory"); }
      else if (e.key === "Escape") { setSelectedSKU(null); setExpandedAlert(null); setShowShortcuts(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleAction = useCallback((action) => {
    fetch(`${API}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).then(res => res.json()).then(d => {
      fetchData();
      fetchHealth();
      toast(d.message || "Action executed", d.status === "success" ? "success" : "warning");
    }).catch(() => toast("Action failed", "error"));
  }, [fetchData, fetchHealth, toast]);

  const toggleDemoMode = useCallback(() => {
    fetch(`${API}/api/demo-mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !demoMode }),
    }).then(res => res.json()).then(d => {
      setDemoMode(Boolean(d.demo_mode));
      fetchData();
      toast(d.message || "Demo mode updated", "info");
    }).catch(() => toast("Failed to update demo mode", "error"));
  }, [demoMode, fetchData, toast]);

  const tabs = [
    { id: "inventory", label: "Inventory", icon: "📦", key: "1" },
    { id: "tariffs", label: "Tariffs", icon: "🌍", key: "2" },
    { id: "ai", label: "AI Query", icon: "🤖", key: "3" },
    { id: "parser", label: "Doc Parser", icon: "📄", key: "4" },
  ];

  const alertItems = data?.alerts || [];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#07090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #60a5fa, #818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#07090f", animation: "pulse 1.5s ease infinite"
          }}>N</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Synchronizing data fabric...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#07090f", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "-apple-system, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Data Fabric Unavailable</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Check backend &mdash; run <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 6 }}>python main.py</code></div>
        </div>
      </div>
    );
  }

  const uptime = data.uptime || 0;

  const getAlertAction = (alert) => {
    if (alert.action === "sync_inventory" && alert.sku) return { label: "Sync Now", cmd: `sync_inventory:${alert.sku}` };
    if (alert.action === "view_tariffs") return { label: "View Tariffs", cmd: null, tab: "tariffs" };
    if (alert.action === "release_returns") return { label: "Release Returns", cmd: "release_returns" };
    return null;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090f", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.2); } }
        @keyframes glow { 0%,100% { opacity:0.4; } 50% { opacity:0.9; } }
        @keyframes alertPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(96,165,250,0); } 50% { box-shadow: 0 0 0 6px rgba(96,165,250,0.15); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes nodePulse { 0%,100% { r:4; opacity:0.2; } 50% { r:6; opacity:0.5; } }
        @keyframes edgePulse { 0%,100% { opacity:0.3; } 50% { opacity:0.7; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:3px; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ position: "fixed", top: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.03) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <header style={{ padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Sidebar toggle */}
          <button onClick={() => setSidebarOpen(p => !p)} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.4)", fontSize: 14,
          }}>{sidebarOpen ? "◀" : "▶"}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setTab("inventory")}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #60a5fa, #818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#07090f"
            }}>N</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>NexusLink</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: 2.5, textTransform: "uppercase" }}>Supply Chain Data Fabric</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={toggleDemoMode} style={{
            padding: "5px 12px", borderRadius: 18,
            background: demoMode ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.025)",
            border: demoMode ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(255,255,255,0.05)",
            color: demoMode ? "#fbbf24" : "rgba(255,255,255,0.35)",
            fontSize: 10, fontWeight: 600, cursor: "pointer"
          }}>
            {demoMode ? "Demo Mode On" : "Demo Mode Off"}
          </button>
          <HealthRing score={healthScore} />
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 18, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "glow 2s ease infinite" }} />
            <span style={{ fontSize: 10, color: "#22c55e" }}>Live</span>
          </div>
          <div style={{ padding: "5px 12px", borderRadius: 18, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
            Ridgeline Outdoor Co.
          </div>
          <div style={{ padding: "5px 12px", borderRadius: 18, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            {Math.floor(uptime / 60)}m {uptime % 60}s
          </div>
          {/* Keyboard shortcut hint */}
          <button onClick={() => setShowShortcuts(p => !p)} style={{
            width: 24, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.25)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }} title="Keyboard shortcuts">?</button>
        </div>
      </header>

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div onClick={() => setShowShortcuts(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0d1117", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
            padding: 24, width: 320, boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "rgba(255,255,255,0.8)" }}>Keyboard Shortcuts</div>
            {[
              ["1-4", "Switch tabs"],
              ["/", "Focus search"],
              ["Esc", "Close modals"],
              ["s", "Sync selected (in modal)"],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <kbd style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{key}</kbd>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Status */}
      <ConnectionPanel connections={data.connections} />

      {/* Body */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 110px)" }}>
        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? 280 : 0, minWidth: sidebarOpen ? 280 : 0,
          borderRight: sidebarOpen ? "1px solid rgba(255,255,255,0.04)" : "none",
          padding: sidebarOpen ? "20px 16px" : 0, flexShrink: 0, overflowY: "auto",
          transition: "all 0.3s ease", overflow: "hidden",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.8, color: "rgba(255,255,255,0.25)" }}>Intelligence Feed</div>
            {newAlerts && (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa", animation: "alertPulse 1s ease infinite" }} />
            )}
          </div>
          {alertItems.map((a, i) => {
            const type = (a.type || "info").toLowerCase();
            const alertAction = getAlertAction(a);
            const isExpanded = expandedAlert === (a.id || i);
            return (
              <div key={a.id || i} style={{
                padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                background: type === "critical" ? "rgba(239,68,68,0.05)" : type === "warning" ? "rgba(245,158,11,0.04)" : "rgba(96,165,250,0.04)",
                border: `1px solid ${type === "critical" ? "rgba(239,68,68,0.1)" : type === "warning" ? "rgba(245,158,11,0.08)" : "rgba(96,165,250,0.08)"}`,
                animation: i < 3 ? `fadeUp 0.4s ease ${i * 0.08}s both` : "none",
                transition: "border-color 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                    color: type === "critical" ? "#f87171" : type === "warning" ? "#fbbf24" : "#60a5fa"
                  }}>{a.type}</span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{a.time}</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, marginBottom: 6 }}>{a.message}</div>
                {a.risk > 0 && (
                  <div style={{
                    fontSize: 11, fontWeight: 700, marginBottom: 6,
                    color: type === "critical" ? "#f87171" : type === "warning" ? "#fbbf24" : "#60a5fa"
                  }}>${a.risk >= 1000000 ? `${(a.risk / 1000000).toFixed(2)}M` : `${(a.risk / 1000).toFixed(1)}K`}</div>
                )}
                {/* Action buttons */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {alertAction && (
                    <button onClick={(e) => {
                      e.stopPropagation();
                      if (alertAction.cmd) { handleAction(alertAction.cmd); toast(alertAction.label + " executed", "success"); }
                      else if (alertAction.tab) setTab(alertAction.tab);
                    }} style={{
                      padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(96,165,250,0.2)",
                      background: "rgba(96,165,250,0.08)", color: "#60a5fa", fontSize: 9,
                      fontWeight: 600, cursor: "pointer",
                    }}>{alertAction.label}</button>
                  )}
                  {a.root_cause && (
                    <button onClick={(e) => { e.stopPropagation(); setExpandedAlert(isExpanded ? null : (a.id || i)); }} style={{
                      padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", fontSize: 9,
                      fontWeight: 600, cursor: "pointer",
                    }}>{isExpanded ? "Hide Why" : "Why?"}</button>
                  )}
                </div>
                {/* Root cause expansion */}
                {isExpanded && a.root_cause && (
                  <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", animation: "fadeUp 0.2s ease" }}>
                    {a.root_cause.chain.map((node, ci) => (
                      <div key={ci} style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                        <span style={{ color: ci === 0 ? "#f87171" : ci === 3 ? "#22c55e" : "#fbbf24", fontWeight: 600 }}>{node.label}:</span> {node.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: "20px 28px", position: "relative", zIndex: 10, overflow: "auto" }}>
          <nav style={{ display: "flex", gap: 3, marginBottom: 24, background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 3, width: "fit-content", border: "1px solid rgba(255,255,255,0.04)" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "9px 18px", borderRadius: 9, border: "none",
                background: tab === t.id ? "rgba(255,255,255,0.07)" : "transparent",
                color: tab === t.id ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
                fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 7
              }}>
                <span style={{ fontSize: 13 }}>{t.icon}</span>{t.label}
                <kbd style={{ fontSize: 9, padding: "1px 4px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", marginLeft: 2 }}>{t.key}</kbd>
              </button>
            ))}
          </nav>

          <div key={tab} style={{ animation: "fadeUp 0.35s ease" }}>
            {tab === "inventory" && (
              <InventoryTab inventory={data.inventory} onAction={handleAction} historyData={historyData}
                alerts={alertItems} recommendations={data.recommendations || []} onSelectSKU={setSelectedSKU} />
            )}
            {tab === "tariffs" && <TariffTab inventory={data.inventory} tariffs={data.tariffs} />}
            {tab === "ai" && <AITab onAction={handleAction} />}
            {tab === "parser" && <ParserTab />}
          </div>
        </main>
      </div>

      {/* SKU Detail Modal */}
      {selectedSKU && (
        <SKUModal item={selectedSKU} historyData={historyData[selectedSKU.id]}
          alerts={alertItems} onAction={handleAction} onClose={() => setSelectedSKU(null)} />
      )}
    </div>
  );
}
