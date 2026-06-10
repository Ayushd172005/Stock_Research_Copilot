from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
class DocumentUploadResponse(BaseModel):
    doc_id: str
    filename: str
    company_name: str
    year: Optional[str] = None
    pages: int
    chunks: int
    status: str


class ChatRequest(BaseModel):
    query: str
    doc_ids: List[str]
    chat_history: Optional[List[Dict[str, str]]] = []


class Source(BaseModel):
    doc_id: str
    company_name: str
    page: int
    chunk_text: str
    relevance_score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
    query: str


class FinancialRatios(BaseModel):
    company_name: str
    year: Optional[str]
    revenue: Optional[str] = None
    net_income: Optional[str] = None
    eps: Optional[str] = None
    pe_ratio: Optional[str] = None
    debt_to_equity: Optional[str] = None
    roe: Optional[str] = None
    roa: Optional[str] = None
    gross_margin: Optional[str] = None
    operating_margin: Optional[str] = None
    current_ratio: Optional[str] = None
    quick_ratio: Optional[str] = None
    free_cash_flow: Optional[str] = None
    raw_extracted: Dict[str, Any] = {}


class EarningsSummary(BaseModel):
    company_name: str
    year: Optional[str]
    headline: str
    key_highlights: List[str]
    risks: List[str]
    opportunities: List[str]
    management_outlook: str
    full_summary: str


class ComparisonRequest(BaseModel):
    doc_ids: List[str]
    metrics: Optional[List[str]] = None


class ComparisonResult(BaseModel):
    companies: List[str]
    comparison_table: List[Dict[str, Any]]
    analysis: str
    recommendation: str


class DocumentMeta(BaseModel):
    doc_id: str
    filename: str
    company_name: str
    year: Optional[str]
    pages: int
    chunks: int
    uploaded_at: str
    status: str
