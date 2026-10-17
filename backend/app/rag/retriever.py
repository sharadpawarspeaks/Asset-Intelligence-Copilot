import re
import math
from collections import Counter
from sqlalchemy.orm import Session
from app.models import DocumentChunk
from app.schemas import Citation

class DocumentRetriever:
    def __init__(self, db: Session):
        self.db = db

    def search(
        self,
        query: str,
        doc_type: str = None,
        asset_id: str = None,
        top_k: int = 5
    ) -> list[dict]:
        """
        Hybrid search using BM25-style term frequency scoring and exact phrase boosting.
        """
        db_query = self.db.query(DocumentChunk)
        if doc_type:
            db_query = db_query.filter(DocumentChunk.doc_type == doc_type)
        if asset_id:
            db_query = db_query.filter(DocumentChunk.source_path.contains(asset_id))
            
        # Clean query tokens
        raw_tokens = re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', query.lower())
        stop_words = {"the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "what", "which", "how", "has"}
        tokens = [t for t in raw_tokens if t not in stop_words]
        
        if not tokens:
            return []

        # Find candidates matching any token in section or content
        candidates = []
        # Pre-filter in SQL using LIKE on primary tokens
        primary_tokens = tokens[:3]
        clauses = [DocumentChunk.content.ilike(f"%{tok}%") for tok in primary_tokens]
        if clauses:
            from sqlalchemy import or_
            db_candidates = db_query.filter(or_(*clauses)).limit(200).all()
        else:
            db_candidates = db_query.limit(200).all()

        results = []
        phrase = query.lower()

        for chunk in db_candidates:
            text = (chunk.content or "").lower()
            sec = (chunk.section or "").lower()
            
            # Score calculation
            score = 0.0
            # Phrase boost
            if phrase in text:
                score += 15.0
            if phrase in sec:
                score += 20.0
                
            # Token matches
            text_tokens = re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', text)
            sec_tokens = re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', sec)
            t_counts = Counter(text_tokens)
            s_counts = Counter(sec_tokens)
            
            for tok in tokens:
                if tok in t_counts:
                    score += 1.0 + math.log(1 + t_counts[tok])
                if tok in s_counts:
                    score += 3.0
                    
            if score > 0:
                results.append({
                    "chunk_id": chunk.chunk_id,
                    "doc_id": chunk.doc_id,
                    "doc_type": chunk.doc_type,
                    "title": chunk.title,
                    "source_path": chunk.source_path,
                    "section": chunk.section,
                    "content": chunk.content,
                    "score": round(score, 2)
                })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def get_citations_for_chunks(self, chunks: list[dict]) -> list[Citation]:
        citations = []
        for c in chunks:
            citations.append(Citation(
                source_id=c["doc_id"],
                source_type=c["doc_type"],
                source_file=c["source_path"],
                excerpt=f"[{c['section']}] {c['content'][:250]}..."
            ))
        return citations
