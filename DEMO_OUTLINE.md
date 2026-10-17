# Asset Intelligence Copilot — 5-Minute Demonstration Outline

### FlytBase Local Challenge · Hacktoberfest 2026 Hack Day
**Presenter**: Senior AI Engineer / Product Designer  
**Audience**: Judges, Production Engineers, Operations Directors  
**Format**: Live Walkthrough & Screen Recording (5:00 Total Runtime)

---

## Demo Schedule & Timeline

```
[0:00 - 0:45] Hook & Problem Statement: The Reality of Oilfield Data Fragmentation
[0:45 - 1:45] Deterministic Physical Engines & Generative Visualizations (Q1, Q3, Q6, Q8)
[1:45 - 2:45] Unstructured RAG & Regulatory Compliance (Q9, Q10)
[2:45 - 3:45] Dual-Level Memory & Scoped Operational Rules (Q11, Q14, Q16)
[3:45 - 4:30] Data Corrections, Conflict Handling & Provenance (Q12, Q17, Q18)
[4:30 - 5:00] Ingestion Pipeline, Performance & Final Dataset Readiness
```

---

## Minute-by-Minute Script & Talking Points

### Minute 0:00 – 0:45: The Problem & System Architecture
* **Visual**: Show the Asset Intelligence Copilot landing screen (`http://localhost:8000`), Dark navy UI, top bar user picker (`Michael Turner`), dataset status indicator (200 Wells, 39,567 Inspections).
* **Narrative**:
  > *"Oilfield operations generate gigabytes of telemetry, weekly inspections, work orders, regulatory notices, and narrative repair logs. Traditional LLMs fail here because they hallucinate numbers, miscalculate temperature differentials, or silently invent compliance deadlines.*
  > *Today, we introduce **Asset Intelligence Copilot**. Built with a strict **deterministic-first architecture**, it pairs an agentic intent router with exact physical calculation engines, a central effective data layer, and hybrid RAG indexing over 14,000 document chunks."*

---

### Minute 0:45 – 1:45: Deterministic Physical Engines & Generative UI
* **Action 1 (Q1)**: Click suggested question: *"Is WELL-0001 producing oil right now?"*
  * **Show**: Status Card pop-up.
  * **Narrative**:
    > *"Notice what the Copilot does. Instead of trusting the metadata's stale recorded status ('producing'), it pulls the latest physical inspection from October 15th, checks the operating manual for a T200 well (threshold $\ge 15^\circ\text{C}$), and calculates the difference: $41.8^\circ\text{C} - 38.6^\circ\text{C} = 3.2^\circ\text{C}$. This is below threshold, so the well is **Not Producing**.*
    > *Crucially, it also cites context note `CTX-0001-003`: the well is shut in for a rod string replacement. Full provenance, zero guesswork."*
* **Action 2 (Q6 & Q8)**: Ask: *"Which wells in Northeast Block 7 had the longest downtime over the last four months?"*
  * **Show**: Interactive **Recharts Bar Chart** highlighting WELL-0121 (49 days), WELL-0138 (42 days), WELL-0107 (42 days) using the strict 7-day inspection downtime rule.
  * **Show**: Switch to Operations Analytics or query Q8 to show the **Spills Heatmap** across geographic areas and months.

---

### Minute 1:45 – 2:45: Unstructured RAG & Deep Compliance
* **Action 3 (Q10)**: Ask: *"Which spills in Southwest Block 24 had containment times exceeding SOP limits?"*
  * **Show**: Table response citing `MNT-0082-028` (7.1 hours) and `MNT-0100-034` (8.1 hours).
  * **Narrative**:
    > *"Containment hours are not stored in any structured database column—they exist only inside free-text Markdown repair logs written by technicians. Our RAG engine extracts the relevant passages from SOP-SR-02 (which mandates a 4-hour containment limit) and cross-references the field reports to surface these two violations with exact hour metrics and report citations."*
* **Action 4 (Q9)**: Ask: *"Which regulatory rules were breached in the last 12 months?"*
  * **Show**: Exact breakdown of 4 breaches (SR-01, SR-02, SR-03, RC-04), the $5,000 open fine, and pending actions.

---

### Minute 2:45 – 3:45: Dual-Level Memory & Scoped Operational Rules
* **Action 5 (Q11 & Q16)**: Show User Isolation:
  * As **Michael Turner**, ask: *"For the three wells we discussed yesterday, what have repairs cost this year?"*
  * **Show**: System retrieves WELL-0121, WELL-0138, WELL-0107 from his conversation history and returns exact dollar totals ($25,794, $46,942, $5,176).
  * Switch user in the top bar to **Jessica Reed** and ask the exact same prompt:
  * **Show**: Copilot politely explains that no prior wells were discussed in her conversation. **Zero cross-user data leakage**.
* **Action 6 (Q14)**: Propose a type-scoped rule:
  * *"Note for all T350 wells: our team now wants a pump jack root-cause analysis after two repairs, not three."*
  * **Show**: Copilot registers the rule, tags it as user-defined, applies it only to T350 wells (adding WELL-0120), and explicitly excludes T200 wells (WELL-0102).

---

### Minute 3:45 – 4:30: Corrections, Audit Logs & Conflict Handling
* **Action 7 (Q12 & Q17)**:
  * *"The 15 Oct reading for WELL-0164 is wrong. The handheld thermal gun was faulty; field crew re-measured at 41.0°C."*
  * **Show**: Copilot accepts the correction, preserves the original 28.5°C reading in the immutable audit log, and flags the conflict with Tyler Hughes's note.
  * Re-run Q2: The count of non-producing wells in Northeast Block 8 immediately drops from 4 to 3!
* **Action 8 (Q18)**: Show conflicting ordinary notes (Ryan Brooks vs. Chris Dalton regarding whether a spill was crude or emulsified water).
  * **Narrative**:
    > *"The system does not arbitrarily pick a winner. It explains that ordinary notes are unverified claims, preserving both perspectives alongside the official inspection and maintenance records."*

---

### Minute 4:30 – 5:00: Summary, Ingestion Pipeline & Wrap-Up
* **Visual**: Show `scripts/ingest.py` terminal output and `EVALUATION_REPORT.md` (18/18 questions passed).
* **Narrative**:
  > *"When the final dataset drops in the final two hours, our automated pipeline can ingest hundreds of new assets, normalize records, and index reports in under 30 seconds with a single command:*
  > `python scripts/ingest.py --data-dir ./final-data`
  > *Asset Intelligence Copilot brings transparency, auditability, and mathematical precision to industrial operations. Thank you!"*

---

## Key Takeaways for Judges
1. **Mathematical Precision**: Not an ungrounded LLM chatbot; all physical calculations ($\Delta T$, downtime, reporting deadlines) are computed deterministically.
2. **True Full-Stack**: Interactive React 19 + Vite frontend with Tailwind, Recharts, Leaflet, and FastAPI backend with SQLite/Postgres compatibility.
3. **Enterprise Grade**: User memory isolation, immutable audit trails, and dynamic generative UI components.
4. **100% Evaluation Success**: 18 out of 18 official challenge questions passing with zero hardcoded values.
