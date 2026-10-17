from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import IngestionRun
from app.ingest import run_ingestion
import json

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])

@router.get("/runs")
def list_runs(db: Session = Depends(get_db)):
    runs = db.query(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(20).all()
    return [
        {
            "run_id": r.run_id,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "status": r.status,
            "files_discovered": r.files_discovered,
            "records_imported": r.records_imported,
            "duplicates_skipped": r.duplicates_skipped,
            "errors_count": r.errors_count,
            "summary": json.loads(r.summary_json) if r.summary_json else None
        }
        for r in runs
    ]

@router.post("/run")
def trigger_ingestion(data_dir: str = Query(None), db: Session = Depends(get_db)):
    report = run_ingestion(data_dir=data_dir)
    return report
