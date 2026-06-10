import os
import uuid
import json
from typing import List, Tuple, Dict, Any
from datetime import datetime
import pdfplumber
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.core.config import get_settings

settings = get_settings()


class PDFProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )
        os.makedirs(settings.upload_dir, exist_ok=True)
        self._metadata_store: Dict[str, Dict] = {}
        self._load_metadata()

    def _metadata_path(self) -> str:
        return os.path.join(settings.upload_dir, "metadata.json")

    def _load_metadata(self):
        path = self._metadata_path()
        if os.path.exists(path):
            with open(path, "r") as f:
                self._metadata_store = json.load(f)

    def _save_metadata(self):
        with open(self._metadata_path(), "w") as f:
            json.dump(self._metadata_store, f, indent=2)

    def extract_text_from_pdf(self, file_path: str) -> Tuple[str, int]:
        """Extract full text and page count from PDF."""
        full_text = []
        page_count = 0

        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    full_text.append(f"[PAGE {i+1}]\n{text}")

                # Also extract tables
                tables = page.extract_tables()
                for table in tables:
                    if table:
                        table_text = self._table_to_text(table)
                        full_text.append(f"[TABLE - PAGE {i+1}]\n{table_text}")

        return "\n\n".join(full_text), page_count

    def _table_to_text(self, table: List[List]) -> str:
        """Convert extracted table to readable text."""
        rows = []
        for row in table:
            if row:
                cleaned = [str(cell).strip() if cell else "" for cell in row]
                rows.append(" | ".join(cleaned))
        return "\n".join(rows)

    def infer_company_and_year(self, filename: str, text_sample: str) -> Tuple[str, str]:
        """Infer company name and year from filename or text."""
        # Try filename parsing
        name_parts = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
        
        # Extract year (look for 4-digit year)
        import re
        year_match = re.search(r'\b(20\d{2}|19\d{2})\b', name_parts + text_sample[:500])
        year = year_match.group(0) if year_match else "Unknown"

        # Company name: first meaningful tokens from filename
        tokens = name_parts.split()
        company = " ".join(t for t in tokens if not t.isdigit() and len(t) > 1)[:50]
        if not company:
            company = "Unknown Company"

        return company.strip(), year

    def create_chunks(self, text: str, doc_id: str, company_name: str, year: str) -> List[Document]:
        """Split text into chunks with metadata."""
        import re
        raw_chunks = self.text_splitter.split_text(text)
        
        documents = []
        for i, chunk in enumerate(raw_chunks):
            # Extract page number if present
            page_match = re.search(r'\[PAGE (\d+)\]', chunk)
            page_num = int(page_match.group(1)) if page_match else 0

            doc = Document(
                page_content=chunk,
                metadata={
                    "doc_id": doc_id,
                    "company_name": company_name,
                    "year": year,
                    "chunk_index": i,
                    "page": page_num,
                    "source": f"{company_name} Annual Report {year}",
                }
            )
            documents.append(doc)
        return documents

    def save_uploaded_file(self, file_bytes: bytes, filename: str) -> str:
        """Save uploaded file and return path."""
        doc_id = str(uuid.uuid4())
        ext = os.path.splitext(filename)[1]
        save_path = os.path.join(settings.upload_dir, f"{doc_id}{ext}")
        
        with open(save_path, "wb") as f:
            f.write(file_bytes)
        
        return doc_id, save_path

    def register_document(self, doc_id: str, filename: str, company_name: str,
                          year: str, pages: int, chunks: int):
        """Register document metadata."""
        self._metadata_store[doc_id] = {
            "doc_id": doc_id,
            "filename": filename,
            "company_name": company_name,
            "year": year,
            "pages": pages,
            "chunks": chunks,
            "uploaded_at": datetime.utcnow().isoformat(),
            "status": "ready",
        }
        self._save_metadata()

    def get_document_meta(self, doc_id: str) -> Dict:
        return self._metadata_store.get(doc_id)

    def list_documents(self) -> List[Dict]:
        return list(self._metadata_store.values())

    def delete_document(self, doc_id: str):
        meta = self._metadata_store.pop(doc_id, None)
        self._save_metadata()
        return meta


pdf_processor = PDFProcessor()
