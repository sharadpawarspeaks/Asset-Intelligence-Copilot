# Official Evaluation Results — Asset Intelligence Copilot
*Evaluated on: 2026-10-17 12:36:15 UTC*
*Dataset: FlytBase Sample Dataset (200 Wells, 4 Years)*

| Question | Scenario | Status | Key Evidence Cited | Visual Generated |
|---|---|---|---|---|
| Q1 | Production Status for WELL-0001 | ✅ PASS | 3 sources | status_card |
| Q2 | Non-producing Wells in NE-08 | ✅ PASS | 11 sources | table |
| Q3 | 13-Week Temperature Line Chart | ✅ PASS | 13 sources | line_chart |
| Q4 | 4-Year Spill History for WELL-0001 | ✅ PASS | 7 sources | table |
| Q5 | 2025 Downtime for WELL-0001 | ✅ PASS | 3 sources | text |
| Q6 | Top Downtime Wells in NE-07 | ✅ PASS | 6 sources | bar_chart |
| Q7 | Map of Spills in NE-08 | ✅ PASS | 4 sources | map |
| Q8 | 2026 Spills Heatmap by Area & Month | ✅ PASS | 1 sources | heatmap |
| Q9 | Rule Breaches & Open Fines for WELL-0001 | ✅ PASS | 4 sources | table |
| Q10 | Spills Exceeding Containment Limit in SW-24 | ✅ PASS | 3 sources | table |
| Q11 | Private Memory Recall (Michael Turner) | ✅ PASS | 23 sources | table |
| Q12 | Raw Data Correction (WELL-0164) | ✅ PASS | 1 sources | status_card |
| Q13 | AI Analysis Correction (WELL-0151) | ✅ PASS | 3 sources | text |
| Q14 | Operational Type Rule for T350 Wells | ✅ PASS | 1 sources | text |
| Q15 | Shared Correction Across Users (Jessica Reed) | ✅ PASS | 2 sources | status_card |
| Q16 | Shared Planned Shutdown vs Private Memory Isolation | ✅ PASS | N/A | text |
| Q17 | Conflict Handling with Sensor Data | ✅ PASS | 2 sources | status_card |
| Q18 | Disagreement Without Formal Correction | ✅ PASS | 4 sources | text |

### Summary: 18/18 Questions Passed (100% Accuracy)

### Q1: Production Status for WELL-0001

**Prompt:** *"Is WELL-0001 producing oil right now? When was it last inspected, and by whom? Show me its status card."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

**No, WELL-0001 is not producing oil right now.**

• Latest Inspection: INS-0001-0203 on 2026-10-15 at 09:45 UTC, conducted by Ryan Brooks using drone.
• Measured Wellhead Temperature: 25.6 °C
• Measured Ambient Temperature: 22.4 °C
• Temperature Difference: 3.2 °C (T200 limit is at least 15.0 °C above ambient).
• Documented Reason: Note CTX-0001-003 by Jake Morales states the well was shut in from 7 Oct for a planned rod string replacement, with return expected around 20 Oct. Work order is not yet in the maintenance system.
• Recorded Status: Stored as 'active' in system metadata, which is **out of date**.

**Citations:**

- `[inspection] INS-0001-0203`: Wellhead: 25.6 °C, Ambient: 22.4 °C, Diff: 3.2 °C (Threshold: 15.0 °C). Notes: Pump jack not moving.

- `[manual] OM-T200`: A T200 well is producing when wellhead temperature is at least 15.0 °C above ambient air temperature.

- `[note] CTX-0001-003`: Well shut in from 7 Oct for planned rod string replacement. Work order not yet in the maintenance system. Expected back online around 20 Oct.


---

### Q2: Non-producing Wells in NE-08

**Prompt:** *"Which wells in Northeast Block 8 are not producing oil right now, and why? Show them in a table."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

There are currently **4 wells** in Northeast Block 8 not producing oil, all last inspected on 15 Oct 2026. Where no formal cause explains the shutdown, the system indicates 'No recorded reason found' rather than fabricating a cause.

**Citations:**

- `[inspection] INS-0164-0205`: Wellhead: 24.0 °C, Ambient: 19.9 °C, Diff: 4.1 °C (Threshold: 15.0 °C). Notes: Pump jack not moving.

- `[manual] OM-T200`: A T200 well is producing when wellhead temperature is at least 15.0 °C above ambient air temperature.

- `[note] CTX-0164-001`: Inspection INS-0164-0071: produced water from a washout, no crude. Not a crude spill.


---

### Q3: 13-Week Temperature Line Chart

**Prompt:** *"Show a line chart of WELL-0001's wellhead temperature against air temperature for the last 13 weeks, and mark when it was not producing oil."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

Here is the 13-week temperature chart for WELL-0001 (from 2026-07-23 to 2026-10-15).

• Operational Threshold: 15.0 °C difference (T200 manual)
• Non-producing dates: **2026-10-08, 2026-10-15** (wellhead cooled below threshold).

**Citations:**

- `[inspection] INS-0001-0191`: 2026-07-23: Wellhead 61.2 °C, Ambient 33.1 °C, Diff 28.1 °C

- `[inspection] INS-0001-0192`: 2026-07-30: Wellhead 58.2 °C, Ambient 32.0 °C, Diff 26.2 °C

- `[inspection] INS-0001-0193`: 2026-08-06: Wellhead 65.0 °C, Ambient 35.1 °C, Diff 29.9 °C


---

### Q4: 4-Year Spill History for WELL-0001

**Prompt:** *"How many oil spills has WELL-0001 had in the last 4 years, and how much oil in total? List them in a table."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

**WELL-0001 had 6 confirmed oil spills totaling 15.1 barrels over the last 4 years.**

• Detections: 7 raw inspections flagged potential spills. However, INS-0001-0070 (07 Mar 2024) was formally corrected as rainwater (note CTX-0001-001) and is excluded.
• The 6 valid spills are detailed in the table below.

**Citations:**

- `[inspection] INS-0001-0021`: Spill detected: 0.5 bbl

- `[inspection] INS-0001-0027`: Spill detected: 2.6 bbl

- `[inspection] INS-0001-0048`: Spill detected: 3.3 bbl


---

### Q5: 2025 Downtime for WELL-0001

**Prompt:** *"How many days was WELL-0001 down in 2025?"* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

**WELL-0001 had 21 days of downtime in 2025.**

• **Calculation Method:** Three weekly inspections where the well was not producing oil × 7 days = 21 days.

**Supporting Inspections & Documented Causes:**
1. **24 Jul 2025 (INS-0001-0140):** Wellhead measured 51.6 °C, but ambient was 43.1 °C (only 8.5 °C difference, below the 15.0 °C threshold). Cause: prime mover tripped (MNT-0001-021).
2. **16 Oct 2025 (INS-0001-0152):** Difference 3.4 °C (stuffing box packing leak, MNT-0001-023).
3. **23 Oct 2025 (INS-0001-0153):** Difference -0.6 °C (continued repair on stuffing box packing).

**Citations:**

- `[inspection] INS-0001-0140`: Inspected at 2025-07-24: Wellhead 51.6 °C, Ambient 43.1 °C, Diff 8.5 °C < 15.0 °C

- `[inspection] INS-0001-0152`: Inspected at 2025-10-16: Wellhead 26.6 °C, Ambient 23.2 °C, Diff 3.4 °C < 15.0 °C

- `[inspection] INS-0001-0153`: Inspected at 2025-10-23: Wellhead 16.0 °C, Ambient 16.6 °C, Diff -0.6 °C < 15.0 °C


---

### Q6: Top Downtime Wells in NE-07

**Prompt:** *"Which 3 wells in Northeast Block 7 had the most downtime in the last 4 months? Show a bar chart."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

The 3 wells with the most downtime in Northeast Block 7 over the last 4 months (16 Jun to 16 Oct 2026) are:

1. **WELL-0121:** 49 days (7 inspections × 7 days, T200)
2. **WELL-0138:** 42 days (6 inspections × 7 days, T350)
3. **WELL-0107:** 42 days (6 inspections × 7 days, T350)

(Next highest is WELL-0119 at 28 days).

**Citations:**

- `[inspection] INS-0121-0189`: Inspected at 2026-06-18: Wellhead 33.3 °C, Ambient 32.9 °C, Diff 0.4 °C < 15.0 °C

- `[inspection] INS-0121-0200`: Inspected at 2026-09-03: Wellhead 29.8 °C, Ambient 29.2 °C, Diff 0.6 °C < 15.0 °C

- `[inspection] INS-0107-0194`: Inspected at 2026-07-02: Wellhead 34.9 °C, Ambient 33.3 °C, Diff 1.6 °C < 20.0 °C


---

### Q7: Map of Spills in NE-08

**Prompt:** *"Show on a map every well in Northeast Block 8 with a real spill in the last 90 days."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

Here is the map showing all **4 valid spills** in Northeast Block 8 during the last 90 days (18 Jul to 16 Oct 2026):

• **WELL-0151:** 24 Sep 2026, 4.5 bbl (Lat 32.12246, Lon -102.18445)
• **WELL-0165:** 30 Jul 2026, 1.2 bbl (Lat 32.15665, Lon -102.14522)
• **WELL-0175:** 30 Jul 2026, 3.9 bbl (Lat 32.18020, Lon -102.14790)
• **WELL-0186:** 23 Jul 2026, 0.6 bbl (Lat 32.17552, Lon -102.17775)

**Citations:**

- `[inspection] INS-0186-0097`: Spill: 0.6 bbl

- `[inspection] INS-0165-0194`: Spill: 1.2 bbl

- `[inspection] INS-0175-0193`: Spill: 3.9 bbl


---

### Q8: 2026 Spills Heatmap by Area & Month

**Prompt:** *"Show a heatmap of 2026 spills by geographic area and month."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

Here is the heatmap of confirmed spills across all four areas from Jan to Oct 2026 (false-positive detections removed):

• **Southwest Block 23:** 35 spills
• **Southwest Block 24:** 43 spills (highest incidence)
• **Northeast Block 7:** 37 spills
• **Northeast Block 8:** 26 spills
• **Total Field Spills (2026):** 141 spills.

**Citations:**

- `[sop] SOP-SR`: SOP-SR §7: False-positive detections do not count as spills for reporting or statistics.


---

### Q9: Rule Breaches & Open Fines for WELL-0001

**Prompt:** *"Which rules has WELL-0001 broken in the last 12 months, and what is still open?"* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

**WELL-0001 has 4 rule breaches over the last 12 months, with USD 5,000 in open fines.**

**Confirmed Breaches (all originating from the 11 Jun 2026 spill of 6.8 bbl):**
1. **SR-01 (Late spill report):** Reported after 41 hours (REG-0001-001) vs 24-hour limit. Resulted in Notice of Violation REG-0001-002 with a **USD 5,000 fine (still open)**.
2. **SR-02 (Containment limit exceeded):** Contained after ~7 hours vs 4-hour limit (recorded in June repair report).
3. **SR-03 (Cleanup verification overdue):** Site remediation verification due by 10 Aug 2026 remains open (REG-0001-003).
4. **RC-04 (NOV response overdue):** NOV required written response by 30 Jul 2026; none is recorded.

**Pending Actions (deadlines under way, not counted as breaches):**
• Flowline RCA due: 3 corrective repairs in 12 months (MNT-0001-028, 029, 032; report marks 'Action required').
• Planned shut-in from 7 Oct not yet recorded in maintenance system (T200 manual §4).
• Note: Annual flowline integrity test (RC-02) was passed on 07 Mar 2026.

**Citations:**

- `[regulatory_event] REG-0001-001`: State Oil & Gas Commission: spill_report_filed (SR-01). Fine: $0.0. Status: closed. Operator filed spill report 41 h after detection; est. 6.8 bbl crude.

- `[regulatory_event] REG-0001-002`: State Oil & Gas Commission: notice_of_violation (SR-01). Fine: $5000.0. Status: open. Reportable spill (>= 5 bbl) not reported within 24 hours of discovery.

- `[regulatory_event] REG-0001-003`: Regional Environmental Protection Office: site_inspection (SR-03). Fine: $0.0. Status: open. Follow-up soil sampling found residual hydrocarbons; remediation verification still pending.


---

### Q10: Spills Exceeding Containment Limit in SW-24

**Prompt:** *"In Southwest Block 24, which spills in the last 90 days were not contained within the SOP time limit?"* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

In Southwest Block 24 over the last 90 days, **2 spills** exceeded the 4-hour SOP containment limit. Containment duration exists exclusively within free-text repair reports:

1. **WELL-0082:** Contained after about **7.1 hours** (Report MNT-0082-028, inspection INS-0082-0198 on 2026-09-10).
2. **WELL-0100:** Contained after about **8.1 hours** (Report MNT-0100-034, inspection INS-0100-0196 on 2026-09-10).

**Citations:**

- `[repair_report] RPT-MNT-0100-034`: Spill contained after about 8.1 hours.

- `[repair_report] RPT-MNT-0082-028`: Spill contained after about 7.1 hours.

- `[sop] SOP-SR`: SR-02: Source must be stopped and spill contained within 4 hours of discovery.


---

### Q11: Private Memory Recall (Michael Turner)

**Prompt:** *"For the three wells we discussed yesterday, what have repairs cost this year?"* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

Retrieving the three wells from our previous conversation (WELL-0138, WELL-0107, WELL-0121):

• **WELL-0121:** USD 25,794
• **WELL-0138:** USD 46,942
• **WELL-0107:** USD 5,176

**Total repair cost this year across all three wells:** USD 77,912.0.

**Citations:**

- `[maintenance] MNT-0138-026`: Job MNT-0138-026 (pump_jack): $560.0 total ($298.0 labor, $262.0 parts). Scheduled lubrication and belt inspection

- `[maintenance] MNT-0138-027`: Job MNT-0138-027 (pump_jack): $334.0 total ($116.0 labor, $218.0 parts). Scheduled lubrication and belt inspection

- `[maintenance] MNT-0138-028`: Job MNT-0138-028 (flowline): $7011.0 total ($3281.0 labor, $3730.0 parts). Flowline leak causing spill


---

### Q12: Raw Data Correction (WELL-0164)

**Prompt:** *"The 15 Oct reading for WELL-0164 is wrong. The handheld thermal gun used in that inspection was faulty; the field crew re-measured the wellhead at 41.0 °C."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

Correction accepted and recorded against inspection INS-0164-0205.

• Original wellhead temperature: 24.0 °C
• Corrected wellhead temperature: 41.0 °C (recorded by U-201)
• Ambient temperature: 19.9 °C
• Temperature difference: 21.1 °C (T200 operational threshold is 15.0 °C)

**Result:** WELL-0164 **is producing oil** based on the corrected reading.

⚠️ **Conflict Alert:** Note: Inspection INS-0164-0205 has an inspector remark from Tyler Hughes stating: "Pump jack not moving.", which conflicts with a warm producing wellhead reading. The correction has been applied to effective data, but please confirm if a mechanical check is needed.

**Citations:**

- `[correction] INS-0164-0205`: Original: 24.0 °C -> Corrected: 41.0 °C. Inspector remark: 'Pump jack not moving.'


---

### Q13: AI Analysis Correction (WELL-0151)

**Prompt:** *"The AI estimated the 24 Sep spill at WELL-0151 as 4.5 bbl. The field crew measured 5.4 bbl."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

Correction recorded against inspection INS-0151-0201.

• AI Estimated Volume: 4.5 bbl
• Field Measured Volume: 5.4 bbl (corrected by U-201)

**Regulatory Impact (Spill Response SOP, SOP-SR):**
1. **Spill Class:** Reclassified from Moderate to **Reportable** (>= 5.0 bbl threshold under SR-01).
2. **Reporting Duty (SR-01):** Written notice was due to State Oil & Gas Commission within 24 hours of discovery (by 25 Sep 2026 15:30 UTC). **No notice is recorded**, flagging an **SR-01 compliance breach**.
3. **Containment (SR-02):** Repair report MNT-0151-025 indicates containment took ~6.4 hours, exceeding the 4-hour limit (SR-02 breach).
4. **Agency Verification (SR-03):** Because this is now a reportable spill, environmental agency verification of cleanup is mandatory within 60 days (due by 23 Nov 2026).
5. **Report Invalidation:** Repair report MNT-0151-025 classed the spill as 'moderate' without external reporting duties based on the obsolete 4.5 bbl estimate; that finding is no longer valid.

**Citations:**

- `[inspection] INS-0151-0201`: Corrected spill volume: 5.4 bbl

- `[sop] SOP-SR`: SR-01: Spills >= 5 bbl must be reported in writing within 24 hours.

- `[repair_report] MNT-0151-025`: Containment took ~6.4 hours. Classified as moderate based on superseded estimate.


---

### Q14: Operational Type Rule for T350 Wells

**Prompt:** *"Note for all T350 wells: our team now wants a pump jack root-cause analysis after 2 repairs, not 3."* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

User-provided operational rule registered successfully for well type **T350**.

• Rule: Require root-cause analysis (RCA) on pump jack after **2 corrective repairs** in 12 months (instead of default 3).
• Scope: Applies **strictly to T350 wells**.
• T200 wells remain governed by the T200 Operating Manual §10 requirement (3 corrective repairs).
• Author: U-201 | Status: Active

**Citations:**

- `[rule] RULE-T350`: T350 pump jack RCA threshold set to 2 repairs by user


---

### Q15: Shared Correction Across Users (Jessica Reed)

**Prompt:** *"Is WELL-0164 producing oil right now?"* (User: `U-202`)

**Status:** ✅ PASS

**Copilot Response:**

**Yes, WELL-0164 is producing oil right now.**

• Wellhead Temperature: 41.0 °C (based on accepted field re-measurement corrected by Michael Turner; faulty thermal gun originally read 24.0 °C).
• Ambient Temperature: 19.9 °C
• Temperature Difference: 21.1 °C, exceeding the 15.0 °C threshold for T200 wells.
• Note: Inspector Tyler Hughes originally remarked 'Pump jack not moving.' on that inspection, which disagrees with this reading.

**Citations:**

- `[inspection] INS-0164-0205`: Wellhead: 41.0 °C, Ambient: 19.9 °C, Diff: 21.1 °C (Threshold: 15.0 °C). Notes: Pump jack not moving.

- `[manual] OM-T200`: A T200 well is producing when wellhead temperature is at least 15.0 °C above ambient air temperature.


---

### Q16: Shared Planned Shutdown vs Private Memory Isolation

**Prompt:** *"For the three wells we discussed yesterday, what have repairs cost this year?"* (User: `U-202`)

**Status:** ✅ PASS

**Copilot Response:**

I have no prior conversation history on record with you (U-202) discussing three wells. Private conversation memory is strictly isolated per user and cannot access conversations from other team members.


---

### Q17: Conflict Handling with Sensor Data

**Prompt:** *"WELL-0175 is running fine."* (User: `U-204`)

**Status:** ✅ PASS

**Copilot Response:**

⚠️ **Conflict Alert with Sensor Data:**

You stated that WELL-0175 is running fine. However, the latest weekly inspection (INS-0175-0204 on 2026-10-15 by Jessica Reed) recorded a wellhead temperature of 24.3 °C against ambient 23.9 °C (only **0.4 °C difference**, far below the 15.0 °C threshold for T200 wells).

This physical measurement confirms the well **is not producing oil**.
Furthermore, Michael Turner previously recorded that WELL-0175 has been shut in for planned work since 14 Oct.

Your statement has been recorded as **unconfirmed operator feedback** without overwriting verified inspection data.

**Citations:**

- `[inspection] INS-0175-0204`: Wellhead only 0.4 °C above ambient. Well not producing.

- `[note] NOTE-MT`: Michael Turner: Shut in for planned work since 14 Oct.


---

### Q18: Disagreement Without Formal Correction

**Prompt:** *"Was the 20 Aug spill at WELL-0101 real oil?"* (User: `U-201`)

**Status:** ✅ PASS

**Copilot Response:**

**Yes, the 20 Aug 2026 spill at WELL-0101 stands as crude oil.**

**Evidence & Disagreement Analysis:**
1. **AI Detection:** Weekly inspection INS-0101-0197 on 20 Aug 2026 detected a 1.0 bbl spill ('Oil sheen around cellar').
2. **Operator Disagreement (CTX-0101-002):** Field inspector Ryan Brooks noted it might be produced water.
3. **HSE Confirmation (CTX-0101-003):** Chris Dalton (HSE Officer) sampled the stain and confirmed crude hydrocarbons.
4. **Corrective Repair:** Maintenance job MNT-0101-029 was carried out to remediate the crude spill.

**Conclusion:** Neither operator note constitutes a formal data correction overriding the detection. Because HSE laboratory sampling verified crude oil and a corrective repair was executed, the 1.0 bbl spill stands as a valid detection.

**Citations:**

- `[inspection] INS-0101-0197`: AI detection: 1.0 bbl oil sheen

- `[note] CTX-0101-002`: Ryan Brooks: suspected produced water

- `[note] CTX-0101-003`: Chris Dalton (HSE): soil sample confirmed crude


---
