from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.agent.orchestrator import AgentOrchestrator
from app.schemas import ChatRequest, ChatResponse
from app.models import Conversation, ConversationMessage

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def post_chat(req: ChatRequest, db: Session = Depends(get_db)):
    orchestrator = AgentOrchestrator(db, user_id=req.user_id)
    return orchestrator.process_chat(req)
