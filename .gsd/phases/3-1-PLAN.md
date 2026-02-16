# 3-1-PLAN.md — Phase 3: Intelligence Layer (AI & Simulation)

> **Status**: `READY`

## Objective
Implement advanced analytical capabilities:
1. **Tariff Simulator**: Real-time financial modeling of geopolitical trade shifts.
2. **AI Query**: Natural language semantic search and analysis across the supply chain data fabric.

## Tasks

### 3.1 Tariff Simulator (Screen 2)
- [ ] Component: `frontend/src/components/intelligence/TariffSimulator.jsx`.
- [ ] Feature: Dropdown/Slider to select country and adjust tariff rates.
- [ ] Logic: Map over `inventory` SKUs matching the country, calculate new landed costs.
- [ ] UI: Compare 'Current Landed Cost' vs 'Projected Landed Cost' in a table.
- [ ] Insight: Suggest production shifts (e.g., Vietnam → Mexico) based on rate differentials.

### 3.2 AI Query Interface (Screen 3)
- [ ] Component: `frontend/src/components/intelligence/AIQuery.jsx`.
- [ ] UI: Clean chat input/output area with dark supply chain aesthetic.
- [ ] Backend: Add `/api/query` endpoint in `backend/main.py`.
- [ ] Integration: Use Anthropic/Claude API (mocked if keys not provided, but structured for real use).
- [ ] Context: Inject `nexus_truth.json` content into the System Prompt.

### 3.3 Dashboard Navigation
- [ ] Update `App.jsx` to support basic tab-based navigation: Inventory, Tariffs, AI Query.

## Verification Criteria
- [ ] Tariff slider updates the table's "Projected Cost" column instantly.
- [ ] Recommendations update based on the most cost-effective region.
- [ ] AI Query responds with contextually accurate information from the mock dataset.
