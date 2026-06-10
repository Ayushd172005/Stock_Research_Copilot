import json
from typing import List, Dict, Optional, Any
from app.services.vector_store import vector_store
from app.services.llm_service import llm_service, build_extraction_prompt
from app.services.pdf_service import pdf_processor
from app.models.schemas import FinancialRatios, EarningsSummary, ComparisonResult
from app.core.config import get_settings

settings = get_settings()


class AnalysisService:

    async def extract_financial_ratios(self, doc_id: str) -> FinancialRatios:
        """Extract key financial ratios from a document."""
        meta = pdf_processor.get_document_meta(doc_id)
        if not meta:
            raise ValueError(f"Document {doc_id} not found")

        # Search for financial ratio contexts
        financial_queries = [
            "revenue net income earnings per share",
            "debt equity ratio return on equity ROE ROA",
            "gross margin operating margin profit",
            "current ratio quick ratio liquidity",
            "free cash flow capital expenditure",
            "P/E ratio price earnings valuation",
        ]

        all_chunks = []
        for q in financial_queries:
            results = vector_store.search(q, [doc_id], k=3)
            for doc, score in results:
                all_chunks.append(doc.page_content)

        # Deduplicate
        seen = set()
        unique_chunks = []
        for chunk in all_chunks:
            if chunk[:100] not in seen:
                seen.add(chunk[:100])
                unique_chunks.append(chunk)

        combined_text = "\n\n".join(unique_chunks[:12])
        prompt = build_extraction_prompt(combined_text, "ratios")

        try:
            raw_data = await llm_service.extract_json(prompt)
        except Exception as e:
            raw_data = {"error": str(e)}

        return FinancialRatios(
            company_name=meta["company_name"],
            year=meta.get("year"),
            revenue=raw_data.get("revenue"),
            net_income=raw_data.get("net_income"),
            eps=raw_data.get("eps"),
            pe_ratio=raw_data.get("pe_ratio"),
            debt_to_equity=raw_data.get("debt_to_equity"),
            roe=raw_data.get("roe"),
            roa=raw_data.get("roa"),
            gross_margin=raw_data.get("gross_margin"),
            operating_margin=raw_data.get("operating_margin"),
            current_ratio=raw_data.get("current_ratio"),
            quick_ratio=raw_data.get("quick_ratio"),
            free_cash_flow=raw_data.get("free_cash_flow"),
            raw_extracted=raw_data,
        )

    async def generate_earnings_summary(self, doc_id: str) -> EarningsSummary:
        """Generate a comprehensive earnings summary for a document."""
        meta = pdf_processor.get_document_meta(doc_id)
        if not meta:
            raise ValueError(f"Document {doc_id} not found")

        # Fetch broad context for summary
        summary_queries = [
            "financial performance revenue growth annual results",
            "CEO message letter to shareholders highlights",
            "risks challenges headwinds",
            "opportunities growth strategy outlook guidance",
            "management discussion analysis",
        ]

        all_chunks = []
        for q in summary_queries:
            results = vector_store.search(q, [doc_id], k=4)
            for doc, score in results:
                all_chunks.append(doc.page_content)

        seen = set()
        unique_chunks = []
        for chunk in all_chunks:
            if chunk[:100] not in seen:
                seen.add(chunk[:100])
                unique_chunks.append(chunk)

        combined_text = "\n\n".join(unique_chunks[:15])
        prompt = build_extraction_prompt(combined_text, "summary")

        try:
            data = await llm_service.extract_json(prompt)
        except Exception as e:
            data = {
                "headline": "Summary extraction failed",
                "key_highlights": [],
                "risks": [],
                "opportunities": [],
                "management_outlook": str(e),
                "full_summary": "",
            }

        return EarningsSummary(
            company_name=meta["company_name"],
            year=meta.get("year"),
            headline=data.get("headline", ""),
            key_highlights=data.get("key_highlights", []),
            risks=data.get("risks", []),
            opportunities=data.get("opportunities", []),
            management_outlook=data.get("management_outlook", ""),
            full_summary=data.get("full_summary", ""),
        )

    async def compare_companies(self, doc_ids: List[str], 
                                 metrics: Optional[List[str]] = None) -> ComparisonResult:
        """Compare multiple companies from their annual reports."""
        if len(doc_ids) < 2:
            raise ValueError("At least 2 documents required for comparison")

        # Extract ratios for each
        ratios_list = []
        company_names = []

        for doc_id in doc_ids:
            meta = pdf_processor.get_document_meta(doc_id)
            if not meta:
                continue
            
            company_names.append(meta["company_name"])
            try:
                ratios = await self.extract_financial_ratios(doc_id)
                ratios_list.append(ratios)
            except Exception:
                ratios_list.append(FinancialRatios(
                    company_name=meta["company_name"],
                    year=meta.get("year")
                ))

        # Build comparison table
        all_metrics = metrics or [
            "revenue", "net_income", "eps", "roe", "roa",
            "gross_margin", "operating_margin", "debt_to_equity",
            "free_cash_flow", "current_ratio"
        ]

        comparison_table = []
        for metric in all_metrics:
            row = {"metric": metric.replace("_", " ").title()}
            for r in ratios_list:
                val = getattr(r, metric, None)
                row[r.company_name] = val or "N/A"
            comparison_table.append(row)

        # Build text for LLM analysis
        companies_text = ""
        for r in ratios_list:
            companies_text += f"\n{r.company_name} ({r.year}):\n"
            for m in all_metrics:
                val = getattr(r, m, None)
                if val:
                    companies_text += f"  {m}: {val}\n"

        analysis = await llm_service.generate_comparison(companies_text)

        # Extract recommendation from analysis
        rec_lines = [l for l in analysis.split('\n') if 'recommend' in l.lower() or 'prefer' in l.lower()]
        recommendation = rec_lines[0] if rec_lines else "See full analysis for investment implications."

        return ComparisonResult(
            companies=company_names,
            comparison_table=comparison_table,
            analysis=analysis,
            recommendation=recommendation,
        )


analysis_service = AnalysisService()
