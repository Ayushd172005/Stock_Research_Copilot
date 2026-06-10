from fastapi import APIRouter, HTTPException
from typing import List

from app.models.schemas import ChatRequest, ChatResponse, Source
from app.services.vector_store import vector_store
from app.services.llm_service import llm_service
from app.services.pdf_service import pdf_processor

router = APIRouter()


@router.post("/query", response_model=ChatResponse)
async def query_documents(request: ChatRequest):
    """Query documents using RAG pipeline."""
    if not request.doc_ids:
        raise HTTPException(status_code=400, detail="At least one document must be selected")

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Validate documents exist
    for doc_id in request.doc_ids:
        if not pdf_processor.get_document_meta(doc_id):
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")

    try:
        # Retrieve relevant chunks
        search_results = vector_store.search(
            query=request.query,
            doc_ids=request.doc_ids,
            k=8
        )

        if not search_results:
            return ChatResponse(
                answer="I couldn't find relevant information in the selected documents to answer your question.",
                sources=[],
                query=request.query,
            )

        # Prepare context chunks
        context_chunks = [doc.page_content for doc, _ in search_results]

        # Build sources for attribution
        sources = []
        for doc, score in search_results[:5]:
            meta = doc.metadata
            sources.append(Source(
                doc_id=meta.get("doc_id", ""),
                company_name=meta.get("company_name", "Unknown"),
                page=meta.get("page", 0),
                chunk_text=doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content,
                relevance_score=round(1.0 / (1.0 + score), 4),  # Convert L2 distance to similarity
            ))

        # Generate answer using LLM
        answer = await llm_service.answer_query(
            query=request.query,
            context_chunks=context_chunks,
            chat_history=request.chat_history or [],
        )

        return ChatResponse(
            answer=answer,
            sources=sources,
            query=request.query,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@router.post("/stream")
async def stream_query(request: ChatRequest):
    """Stream chat response using SSE."""
    from fastapi.responses import StreamingResponse
    import json

    async def generate():
        try:
            search_results = vector_store.search(request.query, request.doc_ids, k=8)
            context_chunks = [doc.page_content for doc, _ in search_results]

            # Stream token by token
            from app.services.llm_service import get_llm, build_rag_prompt
            llm = get_llm()
            messages = build_rag_prompt(request.query, context_chunks, request.chat_history or [])

            async for chunk in llm.astream(messages):
                if chunk.content:
                    data = json.dumps({"token": chunk.content, "done": False})
                    yield f"data: {data}\n\n"

            yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
