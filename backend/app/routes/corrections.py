from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Correction, TypeOperationalRule
from app.schemas import CorrectionProposeRequest, TypeRuleProposeRequest
from app.agent.tools import AgentTools

router = APIRouter(prefix="/api/corrections", tags=["corrections"])

@router.get("")
def list_corrections(db: Session = Depends(get_db)):
    corrs = db.query(Correction).order_by(Correction.created_at.desc()).all()
    type_rules = db.query(TypeOperationalRule).all()
    return {
        "corrections": [
            {
                "correction_id": c.correction_id,
                "target_table": c.target_table,
                "target_id": c.target_id,
                "target_field": c.target_field,
                "original_value": c.original_value,
                "corrected_value": c.corrected_value,
                "author_user_id": c.author_user_id,
                "created_at": c.created_at,
                "reason": c.reason,
                "status": c.status,
                "conflict_detected": c.conflict_detected,
                "conflict_notes": c.conflict_notes
            }
            for c in corrs
        ],
        "type_rules": [
            {
                "rule_id": r.rule_id,
                "well_type": r.well_type,
                "rule_name": r.rule_name,
                "parameter_value": r.parameter_value,
                "author_user_id": r.author_user_id,
                "reason": r.reason,
                "is_active": r.is_active
            }
            for r in type_rules
        ]
    }

@router.post("/propose")
def propose_correction(req: CorrectionProposeRequest, db: Session = Depends(get_db)):
    tools = AgentTools(db, user_id=req.author_user_id)
    return tools.propose_data_correction(
        target_table=req.target_table,
        target_id=req.target_id,
        target_field=req.target_field,
        corrected_value=req.corrected_value,
        reason=req.reason,
        author_user_id=req.author_user_id
    )

@router.post("/type-rule")
def propose_type_rule(req: TypeRuleProposeRequest, db: Session = Depends(get_db)):
    tools = AgentTools(db, user_id=req.author_user_id)
    return tools.propose_type_rule(
        well_type=req.well_type,
        rule_name=req.rule_name,
        parameter_value=req.parameter_value,
        reason=req.reason,
        author_user_id=req.author_user_id
    )

@router.post("/{correction_id}/review")
def review_correction(correction_id: str, action: str, comment: str = None, db: Session = Depends(get_db)):
    corr = db.query(Correction).filter(Correction.correction_id == correction_id).first()
    if not corr:
        raise HTTPException(status_code=404, detail="Correction not found")
    corr.status = action # accepted, rejected, disputed
    corr.review_comment = comment
    db.commit()
    return {"status": "updated", "correction_id": correction_id, "new_status": action}
