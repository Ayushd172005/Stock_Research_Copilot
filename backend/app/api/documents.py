from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List, Optional
from app.services.pdf_service import pdf_processor
from app.services.vector_store import vector_store
from app.models.schemas import DocumentUploadResponse, DocumentMeta

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    company_name: Optional[str] = Form(None),
    year: Optional[str] = Form(None),
):
    """Upload an annual report PDF and index it."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    if file.size and file.size > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File size must be under 50MB")

    try:
        # Save file
        content = await file.read()
        doc_id, file_path = pdf_processor.save_uploaded_file(content, file.filename)

        # Extract text
        full_text, page_count = pdf_processor.extract_text_from_pdf(file_path)

        if not full_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from PDF. It may be scanned/image-only.")

        # Infer metadata if not provided
        inferred_company, inferred_year = pdf_processor.infer_company_and_year(
            file.filename, full_text
        )
        final_company = company_name or inferred_company
        final_year = year or inferred_year

        # Chunk documents
        documents = pdf_processor.create_chunks(full_text, doc_id, final_company, final_year)

        # Index in FAISS
        chunk_count = vector_store.index_documents(doc_id, documents)

        # Register metadata
        pdf_processor.register_document(
            doc_id=doc_id,
            filename=file.filename,
            company_name=final_company,
            year=final_year,
            pages=page_count,
            chunks=chunk_count,
        )

        return DocumentUploadResponse(
            doc_id=doc_id,
            filename=file.filename,
            company_name=final_company,
            year=final_year,
            pages=page_count,
            chunks=chunk_count,
            status="ready",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/", response_model=List[DocumentMeta])
async def list_documents():
    """List all uploaded documents."""
    return pdf_processor.list_documents()


@router.get("/{doc_id}", response_model=DocumentMeta)
async def get_document(doc_id: str):
    """Get metadata for a specific document."""
    meta = pdf_processor.get_document_meta(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found")
    return meta


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and its index."""
    meta = pdf_processor.get_document_meta(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found")

    vector_store.delete_index(doc_id)
    pdf_processor.delete_document(doc_id)
    
    return {"message": f"Document {doc_id} deleted successfully"}
