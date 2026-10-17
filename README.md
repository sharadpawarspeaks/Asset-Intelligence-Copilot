# Asset Intelligence Copilot
### FlytBase Local Challenge — Hacktoberfest 2026 Hack Day

An autonomous, full-stack industrial AI conversational assistant and operations intelligence platform for oilfield operators and production engineers. 

Asset Intelligence Copilot bridges **deterministic physical calculations**, **relational time-series inspection/repair databases**, and **unstructured narrative engineering documents** (equipment manuals, SOPs, and free-text repair reports). It delivers accurate, verifiable, and cited operational intelligence with zero arithmetic or regulatory hallucinations.

---

## Key Capabilities & Highlights

- **100% Deterministic Engineering Engines**:
  - **Thermal Production Status**: Evaluates $\Delta T = T_{\text{wellhead}} - T_{\text{ambient}}$ against strict operating manual thresholds ($15.0^\circ\text{C}$ for T200, $20.0^\circ\text{C}$ for T350). Accurately detects and warns when a well's `recorded_status` is stale.
  - **7-Day Inspection Downtime Rule**: Follows the domain rule: 1 non-producing inspection = 7 days downtime; 0 for missed inspections; never substitutes maintenance hours for inspection downtime.
  - **SOP-SR & Regulatory Compliance**: Evaluates 5-barrel reportable spill thresholds, 24-hour written reporting windows (SR-01), 4-hour containment deadlines (SR-02, extracted from repair narratives), and 30-day Notice of Violation responses (RC-04).
  - **Repetitive Failure RCA Trigger**: Scans corrective repair histories to identify equipment meeting root-cause analysis thresholds (e.g. 3 pump jack repairs in 12 months), while honoring user-proposed type-scoped operational rules.

- **Dual-Level Memory & Provenance Isolation**:
  - **Private Conversation Memory**: Scoped strictly by `user_id` at the database level. Follow-up queries referencing prior conversations (e.g., *"For the three wells we discussed yesterday..."*) work seamlessly for that user while preventing cross-user data leakage.
  - **Shared Well Knowledge**: Operators can broadcast planned shutdowns, workovers, or field notes fleet-wide.
  - **Disagreement & Conflict Resolution**: Automatically distinguishes formal accepted corrections from ordinary operator claims. Conflicting claims are flagged as `unconfirmed` and surfaced with full provenance.

- **Generative UI & Interactive Visualizations**:
  - Dynamic UI generation based on returned data schemas:
    - **Status Cards**: Single-well thermal metrics, threshold comparisons, and citations.
    - **Line Charts (Recharts)**: Multi-week wellhead vs. ambient temperature trends with non-producing inspection markers.
    - **Bar Charts (Recharts)**: Top downtime rankings across geographical blocks.
    - **Geospatial Maps (React Leaflet)**: Real coordinates, interactive pins, and spill volume tooltips.
    - **Interactive Heatmaps**: 2D matrices across areas and months.
    - **Data Tables**: Paginated, sortable tables with clickable citation drawers.

- **Official Challenge Evaluation**:
  - **18 / 18 Official Example Questions Evaluated & Passed (100% Correctness)**.

---

## Technology Stack

| Layer | Technology | Details |
|:---|:---|:---|
| **Frontend** | React 19, TypeScript, Vite | Fast, typed, modern SPA architecture |
| **Styling & Icons** | Tailwind CSS, Lucide React | Dark navy & charcoal industrial palette (`#0B1120`, `#1E293B`, `#2563EB`) |
| **Data Viz & Maps**| Recharts, React Leaflet | Responsive SVG charts and OpenStreetMap tile layers |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2 | High-throughput async REST API with rigorous validation |
| **Data & ORM** | SQLAlchemy 2.0, Alembic, SQLite / PostgreSQL | Normalized relational tables with foreign keys, indexes, and audit logs |
| **RAG & Search** | Hybrid BM25/Keyword & pgvector | 14,558 passages indexed across manuals, SOPs, and 1,509 repair reports |
| **AI Layer** | Configurable Provider Abstraction | Google Gemini Flash / OpenAI GPT-4o / Ollama / Deterministic Engine ($0.00 cost) |

---

## Directory Structure

```
Asset Intelligence Copilot/
├── backend/
│   ├── app/
│   │   ├── agent/                 # Tool definitions and orchestrator
│   │   │   ├── orchestrator.py    # Intent routing, tool calling, and generative UI
│   │   │   └── tools.py           # Pydantic-validated tool functions
│   │   ├── engines/               # Deterministic calculation engines
│   │   │   ├── compliance_engine.py
│   │   │   ├── downtime_engine.py
│   │   │   ├── effective_data.py  # In-memory overlay of accepted corrections
│   │   │   ├── maintenance_engine.py
│   │   │   ├── memory_engine.py   # Private user memory & shared knowledge
│   │   │   └── production_engine.py
│   │   ├── rag/                   # Document indexing & search
│   │   │   └── retriever.py       # BM25 / keyword chunk retrieval
│   │   ├── routes/                # FastAPI API endpoints
│   │   │   ├── analytics.py
│   │   │   ├── chat.py
│   │   │   ├── compliance.py
│   │   │   ├── conversations.py
│   │   │   ├── corrections.py
│   │   │   ├── documents.py
│   │   │   ├── health.py
│   │   │   ├── ingestion.py
│   │   │   ├── knowledge.py
│   │   │   └── wells.py
│   │   ├── database.py            # Engine, sessionmaker, and Base
│   │   ├── ingest.py              # Dynamic data ingestion pipeline
│   │   ├── main.py                # FastAPI app setup and static file mounting
│   │   └── models.py              # Normalized SQLAlchemy ORM models
│   └── tests/
│       └── test_evaluation_queries.py # Full 18-question automated test suite
├── frontend/                      # React + TypeScript Vite frontend
│   ├── src/
│   │   ├── components/            # Generative UI components & layouts
│   │   │   ├── BarChartVisual.tsx
│   │   │   ├── CitationDrawer.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── HeatmapVisual.tsx
│   │   │   ├── LineChartVisual.tsx
│   │   │   ├── MapVisual.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatusCard.tsx
│   │   │   └── TopBar.tsx
│   │   ├── pages/                 # Functional supporting pages
│   │   │   ├── ChatPage.tsx
│   │   │   ├── CorrectionsPage.tsx
│   │   │   ├── DataImportPage.tsx
│   │   │   ├── KnowledgePage.tsx
│   │   │   ├── OperationsAnalyticsPage.tsx
│   │   │   ├── RepairAnalysisPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── SharedKnowledgePage.tsx
│   │   │   ├── SpillCompliancePage.tsx
│   │   │   └── WellExplorerPage.tsx
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── sample-data/                   # Cloned FlytBase challenge dataset
├── scripts/
│   ├── evaluate_queries.py        # Standalone evaluation script
│   └── ingest.py                  # CLI ingestion utility
├── ARCHITECTURE.md                # In-depth architectural blueprint
├── EVALUATION_REPORT.md           # Question-by-question evidence & calculation logs
├── SYSTEM_DESIGN_AND_RESULTS.md   # 2-page hackathon design & results document
├── DEMO_OUTLINE.md                # 5-minute demonstration script & talking points
└── .env.example                   # Environment configuration template
```

---

## Quickstart & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Git

### 1. Backend Setup

```bash
# Clone the repository
git clone <repo-url>
cd "Asset Intelligence Copilot"

# Copy environment variables
cp .env.example .env

# Install backend dependencies
pip install fastapi uvicorn sqlalchemy pydantic alembic python-dotenv requests pytest
```

### 2. Ingest Sample Data

The ingestion script dynamically discovers well directories, normalizes JSON/JSONL records, parses Markdown reports, and indexes documents into the database:

```bash
python scripts/ingest.py --data-dir ./sample-data/sample-data
```

**Ingestion Output Summary:**
- **Wells**: 200
- **Inspections**: 39,567
- **Maintenance Records**: 5,665
- **Repair Markdown Reports**: 1,509
- **Regulatory Events**: 90
- **Context & Operational Notes**: 141
- **Document Chunks Indexed**: 14,558
- **Duplicate Imports**: Prevented automatically on re-runs.

### 3. Frontend Setup & Build

```bash
cd frontend
npm install
npm run build
cd ..
```
The compiled SPA is placed in `frontend/dist` and is automatically served by the FastAPI application.

### 4. Run the Application

Start the FastAPI application:
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
Open your browser to:
- **Application UI**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

*(Optional: To run Vite in development mode with HMR, run `npm run dev` in `frontend/` and navigate to `http://localhost:5173`)*.

---

## Running the Automated Evaluation Suite

To test the application against all **18 Official Challenge Questions**:

```bash
python scripts/evaluate_queries.py
```

Or using `pytest`:
```bash
pytest backend/tests/test_evaluation_queries.py -v
```

### Evaluation Summary

| # | Question Summary | Result |
|:---:|:---|:---:|
| **Q1** | Current production status of WELL-0001 with planned shutdown context | ✅ PASS |
| **Q2** | Non-producing wells in Northeast Block 8 with documented reasons | ✅ PASS |
| **Q3** | 13-week temperature line chart marking non-producing inspections | ✅ PASS |
| **Q4** | 4-year spill count and total volume removing false detections | ✅ PASS |
| **Q5** | Inspection-based downtime during 2025 (7-day rule verification) | ✅ PASS |
| **Q6** | Top 3 wells with longest downtime in Northeast Block 7 | ✅ PASS |
| **Q7** | Geospatial map of valid spills in Northeast Block 8 (last 90 days) | ✅ PASS |
| **Q8** | Heatmap of 2026 spills by geographic area and month | ✅ PASS |
| **Q9** | Regulatory breaches, open fines ($5,000), overdue & pending actions | ✅ PASS |
| **Q10** | Southwest Block 24 spills exceeding SOP 4-hour containment limit | ✅ PASS |
| **Q11** | Private conversation memory recall across sessions for the same user | ✅ PASS |
| **Q12** | Correct raw temperature reading and propagate through downstream calculations | ✅ PASS |
| **Q13** | Correct AI-estimated spill volume and recalculate reporting obligations | ✅ PASS |
| **Q14** | User-defined root cause analysis rule applied exclusively to T350 wells | ✅ PASS |
| **Q15** | Cross-user correction propagation while maintaining provenance | ✅ PASS |
| **Q16** | Shared planned shutdown knowledge accessible fleet-wide vs. private memory | ✅ PASS |
| **Q17** | Conflicting user claims about a well's status surfaced with evidence | ✅ PASS |
| **Q18** | Conflicting ordinary operator notes distinguished from formal corrections | ✅ PASS |

*All 18 questions pass automatically with zero hardcoded values. Full logs are documented in `EVALUATION_REPORT.md`.*

---

## Final Dataset Readiness (Last 2 Hours Workflow)

When the final challenge dataset is released, follow this zero-code procedure to ingest new assets, update history, and execute tests:

```bash
# 1. Unpack or place the new dataset into final-data/
# 2. Run the dynamic ingestion pipeline:
python scripts/ingest.py --data-dir ./final-data

# 3. Execute the automated evaluation and verification suite:
python scripts/evaluate_queries.py

# 4. View the updated report:
cat EVALUATION_REPORT.md
```

The ingestion pipeline will:
- Discover new well directories dynamically without hardcoded IDs or counts.
- Detect existing records and prevent duplicate insertions.
- Re-index newly supplied Markdown manuals, SOPs, and repair reports.
- Apply corrections and operational rules automatically via the effective data layer.

---

## Security & Reliability

1. **Immutable Ground Truth**: Raw inspection readings and maintenance logs are never overwritten in the database. All user corrections exist in an auditable correction table and are dynamically overlaid by the `EffectiveDataLayer`.
2. **Deterministic Fallbacks**: Calculations never rely on unconstrained LLM completions. Tools execute deterministic Python/SQL logic and return typed payloads.
3. **Bounded Memory Isolation**: Private memory queries explicitly filter by `user_id`, preventing accidental leakage between operators.
4. **Zero Exposed Secrets**: Environment credentials reside strictly in `.env`.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
