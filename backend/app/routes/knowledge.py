from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SharedKnowledge, ContextNote, User
from app.schemas import SharedKnowledgeCreateRequest

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

@router.get("")
def list_shared_knowledge(db: Session = Depends(get_db)):
    sk_list = db.query(SharedKnowledge).order_by(SharedKnowledge.created_at.desc()).all()
    cnotes = db.query(ContextNote).order_by(ContextNote.created_at.desc()).limit(100).all()
    
    users = {u.user_id: u.name for u in db.query(User).all()}
    
    return {
        "shared_knowledge": [
            {
                "id": s.id,
                "asset_id": s.asset_id,
                "well_type_scope": s.well_type_scope,
                "statement": s.statement,
                "author_user_id": s.author_user_id,
                "author_name": users.get(s.author_user_id, s.author_user_id),
                "created_at": s.created_at,
                "valid_from": s.valid_from,
                "valid_to": s.valid_to,
                "status": s.status
            }
            for s in sk_list
        ],
        "context_notes": [
            {
                "note_id": n.note_id,
                "asset_id": n.asset_id,
                "note_type": n.note_type,
                "text": n.text,
                "author_name": users.get(n.author_user_id, n.author_user_id),
                "created_at": n.created_at,
                "valid_from": n.valid_from,
                "valid_to": n.valid_to,
                "is_unconfirmed": n.is_unconfirmed
            }
            for n in cnotes
        ]
    }

@router.post("")
def add_shared_knowledge(req: SharedKnowledgeCreateRequest, db: Session = Depends(get_db)):
    sk = SharedKnowledge(
        asset_id=req.asset_id,
        well_type_scope=req.well_type_scope,
        statement=req.statement,
        author_user_id=req.author_user_id,
        created_at=req.valid_from or "2026-10-16T00:00:00Z",
        valid_from=req.valid_from,
        valid_to=req.valid_to,
        status="active"
    )
    db.add(sk)
    db.commit()
    return {"status": "created", "id": sk.id}
