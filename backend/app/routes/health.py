from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Well, Inspection, User, Area
from app.config import settings

router = APIRouter(tags=["health"])

@router.get("/api/health")
def get_health(db: Session = Depends(get_db)):
    well_count = db.query(Well).count()
    insp_count = db.query(Inspection).count()
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "database": "connected",
        "wells_count": well_count,
        "inspections_count": insp_count,
        "ai_provider": settings.AI_PROVIDER,
        "reference_date": settings.REFERENCE_DATE
    }

@router.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "user_id": u.user_id,
            "name": u.name,
            "role": u.role,
            "team_id": u.team_id
        }
        for u in users
    ]

@router.get("/api/areas")
def get_areas(db: Session = Depends(get_db)):
    areas = db.query(Area).all()
    return [
        {
            "area_id": a.area_id,
            "name": a.name,
            "team_id": a.team_id,
            "center_lat": a.center_lat,
            "center_lon": a.center_lon
        }
        for a in areas
    ]
