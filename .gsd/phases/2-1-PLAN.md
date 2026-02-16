# 2-1-PLAN.md — Phase 2: Core Dashboard UI

> **Status**: `READY`

## Objective
Build the primary "Unified Inventory Truth" dashboard screen and the "Alerts" panel to visualize supply chain risks and discrepancies.

## Tasks

### 2.1 Component Architecture
- [ ] Create `frontend/src/components/layout/DashboardLayout.jsx`.
- [ ] Create `frontend/src/components/inventory/InventoryTable.jsx`.
- [ ] Create `frontend/src/components/inventory/RiskSummary.jsx`.
- [ ] Create `frontend/src/components/alerts/AlertPanel.jsx`.

### 2.2 Inventory Truth Table (Screen 1)
- [ ] Fetch data from `http://localhost:8000/inventory`.
- [ ] Render table with columns: SKU Name, Category, Shopify, Amazon, WMS, POS, True ATP, Value at Risk.
- [ ] Implement conditional formatting: highlight rows in red if `discrepancy` is true.
- [ ] Add tooltips/indicators for specific system mismatches.

### 2.3 Risk Summary Cards
- [ ] Calculate aggregates: Total discrepancies, Total $ at risk.
- [ ] Display as prominent cards at the top of the inventory view.

### 2.4 Actionable Alerts Panel
- [ ] Side panel or bottom section showing critical notifications.
- [ ] "Action" buttons for each alert.

## Verification Criteria
- [ ] Backend data correctly renders in the frontend table.
- [ ] Discrepancies are visually distinct (red flags).
- [ ] Summary numbers match the `shared/nexus_truth.json` content.
