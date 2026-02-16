# 1-1-PLAN.md — Phase 1: Foundation & Data Model

> **Status**: `READY`

## Objective
Establish a full-stack technical foundation for NexusLink:
1. **Backend**: FastAPI managed by `uv` for high-performance data serving and AI logic.
2. **Frontend**: React managed by Vite for a professional, responsive dashboard.

## Tasks

### 1.1 Multi-Repo/Folder Structure
- [ ] Create `backend/` and `frontend/` directories.

### 1.2 Backend Setup (uv)
- [ ] Initialize Python environment in `backend/` using `uv`.
- [ ] Install FastAPI and Uvicorn.
- [ ] Create a basic `main.py` entry point.

### 1.3 Frontend Setup (Vite)
- [ ] Initialize React + Tailwind project in `frontend/`.
- [ ] Configure Tailwind CSS.

### 1.4 Canonical Data Model Construction
- [ ] Create `shared/nexus_truth.json` (accessible by both or served by backend).
- [ ] **Sales Channels**: Shopify, Amazon, REI Wholesale, 2 retail stores.
- [ ] **SKUs**: 30 realistic outdoor gear SKUs.
- [ ] **Inventory Discrepancies**: Embed 5 core discrepancies.
- [ ] **Tariff Scenarios**: Vietnam, China, Mexico rates.
- [ ] **Returns**: 15 records in limb.


## Verification Criteria
- [ ] `npm run dev` starts successfully with Tailwind styles.
- [ ] `nexus_truth.json` is valid JSON and contains all required data points.
- [ ] Total "$ at risk" calculation based on discrepancies is identifiable in the data.

## Execution
Run `npm create vite@latest ./ -- --template react` followed by Tailwind installation.
