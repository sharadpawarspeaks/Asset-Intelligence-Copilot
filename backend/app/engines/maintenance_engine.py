from sqlalchemy.orm import Session
from app.models import Well, Maintenance, Area
from app.engines.effective_data import EffectiveDataLayer
from app.schemas import Citation

def calculate_well_repair_costs(
    well_ids: list[str],
    year: int = 2026,
    db: Session = None
) -> dict:
    results = {}
    total_all = 0.0
    citations = []
    
    start_date = f"{year}-01-01"
    end_date = f"{year}-12-31"
    
    for wid in well_ids:
        maint_records = db.query(Maintenance).filter(
            Maintenance.asset_id == wid,
            Maintenance.started_at >= start_date,
            Maintenance.started_at <= end_date
        ).all()
        
        labor = sum(m.cost_labor or 0.0 for m in maint_records)
        parts = sum(m.cost_parts or 0.0 for m in maint_records)
        total = sum(m.cost_total or 0.0 for m in maint_records)
        total_all += total
        
        results[wid] = {
            "asset_id": wid,
            "record_count": len(maint_records),
            "cost_labor": round(labor, 2),
            "cost_parts": round(parts, 2),
            "cost_total": round(total, 2)
        }
        
        for m in maint_records:
            citations.append(Citation(
                source_id=m.maintenance_id,
                source_type="maintenance",
                asset_id=wid,
                date=m.started_at,
                source_file=f"assets/{wid}/maintenance.jsonl",
                excerpt=f"Job {m.maintenance_id} ({m.equipment_kind}): ${m.cost_total} total (${m.cost_labor} labor, ${m.cost_parts} parts). {m.issue or ''}"
            ))
            
    return {
        "year": year,
        "wells": results,
        "total_cost_usd": round(total_all, 2),
        "citations": citations
    }

def find_wells_requiring_rca(
    area_id: str = None,
    equipment_kind: str = "pump_jack",
    start_date: str = "2025-10-16",
    end_date: str = "2026-10-16",
    db: Session = None
) -> list[dict]:
    eff_layer = EffectiveDataLayer(db)
    query = db.query(Well)
    if area_id:
        area = db.query(Area).filter(Area.area_id == area_id).first()
        if not area:
            area = db.query(Area).filter(Area.name == area_id).first()
        if area:
            query = query.filter(Well.area_id == area.area_id)
            
    wells = query.all()
    qualifying_wells = []
    
    for w in wells:
        # Count corrective repairs on equipment_kind in 12 months
        corrective_jobs = db.query(Maintenance).filter(
            Maintenance.asset_id == w.asset_id,
            Maintenance.equipment_kind == equipment_kind,
            Maintenance.maintenance_type == "corrective",
            Maintenance.started_at >= start_date,
            Maintenance.started_at <= end_date
        ).order_by(Maintenance.started_at.asc()).all()
        
        repair_count = len(corrective_jobs)
        thresh, is_custom, source_rule = eff_layer.get_rca_threshold(w.well_type, equipment_kind)
        
        if repair_count >= thresh:
            citations = [
                Citation(
                    source_id=m.maintenance_id,
                    source_type="maintenance",
                    asset_id=w.asset_id,
                    date=m.started_at,
                    source_file=f"assets/{w.asset_id}/maintenance.jsonl",
                    excerpt=f"Corrective repair {m.maintenance_id}: {m.issue or ''}"
                )
                for m in corrective_jobs
            ]
            citations.append(Citation(
                source_id="RULE-RCA",
                source_type="rule",
                asset_id=w.asset_id,
                excerpt=source_rule
            ))
            
            qualifying_wells.append({
                "asset_id": w.asset_id,
                "well_name": w.name,
                "well_type": w.well_type,
                "equipment_kind": equipment_kind,
                "repair_count": repair_count,
                "threshold": thresh,
                "is_custom_rule": is_custom,
                "rule_source": source_rule,
                "job_ids": [m.maintenance_id for m in corrective_jobs],
                "citations": citations
            })
            
    qualifying_wells.sort(key=lambda x: (x["repair_count"], x["asset_id"]), reverse=True)
    return qualifying_wells
