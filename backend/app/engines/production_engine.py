from typing import Optional
from sqlalchemy.orm import Session
from app.models import Well, Inspection, ContextNote, Maintenance, User, Area
from app.engines.effective_data import EffectiveDataLayer
from app.schemas import StatusCardData, Citation

def get_well_threshold(well_type: str) -> float:
    if well_type == "T350":
        return 20.0
    return 15.0

def calculate_well_status(well_id: str, db: Session, target_date: str = "2026-10-16") -> Optional[StatusCardData]:
    well = db.query(Well).filter(Well.asset_id == well_id).first()
    if not well:
        return None
        
    eff_layer = EffectiveDataLayer(db)
    
    # Get latest inspection up to target_date
    query = db.query(Inspection).filter(
        Inspection.asset_id == well_id,
        Inspection.inspected_at <= f"{target_date}T23:59:59Z"
    ).order_by(Inspection.inspected_at.desc())
    latest_insp_raw = query.first()
    
    if not latest_insp_raw:
        return None
        
    insp = eff_layer.get_effective_inspection(latest_insp_raw)
    threshold = get_well_threshold(well.well_type)
    temp_diff = insp["temp_diff"]
    is_producing = temp_diff >= threshold
    
    # Inspector name
    inspector_user = db.query(User).filter(User.user_id == insp["inspector_user_id"]).first()
    inspector_name = inspector_user.name if inspector_user else insp["inspector_user_id"] or "Unknown"
    
    # Area name
    area = db.query(Area).filter(Area.area_id == well.area_id).first()
    area_name = area.name if area else well.area_id
    
    # Reason analysis if not producing
    reason = None
    citations = []
    
    # Citation 1: The inspection
    citations.append(Citation(
        source_id=insp["inspection_id"],
        source_type="inspection",
        asset_id=well_id,
        date=insp["inspected_at"],
        source_file=f"assets/{well_id}/inspections.jsonl",
        excerpt=f"Wellhead: {insp['wellhead_temp_c']} °C, Ambient: {insp['ambient_temp_c']} °C, Diff: {temp_diff} °C (Threshold: {threshold} °C). Notes: {insp['notes'] or 'None'}",
        field_values={
            "wellhead_temp_c": insp["wellhead_temp_c"],
            "ambient_temp_c": insp["ambient_temp_c"],
            "temp_diff": temp_diff,
            "threshold": threshold,
            "spill_detected": insp["spill_detected"]
        }
    ))
    
    # Citation 2: Operating Manual threshold rule
    citations.append(Citation(
        source_id=f"OM-{well.well_type}",
        source_type="manual",
        asset_id=well_id,
        source_file=f"fleet/well-types/{well.well_type}.md",
        excerpt=f"A {well.well_type} well is producing when wellhead temperature is at least {threshold} °C above ambient air temperature."
    ))

    # Look for operational context notes
    notes = db.query(ContextNote).filter(
        ContextNote.asset_id == well_id,
        ContextNote.created_at <= f"{target_date}T23:59:59Z"
    ).order_by(ContextNote.created_at.desc()).all()
    
    matching_note = None
    for n in notes:
        txt = n.text.lower()
        # Check validity window or recent shut in text
        if n.valid_from and n.valid_from <= target_date:
            if not n.valid_to or n.valid_to >= target_date:
                matching_note = n
                break
        elif "shut in" in txt or "down" in txt or "workover" in txt or "replacement" in txt:
            matching_note = n
            break

    # Look for open maintenance records
    open_maint = db.query(Maintenance).filter(
        Maintenance.asset_id == well_id,
        Maintenance.started_at <= f"{target_date}T23:59:59Z"
    ).order_by(Maintenance.started_at.desc()).all()
    
    matching_maint = None
    for m in open_maint:
        if not m.completed_at or m.completed_at > f"{target_date}T23:59:59Z" or "still open" in (m.issue or "").lower():
            matching_maint = m
            break

    if not is_producing:
        if matching_note:
            author = db.query(User).filter(User.user_id == matching_note.author_user_id).first()
            author_name = author.name if author else matching_note.author_user_id
            reason = f"Note {matching_note.note_id} by {author_name}: {matching_note.text}"
            citations.append(Citation(
                source_id=matching_note.note_id,
                source_type="note",
                asset_id=well_id,
                date=matching_note.created_at,
                source_file=f"assets/{well_id}/context.jsonl",
                excerpt=matching_note.text
            ))
        elif matching_maint:
            reason = f"Repair {matching_maint.maintenance_id}, {matching_maint.issue or matching_maint.equipment_kind}, started {matching_maint.started_at[:10]}, still open"
            citations.append(Citation(
                source_id=matching_maint.maintenance_id,
                source_type="maintenance",
                asset_id=well_id,
                date=matching_maint.started_at,
                source_file=f"assets/{well_id}/maintenance.jsonl",
                excerpt=f"{matching_maint.issue or ''} - Action: {matching_maint.action_taken or ''}"
            ))
        elif insp["notes"]:
            reason = f"No formal recorded reason. Inspector remark: \"{insp['notes']}\""
        else:
            reason = "No recorded reason found. On-site verification recommended."
    else:
        reason = "Normal production: wellhead thermal differential exceeds operational limit."

    # Compare with metadata recorded_status
    rec_status = well.recorded_status or "unknown"
    rec_out_of_date = False
    if is_producing and rec_status.lower() == "down":
        rec_out_of_date = True
    elif not is_producing and rec_status.lower() == "active":
        rec_out_of_date = True

    return StatusCardData(
        asset_id=well.asset_id,
        name=well.name,
        well_type=well.well_type,
        area_name=area_name,
        latest_inspection_id=insp["inspection_id"],
        latest_inspected_at=insp["inspected_at"],
        inspector_name=inspector_name,
        method=insp["method"] or "drone",
        ambient_temp_c=insp["ambient_temp_c"],
        wellhead_temp_c=insp["wellhead_temp_c"],
        temp_difference=temp_diff,
        applicable_threshold_c=threshold,
        is_producing=is_producing,
        recorded_status=rec_status,
        recorded_status_out_of_date=rec_out_of_date,
        reason=reason,
        notes=insp["notes"],
        citations=citations
    )
