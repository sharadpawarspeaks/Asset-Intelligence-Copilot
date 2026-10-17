from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.rag.retriever import DocumentRetriever

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("/search")
def search_documents(
    q: str = Query(...),
    doc_type: str = Query(None),
    asset_id: str = Query(None),
    limit: int = Query(5),
    db: Session = Depends(get_db)
):
    retriever = DocumentRetriever(db)
    results = retriever.search(query=q, doc_type=doc_type, asset_id=asset_id, top_k=limit)
    return {
        "query": q,
        "results": results
    }
