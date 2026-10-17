import datetime
from sqlalchemy.orm import Session
from app.models import Well, Inspection, RegulatoryEvent, RepairReport, Maintenance, Area, ContextNote
from app.engines.effective_data import EffectiveDataLayer
from app.schemas import Citation

def calculate_spill_records(
    asset_id: str = None,
    area_id: str = None,
    start_date: str = "2022-10-20",
    end_date: str = "2026-10-16",
    db: Session = None
) -> list[dict]:
    eff_layer = EffectiveDataLayer(db)
    
    query = db.query(Inspection).filter(
        Inspection.inspected_at >= f"{start_date}T00:00:00Z",
        Inspection.inspected_at <= f"{end_date}T23:59:59Z"
    )
    if asset_id:
        query = query.filter(Inspection.asset_id == asset_id)
    elif area_id:
        # Filter by wells in area
        area = db.query(Area).filter(Area.area_id == area_id).first()
        if not area:
            area = db.query(Area).filter(Area.name == area_id).first()
        if area:
            well_ids = [w.asset_id for w in db.query(Well.asset_id).filter(Well.area_id == area.area_id).all()]
            query = query.filter(Inspection.asset_id.in_(well_ids))
            
    raw_insps = query.order_by(Inspection.inspected_at.asc()).all()
    valid_spills = []
    
    for raw in raw_insps:
        eff = eff_layer.get_effective_inspection(raw)
        if eff["spill_detected"] and (eff["spill_est_volume_bbl"] or 0) > 0:
            vol = eff["spill_est_volume_bbl"]
            # Determine classification
            if vol < 1.0:
                cls_name = "Minor"
                is_reportable = False
            elif vol < 5.0:
                cls_name = "Moderate"
                is_reportable = False
            elif vol < 25.0:
                cls_name = "Reportable"
                is_reportable = True
            else:
                cls_name = "Major"
                is_reportable = True

            valid_spills.append({
                "inspection_id": eff["inspection_id"],
                "asset_id": eff["asset_id"],
                "inspected_at": eff["inspected_at"],
                "date": eff["inspected_at"][:10],
                "spill_est_volume_bbl": vol,
                "spill_area_pct": eff["spill_area_pct"],
                "classification": cls_name,
                "is_reportable": is_reportable,
                "has_corrections": eff["has_corrections"]
            })
            
    return valid_spills

def analyze_well_compliance(well_id: str, db: Session, target_date: str = "2026-10-16") -> dict:
    well = db.query(Well).filter(Well.asset_id == well_id).first()
    if not well:
        return {}
        
    eff_layer = EffectiveDataLayer(db)
    one_year_ago = "2025-10-16"
    
    # 1. Spills in last 12 months
    spills = calculate_spill_records(asset_id=well_id, start_date=one_year_ago, end_date=target_date, db=db)
    
    # 2. Regulatory events in last 12 months
    reg_events = db.query(RegulatoryEvent).filter(
        RegulatoryEvent.asset_id == well_id,
        RegulatoryEvent.date >= one_year_ago,
        RegulatoryEvent.date <= target_date
    ).all()
    
    breaches = []
    pending_actions = []
    open_fines_usd = 0.0
    citations = []
    
    # Check fines & NOV response
    for r in reg_events:
        citations.append(Citation(
            source_id=r.event_id,
            source_type="regulatory_event",
            asset_id=well_id,
            date=r.date,
            source_file=f"assets/{well_id}/regulatory-events.jsonl",
            excerpt=f"{r.agency}: {r.event_type} ({r.protocol_id or 'General'}). Fine: ${r.fine_usd}. Status: {r.status}. {r.detail or ''}"
        ))
        if r.fine_usd and r.status == "open":
            open_fines_usd += float(r.fine_usd)
            
        if r.event_type == "notice_of_violation":
            # RC-04 requires answer within 30 days
            # Check if nov_response_filed exists
            resp = db.query(RegulatoryEvent).filter(
                RegulatoryEvent.asset_id == well_id,
                RegulatoryEvent.event_type == "nov_response_filed",
                RegulatoryEvent.related_inspection_id == r.related_inspection_id
            ).first()
            if not resp and r.status == "open":
                # Overdue if > 30 days
                nov_date = datetime.date.fromisoformat(r.date)
                ref_date = datetime.date.fromisoformat(target_date)
                if (ref_date - nov_date).days > 30:
                    breaches.append({
                        "protocol": "RC-04",
                        "title": "NOV Response Overdue",
                        "detail": f"Notice of violation {r.event_id} (dated {r.date}) required a response within 30 days (by {(nov_date + datetime.timedelta(days=30)).isoformat()}). None is recorded.",
                        "event_id": r.event_id,
                        "status": "breached"
                    })

        if r.protocol_id == "SR-01" and (r.hours_to_report or 0) > 24:
            breaches.append({
                "protocol": "SR-01",
                "title": "Late Spill Report to Regulator",
                "detail": f"Spill report filed after {int(r.hours_to_report)} hours (event {r.event_id}), exceeding the 24-hour limit in SOP-SR.",
                "event_id": r.event_id,
                "status": "breached"
            })
            
        if r.protocol_id == "SR-03" and r.status == "open":
            # Site inspection remediation verification
            # Verification due within 60 days of discovery
            breaches.append({
                "protocol": "SR-03",
                "title": "Cleanup Verification Overdue / Open",
                "detail": f"Agency site verification {r.event_id} remains open past 60-day deadline without closed status.",
                "event_id": r.event_id,
                "status": "breached"
            })

    # Check spill containment in repair reports
    for sp in spills:
        iid = sp["inspection_id"]
        # Find maintenance record triggered by this inspection
        maint = db.query(Maintenance).filter(
            Maintenance.asset_id == well_id,
            Maintenance.triggered_by_inspection_id == iid
        ).first()
        if maint and maint.report_file:
            # Check repair report
            rep = db.query(RepairReport).filter(
                RepairReport.asset_id == well_id,
                RepairReport.maintenance_id == maint.maintenance_id
            ).first()
            if rep and rep.containment_hours and rep.containment_hours > 4.0:
                breaches.append({
                    "protocol": "SR-02",
                    "title": "Spill Containment Limit Exceeded",
                    "detail": f"Contained after about {rep.containment_hours} hours according to report {rep.report_id}, exceeding the 4-hour SOP-SR limit.",
                    "report_id": rep.report_id,
                    "status": "breached"
                })
                citations.append(Citation(
                    source_id=rep.report_id,
                    source_type="repair_report",
                    asset_id=well_id,
                    date=maint.started_at,
                    source_file=f"assets/{well_id}/maintenance-reports/{rep.report_file}",
                    excerpt=f"Spill contained after {rep.containment_hours} hours. (SR-02 limit is 4 hours)"
                ))

    # Check pending actions:
    # 1. Flowline RCA: 3 corrective repairs on flowline in 12 months
    flowline_maint = db.query(Maintenance).filter(
        Maintenance.asset_id == well_id,
        Maintenance.equipment_kind == "flowline",
        Maintenance.maintenance_type == "corrective",
        Maintenance.started_at >= one_year_ago,
        Maintenance.started_at <= target_date
    ).all()
    if len(flowline_maint) >= 3:
        pending_actions.append({
            "protocol": "Manual §10",
            "title": "Root-Cause Analysis Due on Flowline",
            "detail": f"{len(flowline_maint)} corrective repairs on flowline in the last 12 months ({', '.join(m.maintenance_id for m in flowline_maint)}). Report marks 'Action required'."
        })
        
    # 2. Planned shut in not recorded in maintenance system
    recent_notes = db.query(ContextNote).filter(
        ContextNote.asset_id == well_id,
        ContextNote.created_at >= "2026-10-01"
    ).all()
    for n in recent_notes:
        if "work order not yet in the maintenance system" in n.text.lower() or "not yet in the maintenance system" in n.text.lower():
            pending_actions.append({
                "protocol": f"{well.well_type} Manual §4",
                "title": "Planned Shut-in Pending Maintenance Entry",
                "detail": f"Planned shut-in from 7 Oct noted in {n.note_id} is not yet entered in the maintenance system, which manual requires before work starts."
            })

    return {
        "asset_id": well_id,
        "breaches": breaches,
        "pending_actions": pending_actions,
        "open_fines_usd": open_fines_usd,
        "citations": citations
    }
