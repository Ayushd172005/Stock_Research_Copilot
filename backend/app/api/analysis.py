from fastapi import APIRouter, HTTPException
from typing import List, Optional

from app.models.schemas import FinancialRatios, EarningsSummary, ComparisonResult, ComparisonRequest
from app.services.analysis_service import analysis_service 

router = APIRouter()


@router.get("/{doc_id}/ratios", response_model=FinancialRatios)
async def get_financial_ratios(doc_id: str):
    """Extract financial ratios from a document."""
    try:
        return await analysis_service.extract_financial_ratios(doc_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.get("/{doc_id}/summary", response_model=EarningsSummary)
async def get_earnings_summary(doc_id: str):
    """Generate earnings summary for a document."""
    try:
        return await analysis_service.generate_earnings_summary(doc_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary failed: {str(e)}")


@router.post("/compare", response_model=ComparisonResult)
async def compare_companies(request: ComparisonRequest):
    """Compare multiple companies from their annual reports."""
    if len(request.doc_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 documents required")
    if len(request.doc_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 documents for comparison")
    
    try:
        return await analysis_service.compare_companies(request.doc_ids, request.metrics)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
