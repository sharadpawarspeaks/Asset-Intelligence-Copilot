from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Area, Well, Maintenance
from app.engines.downtime_engine import get_area_top_downtime_wells, calculate_well_downtime
from app.engines.maintenance_engine import calculate_well_repair_costs, find_wells_requiring_rca

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/downtime")
def get_downtime_analytics(
    area_id: str = Query("NE-07"),
    start_date: str = Query("2026-06-16"),
    end_date: str = Query("2026-10-16"),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    top_wells = get_area_top_downtime_wells(area_id, start_date, end_date, limit, db)
    return {
        "area_id": area_id,
        "start_date": start_date,
        "end_date": end_date,
        "top_wells": top_wells
    }

@router.get("/maintenance")
def get_maintenance_analytics(
    year: int = Query(2026),
    db: Session = Depends(get_db)
):
    # Total repair costs, breakdown by equipment kind and type
    records = db.query(Maintenance).filter(
        Maintenance.started_at.startswith(str(year))
    ).all()
    
    by_equipment = {}
    by_type = {"corrective": 0.0, "scheduled": 0.0}
    total_cost = 0.0
    
    for r in records:
        cost = r.cost_total or 0.0
        total_cost += cost
        eq = r.equipment_kind or "other"
        by_equipment[eq] = by_equipment.get(eq, 0.0) + cost
        m_type = (r.maintenance_type or "corrective").lower()
        if m_type in by_type:
            by_type[m_type] += cost
            
    return {
        "year": year,
        "total_cost": round(total_cost, 2),
        "total_jobs": len(records),
        "by_equipment": {k: round(v, 2) for k, v in by_equipment.items()},
        "by_type": {k: round(v, 2) for k, v in by_type.items()}
    }

@router.get("/rca-requirements")
def get_rca_requirements(
    area_id: str = Query("NE-07"),
    equipment_kind: str = Query("pump_jack"),
    db: Session = Depends(get_db)
):
    rca_wells = find_wells_requiring_rca(area_id, equipment_kind=equipment_kind, db=db)
    return {
        "area_id": area_id,
        "equipment_kind": equipment_kind,
        "wells": rca_wells
    }
