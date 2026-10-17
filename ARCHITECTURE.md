# Asset Intelligence Copilot — Architecture Specification

*FlytBase Local Challenge · Hacktoberfest 2026 Hack Day*

---

## 1. Executive Summary

Asset Intelligence Copilot is an end-to-end industrial conversational AI assistant designed for oilfield operations across 200+ oil wells. It combines structured weekly inspections, maintenance jobs, and regulatory filings with unstructured markdown operating manuals, SOPs, and free-text repair reports to answer complex operational questions deterministically, with full provenance evidence and dynamic generative visualizations.

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Industrial UI (React 19 + Vite)                       │
│  - Dark Charcoal & Professional Blue Design System                          │
│  - Generative Visuals: Status Cards, Recharts (Line/Bar), Maps, Heatmaps   │
│  - Operator Selector (Private Memory Scoping) & Evidence Modals             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST (/api/chat, /api/wells)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    FastAPI Backend & Agent Orchestrator                     │
│  - Multi-step Tool Calling with Pydantic Argument Validation                │
│  - Pluggable AI Providers (Gemini / OpenAI / Ollama / Deterministic Engine) │
│  - Intent Parser & Conflict Detection Layer                                 │
└──────┬───────────────────────────────┬───────────────────────────────┬──────┘
       │                               │                               │
┌──────▼─────────────────────┐  ┌──────▼─────────────────────┐  ┌──────▼──────┐
│   Deterministic Engines    │  │     Document RAG Engine    │  │ Memory Eng. │
│ - Production Status Engine │  │ - Chunked Manuals (T200,   │  │ - Shared    │
│ - 7-Day Downtime Engine    │  │   T350) & SOPs (SR, RC, WS)│  │   Knowledge │
│ - Spill Compliance (SR-01) │  │ - 1,500+ Repair Reports    │  │ - Private   │
│ - Maintenance & RCA Rules  │  │ - BM25 & Semantic Matcher  │  │   Memory    │
└──────────────┬─────────────┘  └──────────────┬─────────────┘  └──────┬──────┘
               │                               │                       │
┌──────────────▼───────────────────────────────▼───────────────────────▼──────┐
│                        Central Effective Data Layer                         │
│  - Applies Accepted Corrections to Raw Observations & AI Estimates         │
│  - Dynamic Type-Level Operational Rules (e.g. T350 2-repair RCA limit)      │
│  - Immutable Raw Data Preservation & Disagreement Provenance Logging        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ SQLAlchemy 2.0 ORM
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                 Relational & Vector Storage Layer                           │
│  - SQLite (Zero-Config Embedded) / PostgreSQL with pgvector                 │
│  - 47,200+ Records: Wells, Inspections, Maintenance, Reports, Regulatory    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Subsystems

### 3.1 Central Effective Data Layer (`app.engines.effective_data`)
The dataset contains raw observations that may be noisy, unconfirmed, or later corrected by field personnel (e.g., faulty thermal gun re-measured at 41.0°C; 4.5 bbl estimate re-measured at 5.4 bbl).
- **Accepted Corrections**: Overrides the specific reading in memory for calculations across all users without mutating original database records.
- **False-Positive Removal**: 56 context notes identifying rainwater, mud, or pump jack shadows automatically nullify false spill detections.
- **Dynamic Type Rules**: Custom thresholds (e.g., pump jack RCA after 2 repairs on T350 wells) apply strictly to their scoped well type.

### 3.2 Production Status Engine (`app.engines.production_engine`)
- **Thermal Rule**: A well is producing when:
  $$\Delta T = T_{\text{wellhead}} - T_{\text{ambient}} \ge \text{Threshold}$$
  - T200 Wells: $\text{Threshold} = 15.0^\circ\text{C}$ (T200 Manual §9.3)
  - T350 Wells: $\text{Threshold} = 20.0^\circ\text{C}$ (T350 Manual §3)
- **Stale Status Detection**: Identifies when metadata `recorded_status` disagrees with live thermal measurements.
- **Contextual Reasoning**: Resolves shutdowns to specific open maintenance orders or planned shut-in context notes. If no record exists, reports "No recorded reason found" rather than hallucinating.

### 3.3 7-Day Downtime Engine (`app.engines.downtime_engine`)
- **Inspection-Based Rule**: Each weekly inspection finding a well not producing counts as exactly 7 days of downtime.
- **Missed Inspections**: Missed inspections add 0 days. Maintenance `downtime_hours` is never conflated with operational downtime.

### 3.4 Spill & Regulatory Compliance Engine (`app.engines.compliance_engine`)
- **SOP-SR Classification**:
  - Minor: $< 1.0\text{ bbl}$
  - Moderate: $1.0\text{ to } < 5.0\text{ bbl}$ (HSE notification within 72h)
  - Reportable: $5.0\text{ to } < 25.0\text{ bbl}$ (Written notice to Commission within 24h of discovery, SR-01)
  - Major: $\ge 25.0\text{ bbl}$ (Notice within 2h)
- **Report Parsing**: Extracts containment hours from free-text markdown repair reports (SR-02 limit is 4.0 hours).
- **Violations Tracking**: Audits open fines, 30-day notice of violation answer deadlines (RC-04), and 60-day agency cleanup verification windows (SR-03).

### 3.5 Memory Architecture: Shared vs. Private (`app.engines.memory_engine`)
1. **Shared Well Knowledge**: Operational facts (e.g., planned workover shut-ins) shared by one operator become globally accessible across the entire fleet.
2. **Private User Memory**: Conversation context and recently discussed assets are strictly partitioned by `user_id`. One operator cannot access or inherit conversational references from another.

### 3.6 Ingestion & Schema Migrations (`app.ingest`)
- Dynamically discovers all `assets/WELL-*` folders and fleet configuration files.
- Parses 39,567 inspections, 5,665 maintenance jobs, 1,509 repair reports, and 14,558 markdown document chunks in under 8 seconds.
- Fully idempotent: duplicate imports are skipped; new test datasets can be imported via `python scripts/ingest.py --data-dir <path>` without restarting or modifying code.
