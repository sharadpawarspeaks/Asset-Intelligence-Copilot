from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.agent.tools import AgentTools

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

@router.get("/spills")
def get_spills(
    well_id: str = Query(None),
    area_id: str = Query(None),
    start_date: str = Query("2026-07-18"),
    end_date: str = Query("2026-10-16"),
    db: Session = Depends(get_db)
):
    tools = AgentTools(db)
    return tools.get_spills_report(well_id=well_id, area_name_or_id=area_id, start_date=start_date, end_date=end_date)

@router.get("/heatmap")
def get_heatmap(year: int = Query(2026), db: Session = Depends(get_db)):
    tools = AgentTools(db)
    return tools.get_spill_heatmap_data(year=year)

@router.get("/containment-exceeded")
def get_containment_exceeded(area_id: str = Query("SW-24"), db: Session = Depends(get_db)):
    tools = AgentTools(db)
    return tools.get_containment_limit_exceeded_spills(area_id)
