import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from app.database import SessionLocal
from app.agent.orchestrator import AgentOrchestrator
from app.schemas import ChatRequest

from app.models import Correction, TypeOperationalRule, SharedKnowledge, ConversationWellReference

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    # Ensure pristine starting state per challenge instructions
    session.query(Correction).delete()
    session.query(TypeOperationalRule).delete()
    session.query(SharedKnowledge).delete()
    session.query(ConversationWellReference).delete()
    session.commit()
    yield session
    session.close()

# Q1: WELL-0001 Current Production Status
def test_q1_production_status(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="Is WELL-0001 producing oil right now? When was it last inspected, and by whom? Show me its status card.",
        user_id="U-201"
    ))
    assert resp.visual.type == "status_card"
    card = resp.visual.data
    assert card["is_producing"] is False
    assert card["latest_inspection_id"] == "INS-0001-0203"
    assert "2026-10-15" in card["latest_inspected_at"]
    assert "Ryan Brooks" in card["inspector_name"]
    assert card["temp_difference"] == 3.2
    assert card["applicable_threshold_c"] == 15.0
    assert card["recorded_status_out_of_date"] is True
    assert "rod string replacement" in card["reason"].lower() or "planned shut-in" in card["reason"].lower()
    assert len(resp.citations) >= 2

# Q2: Northeast Block 8 Non-Producing Wells
def test_q2_non_producing_wells_ne08(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="Which wells in Northeast Block 8 are not producing oil right now, and why? Show them in a table.",
        user_id="U-201"
    ))
    assert resp.visual.type == "table"
    table = resp.visual.data
    well_ids = [r["asset_id"] for r in table["rows"]]
    assert "WELL-0164" in well_ids
    assert "WELL-0170" in well_ids
    assert "WELL-0172" in well_ids
    assert "WELL-0175" in well_ids
    assert len(well_ids) == 4

# Q3: 13-Week Temperature Line Chart
def test_q3_temperature_line_chart(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="Show a line chart of WELL-0001's wellhead temperature against air temperature for the last 13 weeks, and mark when it was not producing oil.",
        user_id="U-201"
    ))
    assert resp.visual.type == "line_chart"
    chart = resp.visual.data
    assert len(chart["data"]) == 13
    assert "2026-10-08" in chart["non_producing_dates"]
    assert "2026-10-15" in chart["non_producing_dates"]

# Q4: Spills for WELL-0001 in Last 4 Years
def test_q4_spill_history_well0001(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="How many oil spills has WELL-0001 had in the last 4 years, and how much oil in total? List them in a table.",
        user_id="U-201"
    ))
    assert resp.visual.type == "table"
    table = resp.visual.data
    assert table["total_count"] == 6
    assert "15.1" in resp.message

# Q5: Downtime for WELL-0001 in 2025
def test_q5_downtime_2025(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="How many days was WELL-0001 down in 2025?",
        user_id="U-201"
    ))
    assert "21 days" in resp.message
    data = resp.visual.data
    assert data["downtime_days"] == 21
    assert data["qualifying_inspection_count"] == 3

# Q6: Top 3 Downtime Wells in NE-07
def test_q6_top_downtime_ne07(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="Which 3 wells in Northeast Block 7 had the most downtime in the last 4 months? Show a bar chart.",
        user_id="U-201"
    ))
    assert resp.visual.type == "bar_chart"
    data = resp.visual.data["data"]
    top_wids = [d["asset_id"] for d in data]
    assert top_wids[0] == "WELL-0121"
    assert "WELL-0138" in top_wids
    assert "WELL-0107" in top_wids
    assert data[0]["value"] == 49
    assert data[1]["value"] == 42
    assert data[2]["value"] == 42

# Q7: Map of Spills in NE-08
def test_q7_spills_map_ne08(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="Show on a map every well in Northeast Block 8 with a real spill in the last 90 days.",
        user_id="U-201"
    ))
    assert resp.visual.type == "map"
    pins = resp.visual.data["pins"]
    pin_wids = [p["asset_id"] for p in pins]
    assert "WELL-0151" in pin_wids
    assert "WELL-0165" in pin_wids
    assert "WELL-0175" in pin_wids
    assert "WELL-0186" in pin_wids
    assert len(pins) == 4

# Q8: Heatmap of 2026 Spills
def test_q8_spills_heatmap_2026(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="Show a heatmap of 2026 spills by geographic area and month.",
        user_id="U-201"
    ))
    assert resp.visual.type == "heatmap"
    hm = resp.visual.data
    # Check row totals
    totals = hm["row_totals"]
    # [35, 43, 37, 26]
    assert totals == [35, 43, 37, 26] or 43 in totals
    assert hm["total"] == 141

# Q9: Rules broken by WELL-0001
def test_q9_rules_broken_well0001(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="Which rules has WELL-0001 broken in the last 12 months, and what is still open?",
        user_id="U-201"
    ))
    assert "SR-01" in resp.message
    assert "SR-02" in resp.message
    assert "SR-03" in resp.message
    assert "RC-04" in resp.message
    assert "5,000" in resp.message

# Q10: Spills exceeding SOP containment limit in SW-24
def test_q10_containment_exceeded_sw24(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="In Southwest Block 24, which spills in the last 90 days were not contained within the SOP time limit?",
        user_id="U-201"
    ))
    assert resp.visual.type == "table"
    table = resp.visual.data
    wids = [r["asset_id"] for r in table["rows"]]
    assert "WELL-0082" in wids
    assert "WELL-0100" in wids
    assert len(wids) == 2

# Q11: Private Memory Across Days (Michael Turner)
def test_q11_private_memory_michael_turner(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    # Day 1: Ask Q6
    orch.process_chat(ChatRequest(
        message="Which 3 wells in Northeast Block 7 had the most downtime in the last 4 months? Show a bar chart.",
        user_id="U-201"
    ))
    # Day 2: Ask about repair costs
    resp = orch.process_chat(ChatRequest(
        message="For the three wells we discussed yesterday, what have repairs cost this year?",
        user_id="U-201"
    ))
    assert "25,794" in resp.message
    assert "46,942" in resp.message
    assert "5,176" in resp.message

# Q12: Correcting wrong raw data (WELL-0164)
def test_q12_correct_raw_data(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="The 15 Oct reading for WELL-0164 is wrong. The handheld thermal gun used in that inspection was faulty; the field crew re-measured the wellhead at 41.0 °C.",
        user_id="U-201"
    ))
    assert resp.conflict_detected is True
    assert "is producing oil" in resp.message
    assert "Pump jack not moving" in resp.conflict_details

    # Re-run Q2: WELL-0164 is now producing, so only 3 down wells
    resp_q2 = orch.process_chat(ChatRequest(
        message="Which wells in Northeast Block 8 are not producing oil right now, and why? Show them in a table.",
        user_id="U-201"
    ))
    table = resp_q2.visual.data
    well_ids = [r["asset_id"] for r in table["rows"]]
    assert "WELL-0164" not in well_ids
    assert len(well_ids) == 3

# Q13: Correcting AI analysis (WELL-0151 5.4 bbl)
def test_q13_correct_ai_spill_volume(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="The AI estimated the 24 Sep spill at WELL-0151 as 4.5 bbl. The field crew measured 5.4 bbl.",
        user_id="U-201"
    ))
    assert "5.4" in resp.message
    assert "Reportable" in resp.message
    assert "SR-01" in resp.message

# Q14: User-provided type-level rule (T350 RCA after 2 repairs)
def test_q14_type_rule_t350(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    # 1. Ask initial
    resp1 = orch.process_chat(ChatRequest(
        message="Which wells in Northeast Block 7 need a root-cause analysis on their pump jack?",
        user_id="U-201"
    ))
    table1 = resp1.visual.data
    wids1 = [r["asset_id"] for r in table1["rows"]]
    assert "WELL-0108" in wids1
    assert "WELL-0121" in wids1
    assert "WELL-0138" in wids1
    assert "WELL-0120" not in wids1

    # 2. Add rule
    orch.process_chat(ChatRequest(
        message="Note for all T350 wells: our team now wants a pump jack root-cause analysis after 2 repairs, not 3.",
        user_id="U-201"
    ))

    # 3. Ask again
    resp2 = orch.process_chat(ChatRequest(
        message="Which wells in Northeast Block 7 need a root-cause analysis on their pump jack?",
        user_id="U-201"
    ))
    table2 = resp2.visual.data
    wids2 = [r["asset_id"] for r in table2["rows"]]
    assert "WELL-0108" in wids2
    assert "WELL-0120" in wids2
    assert "WELL-0121" in wids2
    assert "WELL-0138" in wids2
    assert "WELL-0102" not in wids2 # T200 well with 2 repairs must NOT be added!

# Q15: Correction reaches other users
def test_q15_corrections_reach_other_users(db):
    # Jessica Reed checks WELL-0164
    orch_jessica = AgentOrchestrator(db, user_id="U-202")
    resp_jr = orch_jessica.process_chat(ChatRequest(
        message="Is WELL-0164 producing oil right now?",
        user_id="U-202"
    ))
    assert "producing oil" in resp_jr.message
    assert "41.0" in resp_jr.message

    # Laura Simmons checks reportable spills in NE-08
    orch_laura = AgentOrchestrator(db, user_id="U-401")
    resp_ls = orch_laura.process_chat(ChatRequest(
        message="Which spills in Northeast Block 8 in the last 90 days needed a report to the regulator?",
        user_id="U-401"
    ))
    assert "WELL-0151" in resp_ls.message
    assert "5.4" in resp_ls.message

# Q16: Shared knowledge vs private memory isolation
def test_q16_shared_knowledge_and_private_isolation(db):
    # Jake Morales posts shared note
    orch_jake = AgentOrchestrator(db, user_id="U-102")
    orch_jake.process_chat(ChatRequest(
        message="FYI for everyone: WELL-0007 will be shut in from 17 Oct for a 10-day planned workover.",
        user_id="U-102"
    ))

    # Michael Turner retrieves planned downtime for WELL-0007
    orch_michael = AgentOrchestrator(db, user_id="U-201")
    resp_mt = orch_michael.process_chat(ChatRequest(
        message="Is any downtime planned for WELL-0007?",
        user_id="U-201"
    ))
    assert "17 Oct" in resp_mt.message
    assert "10 days" in resp_mt.message or "10-day" in resp_mt.message

    # Jessica Reed asks about "three wells discussed yesterday" -> Must NOT use Michael Turner's history!
    orch_jessica = AgentOrchestrator(db, user_id="U-202")
    resp_jr = orch_jessica.process_chat(ChatRequest(
        message="For the three wells we discussed yesterday, what have repairs cost this year?",
        user_id="U-202"
    ))
    assert "no prior conversation" in resp_jr.message.lower() or "no such" in resp_jr.message.lower()

# Q17: People disagree with data
def test_q17_disagreements_with_data(db):
    orch_tyler = AgentOrchestrator(db, user_id="U-204")
    resp = orch_tyler.process_chat(ChatRequest(
        message="WELL-0175 is running fine.",
        user_id="U-204"
    ))
    assert resp.conflict_detected is True
    assert "0.4" in resp.message
    assert "not producing" in resp.message

    orch_jake = AgentOrchestrator(db, user_id="U-102")
    resp2 = orch_jake.process_chat(ChatRequest(
        message="WELL-0001 is back online since 14 Oct.",
        user_id="U-102"
    ))
    assert resp2.conflict_detected is True
    assert "not producing" in resp2.message
    assert "20 Oct" in resp2.message

# Q18: Disagreements about AI analysis without formal correction
def test_q18_disagreement_without_formal_correction(db):
    orch = AgentOrchestrator(db, user_id="U-201")
    resp = orch.process_chat(ChatRequest(
        message="Was the 20 Aug spill at WELL-0101 real oil?",
        user_id="U-201"
    ))
    assert "crude" in resp.message.lower() or "real oil" in resp.message.lower()
    assert "produced water" in resp.message.lower()
    assert resp.conflict_detected is True
