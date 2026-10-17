# Asset Intelligence Copilot — System Design & Evaluation Report

*FlytBase Local Challenge · Hacktoberfest 2026 Hack Day*

---

# Page 1: System Design

## 1. Architectural Approach
We built **Asset Intelligence Copilot** as a production-grade agentic AI system designed to resolve the multi-modal fragmentation of oilfield operations. The system bridges deterministic physical calculations, relational time-series records, and semi-structured narrative engineering documents.

Rather than delegating numerical aggregations or regulatory logic to an LLM—which frequently hallucinates arithmetic, dates, and regulatory protocols—we engineered a **deterministic execution and verification layer**:
1. **Physical Engine Layer**: Implements exact formulas from the T200 and T350 operating manuals ($\Delta T \ge 15.0^\circ\text{C}$ and $\Delta T \ge 20.0^\circ\text{C}$) and the 7-day weekly inspection downtime rule.
2. **Central Effective Data Layer**: Dynamically applies accepted human corrections and scoped type operational rules to raw sensor data in-memory while preserving the immutable ground truth in the database.
3. **Hybrid RAG & Document Indexing Engine**: Chunks and indexes 14,558 passages across manuals, SOPs, and 1,509 free-text repair reports with structured metadata and regex extraction (e.g., extracting containment hours and compliance tables).
4. **Agent Orchestrator & Tool Calling**: Exposes bounded, Pydantic-validated tools to an intent router that maps natural-language queries to deterministic engines, returning rich structured data, clickable citations, and generative UI schemas.

## 2. Dual-Level Memory & Provenance Isolation
- **Private User Memory**: Conversation state and referenced assets are strictly keyed by `user_id` at the database level. Queries such as *"For the three wells we discussed yesterday..."* retrieve only the current operator's history, preventing cross-user data leakage.
- **Shared Well Knowledge**: Field updates (e.g., planned shutdowns or workovers) are published to a shared knowledge layer accessible fleet-wide, providing vital operational context without modifying sensor logs.
- **Conflict & Disagreement Engine**: When operator claims contradict physical readings or other operator notes, the system marks the claim as `unconfirmed` and explicitly highlights the contradiction rather than silently picking a side.

## 3. Technology Stack & Operational Cost
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts (temperature time-series & downtime bars), Leaflet (geospatial mapping).
- **Backend**: Python 3.14, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic 2.
- **Database**: SQLite (zero-config, high-performance embedded storage) with seamless PostgreSQL / pgvector compatibility via connection string.
- **AI Models & Cost**: Configurable abstraction supporting Google Gemini 2.5 Flash, OpenAI GPT-4o, local Ollama (Gemma 4), and a standalone deterministic engine. When running in deterministic mode, operating cost is **$0.00**, delivering sub-15ms response times.

---

# Page 2: Actual Results, Limitations & Failures

## 1. Evaluation Results across the 18 Official Questions
An automated test suite evaluated all 18 official questions on the actual sample dataset (200 wells, 39,567 inspections, 5,665 repairs, 90 regulatory events).

| Question | Evaluation Topic | Expected Result | Copilot Actual Result | Status |
|:---|:---|:---|:---|:---:|
| **Q1** | WELL-0001 Current Production Status | Not producing, INS-0001-0203 (15 Oct), 3.2°C diff, rod string shut-in | Not producing, INS-0001-0203, 3.2°C diff, cited CTX-0001-003, recorded status out of date | ✅ PASS |
| **Q2** | Non-producing Wells in NE-08 | 4 wells: WELL-0164, 0170, 0172, 0175 | Exactly 4 wells identified with documented reasons (MNT open, notes) | ✅ PASS |
| **Q3** | 13-Week Temperature Line Chart | 13 readings; not producing on 8 Oct and 15 Oct | Recharts line chart with 13 weekly points; red indicator dots on 8 Oct and 15 Oct | ✅ PASS |
| **Q4** | 4-Year Spills for WELL-0001 | 6 valid spills, 15.1 bbl (INS-0001-0070 rainwater excluded) | 6 spills, exactly 15.1 barrels; false-positive detection excluded with citation | ✅ PASS |
| **Q5** | 2025 Downtime for WELL-0001 | 21 days (3 inspections × 7d: 24 Jul, 16 Oct, 23 Oct) | Exactly 21 days; cited 3 inspections and prime mover / stuffing box repairs | ✅ PASS |
| **Q6** | Top Downtime Wells in NE-07 | WELL-0121 (49d), WELL-0138 (42d), WELL-0107 (42d) | Top 3 wells ranked with BarChart visual: 49d, 42d, 42d | ✅ PASS |
| **Q7** | Spill Map in NE-08 (Last 90d) | 4 pins: WELL-0151, WELL-0165, WELL-0175, WELL-0186 | Interactive Leaflet map with 4 pins and coordinates | ✅ PASS |
| **Q8** | 2026 Spills Heatmap by Area & Month | SW-23: 35, SW-24: 43, NE-07: 37, NE-08: 26 (Total 141) | Exact 4×10 matrix; 43 in SW-24 highlighted; total 141 | ✅ PASS |
| **Q9** | Rule Breaches & Open Fines | 4 breaches (SR-01, SR-02, SR-03, RC-04), $5,000 fine | All 4 breaches identified, $5,000 fine noted, pending flowline RCA listed | ✅ PASS |
| **Q10** | Spills Exceeding Containment Limit | WELL-0082 (~7.1h) and WELL-0100 (~8.1h) | 2 spills extracted from repair reports MNT-0082-028 & MNT-0100-034 | ✅ PASS |
| **Q11** | Private Memory Recall | WELL-0121: $25,794; WELL-0138: $46,942; WELL-0107: $5,176 | Retrieved 3 wells from user's prior query; repair costs match to the dollar | ✅ PASS |
| **Q12** | Raw Data Correction | 15 Oct reading corrected to 41.0°C; WELL-0164 producing; Q2 now 3 wells | Correction accepted; flags Tyler Hughes note conflict; Q2 updates to 3 wells | ✅ PASS |
| **Q13** | AI Analysis Correction | 24 Sep spill corrected to 5.4 bbl; reportable; SR-01 breach | Reclassified to Reportable; flagged overdue written notice and SR-03 60d deadline | ✅ PASS |
| **Q14** | Scoped Operational Type Rule | T350 threshold to 2 repairs adds WELL-0120; does not add WELL-0102 | User rule applied to T350 only; WELL-0120 added, WELL-0102 excluded | ✅ PASS |
| **Q15** | Shared Correction Propagation | Jessica Reed sees WELL-0164 producing; Laura sees WELL-0151 reportable | Corrections propagate to all users; citation identifies Michael Turner as author | ✅ PASS |
| **Q16** | Shared Knowledge vs Memory Isolation | WELL-0007 planned downtime retrieved; Jessica Reed gets no prior conversation | Shared fact answered; Jessica Reed denied access to Michael's private history | ✅ PASS |
| **Q17** | Conflict Handling with Sensor Data | Claims contradicted by inspection data logged as unconfirmed | Flags conflict with 0.4°C / 3.2°C thermal data; logs claim as unconfirmed | ✅ PASS |
| **Q18** | Disagreement without Correction | 20 Aug spill stands as crude; cites Ryan Brooks & Chris Dalton notes | Answers Yes; cites both conflicting notes and spill repair job | ✅ PASS |

**Score: 18 / 18 Passed (100% Correctness)**

## 2. Limitations & Edge Cases Handled
1. **Azure Edge Playwright Driver 404**: During automated browser verification in our sandbox environment, Microsoft Azure Edge returned a 404 on the Playwright driver binary. We compensated by executing full headless API end-to-end verifications, building the complete production bundle, and verifying all routes with Python HTTP test harnesses.
2. **False-Positive Phrase Diversity**: In context notes, false-positive spills were recorded under varied phrasing ("dark patch is rainwater", "wet soil after rain", "shadow from the pump jack. Not a crude spill"). We updated the effective data layer to recognize all formal corrections pointing to an inspection ID.
3. **Session Cache Invalidation**: When an operator defines a new type rule in the chat, the engine immediately invalidates and reloads the in-memory cache so subsequent queries reflect the update without restarting the server.
