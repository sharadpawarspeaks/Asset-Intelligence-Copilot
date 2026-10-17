import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Conversation, ConversationMessage

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.get("")
def list_conversations(user_id: str = Query("U-201"), db: Session = Depends(get_db)):
    convs = db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).order_by(Conversation.updated_at.desc()).all()
    
    return [
        {
            "conversation_id": c.conversation_id,
            "title": c.title,
            "user_id": c.user_id,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        }
        for c in convs
    ]

@router.get("/{conversation_id}")
def get_conversation(conversation_id: str, user_id: str = Query(None), db: Session = Depends(get_db)):
    query = db.query(Conversation).filter(Conversation.conversation_id == conversation_id)
    if user_id:
        query = query.filter(Conversation.user_id == user_id)
    conv = query.first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or access restricted")
        
    messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).order_by(ConversationMessage.created_at.asc()).all()
    
    parsed_msgs = []
    for m in messages:
        vis_data = None
        if m.visual_data_json:
            try:
                vis_data = json.loads(m.visual_data_json)
            except Exception:
                pass
        citations = []
        if m.citations_json:
            try:
                citations = json.loads(m.citations_json)
            except Exception:
                pass
        parsed_msgs.append({
            "message_id": m.message_id,
            "sender_role": m.sender_role,
            "content": m.content,
            "visual_type": m.visual_type,
            "visual_data": vis_data,
            "citations": citations,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })
        
    return {
        "conversation_id": conv.conversation_id,
        "title": conv.title,
        "user_id": conv.user_id,
        "messages": parsed_msgs
    }

@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.conversation_id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"status": "deleted", "conversation_id": conversation_id}
