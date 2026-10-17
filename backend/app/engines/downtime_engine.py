from typing import Optional
from sqlalchemy.orm import Session
from app.models import Well, Inspection, Area
from app.engines.effective_data import EffectiveDataLayer
from app.engines.production_engine import get_well_threshold
from app.schemas import Citation

def calculate_well_downtime(
    well_id: str,
    start_date: str,
    end_date: str,
    db: Session
) -> dict:
    well = db.query(Well).filter(Well.asset_id == well_id).first()
    if not well:
        return {"asset_id": well_id, "downtime_days": 0, "qualifying_inspections": [], "citations": []}
        
    threshold = get_well_threshold(well.well_type)
    eff_layer = EffectiveDataLayer(db)
    
    # Query inspections in period
    inspections = db.query(Inspection).filter(
        Inspection.asset_id == well_id,
        Inspection.inspected_at >= f"{start_date}T00:00:00Z",
        Inspection.inspected_at <= f"{end_date}T23:59:59Z"
    ).order_by(Inspection.inspected_at.asc()).all()
    
    down_inspections = []
    citations = []
    
    for raw_insp in inspections:
        insp = eff_layer.get_effective_inspection(raw_insp)
        diff = insp["temp_diff"]
        if diff < threshold:
            down_inspections.append(insp)
            citations.append(Citation(
                source_id=insp["inspection_id"],
                source_type="inspection",
                asset_id=well_id,
                date=insp["inspected_at"],
                source_file=f"assets/{well_id}/inspections.jsonl",
                excerpt=f"Inspected at {insp['inspected_at'][:10]}: Wellhead {insp['wellhead_temp_c']} °C, Ambient {insp['ambient_temp_c']} °C, Diff {diff} °C < {threshold} °C",
                field_values={
                    "wellhead_temp_c": insp["wellhead_temp_c"],
                    "ambient_temp_c": insp["ambient_temp_c"],
                    "temp_diff": diff,
                    "threshold": threshold
                }
            ))
            
    days = len(down_inspections) * 7
    method_explanation = (
        f"Downtime: {days} days. "
        f"Calculation: {len(down_inspections)} qualifying weekly inspections × 7 days per inspection. "
        f"Rule: Under the {well.well_type} manual, wellhead temperature difference must be >= {threshold} °C; "
        f"each inspection below threshold contributes 7 days downtime. Missed inspections add 0 days."
    )
    
    return {
        "asset_id": well_id,
        "well_name": well.name,
        "well_type": well.well_type,
        "start_date": start_date,
        "end_date": end_date,
        "total_inspections_in_period": len(inspections),
        "qualifying_inspection_count": len(down_inspections),
        "downtime_days": days,
        "qualifying_inspections": down_inspections,
        "citations": citations,
        "explanation": method_explanation
    }

def get_area_top_downtime_wells(
    area_id: str,
    start_date: str,
    end_date: str,
    limit: int,
    db: Session
) -> list[dict]:
    # Find wells in area
    area = db.query(Area).filter(Area.area_id == area_id).first()
    if not area:
        # Try finding by name
        area = db.query(Area).filter(Area.name == area_id).first()
    if not area:
        return []
        
    wells = db.query(Well).filter(Well.area_id == area.area_id).all()
    results = []
    for w in wells:
        res = calculate_well_downtime(w.asset_id, start_date, end_date, db)
        results.append(res)
        
    results.sort(key=lambda x: x["downtime_days"], reverse=True)
    return results[:limit]
