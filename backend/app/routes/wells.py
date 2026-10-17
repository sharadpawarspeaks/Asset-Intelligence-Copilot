from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Well, Inspection, Maintenance, ContextNote, Area
from app.engines.production_engine import calculate_well_status
from app.engines.effective_data import EffectiveDataLayer

router = APIRouter(prefix="/api/wells", tags=["wells"])

@router.get("")
def list_wells(
    area_id: str = Query(None),
    well_type: str = Query(None),
    status: str = Query(None),
    search: str = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Well)
    if area_id:
        query = query.filter(Well.area_id == area_id)
    if well_type:
        query = query.filter(Well.well_type == well_type)
    if search:
        query = query.filter(Well.asset_id.ilike(f"%{search}%") | Well.name.ilike(f"%{search}%"))
        
    total = query.count()
    wells = query.offset(skip).limit(limit).all()
    
    # Calculate live status for each well
    items = []
    for w in wells:
        status_card = calculate_well_status(w.asset_id, db)
        items.append({
            "asset_id": w.asset_id,
            "name": w.name,
            "well_type": w.well_type,
            "area_id": w.area_id,
            "team_id": w.team_id,
            "lat": w.lat,
            "lon": w.lon,
            "installed_on": w.installed_on,
            "recorded_status": w.recorded_status,
            "is_producing": status_card.is_producing if status_card else False,
            "temp_difference": status_card.temp_difference if status_card else None,
            "recorded_status_out_of_date": status_card.recorded_status_out_of_date if status_card else False
        })
        
    return {"total": total, "items": items, "skip": skip, "limit": limit}

@router.get("/{well_id}")
def get_well(well_id: str, db: Session = Depends(get_db)):
    card = calculate_well_status(well_id, db)
    if not card:
        raise HTTPException(status_code=404, detail="Well not found")
    well = db.query(Well).filter(Well.asset_id == well_id).first()
    return {
        "status_card": card.model_dump(),
        "equipment": [{"id": e.equipment_id, "kind": e.kind, "model": e.model} for e in well.equipment],
        "metadata": {
            "asset_id": well.asset_id,
            "name": well.name,
            "well_type": well.well_type,
            "area_id": well.area_id,
            "lat": well.lat,
            "lon": well.lon,
            "installed_on": well.installed_on,
            "recorded_status": well.recorded_status
        }
    }

@router.get("/{well_id}/inspections")
def get_well_inspections(well_id: str, limit: int = 50, db: Session = Depends(get_db)):
    eff_layer = EffectiveDataLayer(db)
    raws = db.query(Inspection).filter(Inspection.asset_id == well_id).order_by(Inspection.inspected_at.desc()).limit(limit).all()
    return [eff_layer.get_effective_inspection(r) for r in raws]

@router.get("/{well_id}/maintenance")
def get_well_maintenance(well_id: str, limit: int = 50, db: Session = Depends(get_db)):
    maint = db.query(Maintenance).filter(Maintenance.asset_id == well_id).order_by(Maintenance.started_at.desc()).limit(limit).all()
    return [
        {
            "maintenance_id": m.maintenance_id,
            "started_at": m.started_at,
            "completed_at": m.completed_at,
            "maintenance_type": m.maintenance_type,
            "equipment_kind": m.equipment_kind,
            "issue": m.issue,
            "action_taken": m.action_taken,
            "technician_user_id": m.technician_user_id,
            "contractor": m.contractor,
            "downtime_hours": m.downtime_hours,
            "cost_total": m.cost_total,
            "report_file": m.report_file
        }
        for m in maint
    ]

@router.get("/{well_id}/knowledge")
def get_well_knowledge(well_id: str, db: Session = Depends(get_db)):
    notes = db.query(ContextNote).filter(ContextNote.asset_id == well_id).order_by(ContextNote.created_at.desc()).all()
    return [
        {
            "note_id": n.note_id,
            "created_at": n.created_at,
            "author_user_id": n.author_user_id,
            "note_type": n.note_type,
            "text": n.text,
            "valid_from": n.valid_from,
            "valid_to": n.valid_to,
            "is_unconfirmed": n.is_unconfirmed
        }
        for n in notes
    ]
