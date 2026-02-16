# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
NexusLink is an AI-native supply chain data fabric that unifies disconnected data sources (Inventory, Tariffs, Returns, Suppliers) into a single "Truth" layer to prevent stockouts, minimize tariff exposure, and recover frozen capital.

## Goals
1. **Unified Inventory Truth**: Reconcile discrepancies across 5+ sales channels ($147K+ at risk demo).
2. **Tariff Impact Simulation**: Provide real-time cost analysis and relocation recommendations for shifting geopolitical scenarios (e.g., Vietnam → Mexico).
3. **AI-Native Intelligence**: Enable natural language querying and automated document parsing for supply chain operations.
4. **Actionable Insights**: Surface critical alerts for overselling, frozen returns, and demand spikes.

## Non-Goals (Out of Scope)
- Real-time API integration with ERP/WMS (demo uses mock data model).
- Full production-grade user authentication and multi-tenancy.
- End-to-end logistics execution (shipping label generation).

## Users
- **Sarah (VP of Ops)**: Needs high-level visibility into financial risk and strategic decisions.
- **Operations Managers**: Need to resolve specific inventory discrepancies and document processing bottlenecks.

## Constraints
- **Tech Stack**: React + Vite + Tailwind CSS + Claude API.
- **Timeline**: 2–4 days (Hackathon scope).
- **Data**: Mock supply chain data model (.json).

## Success Criteria
- [ ] Unified inventory table showing reconciled "True ATP" vs system discrepancies.
- [ ] Working tariff simulator with 3+ scenarios and relocation logic.
- [ ] AI Query interface correctly answering questions based on the mock data context.
- [ ] Document parser successfully extracting JSON from mock supplier invoices/emails.
