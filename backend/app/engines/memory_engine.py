import datetime
from sqlalchemy.orm import Session
from app.models import (
    Conversation, ConversationMessage, ConversationWellReference,
    SharedKnowledge, ContextNote, User, Well
)
from app.schemas import Citation

class MemoryEngine:
    def __init__(self, db: Session):
        self.db = db

    # --- Private Memory ---
    def record_well_references(self, conversation_id: str, user_id: str, well_ids: list[str]):
        for wid in well_ids:
            ref = ConversationWellReference(
                conversation_id=conversation_id,
                user_id=user_id,
                asset_id=wid,
                referenced_at=datetime.datetime.utcnow()
            )
            self.db.add(ref)
        self.db.commit()

    def get_user_recently_discussed_wells(self, user_id: str, limit: int = 3) -> list[str]:
        """
        Retrieves the wells discussed in earlier conversations strictly by the specified user_id.
        """
        refs = self.db.query(ConversationWellReference).filter(
            ConversationWellReference.user_id == user_id
        ).order_by(ConversationWellReference.referenced_at.desc()).all()
        
        wells_seen = []
        for r in refs:
            if r.asset_id not in wells_seen:
                wells_seen.append(r.asset_id)
            if len(wells_seen) >= limit:
                break
        return wells_seen

    def get_conversation_history(self, conversation_id: str, user_id: str) -> list[dict]:
        conv = self.db.query(Conversation).filter(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == user_id
        ).first()
        if not conv:
            return []
        msgs = self.db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation_id
        ).order_by(ConversationMessage.created_at.asc()).all()
        return [
            {
                "message_id": m.message_id,
                "role": m.sender_role,
                "content": m.content,
                "visual_type": m.visual_type,
                "created_at": m.created_at.isoformat()
            }
            for m in msgs
        ]

    # --- Shared Knowledge ---
    def add_shared_knowledge(
        self,
        author_user_id: str,
        statement: str,
        asset_id: str = None,
        well_type_scope: str = None,
        valid_from: str = None,
        valid_to: str = None
    ) -> SharedKnowledge:
        rec = SharedKnowledge(
            asset_id=asset_id,
            well_type_scope=well_type_scope,
            statement=statement,
            author_user_id=author_user_id,
            created_at=datetime.datetime.utcnow().isoformat(),
            valid_from=valid_from,
            valid_to=valid_to,
            status="active"
        )
        self.db.add(rec)
        self.db.commit()
        return rec

    def find_shared_knowledge_for_well(self, asset_id: str, current_date: str = "2026-10-16") -> list[dict]:
        """
        Retrieves active operational shared knowledge notes and context notes for an asset.
        """
        results = []
        # Check SharedKnowledge table
        sk_records = self.db.query(SharedKnowledge).filter(
            SharedKnowledge.asset_id == asset_id,
            SharedKnowledge.status == "active"
        ).all()
        for sk in sk_records:
            author = self.db.query(User).filter(User.user_id == sk.author_user_id).first()
            results.append({
                "source": "shared_knowledge",
                "statement": sk.statement,
                "author": author.name if author else sk.author_user_id,
                "created_at": sk.created_at,
                "valid_from": sk.valid_from,
                "valid_to": sk.valid_to
            })
            
        # Also check ContextNotes
        cnotes = self.db.query(ContextNote).filter(
            ContextNote.asset_id == asset_id
        ).all()
        for cn in cnotes:
            author = self.db.query(User).filter(User.user_id == cn.author_user_id).first()
            results.append({
                "source": "context_note",
                "statement": cn.text,
                "author": author.name if author else cn.author_user_id,
                "created_at": cn.created_at,
                "valid_from": cn.valid_from,
                "valid_to": cn.valid_to,
                "is_unconfirmed": cn.is_unconfirmed
            })
        return results
