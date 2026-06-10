from typing import List, Dict, Optional, Any
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.core.config import get_settings

settings = get_settings()


def get_llm(temperature: float = 0.1):
    """Return LLM instance based on configured provider."""
    if settings.llm_provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key,
            temperature=temperature,
        )
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.openai_model,
            openai_api_key=settings.openai_api_key,
            temperature=temperature,
        )


def build_rag_prompt(query: str, context_chunks: List[str], chat_history: List[Dict]) -> List:
    """Build the RAG prompt with context and history."""
    system_prompt = """You are an expert financial analyst assistant specializing in annual report analysis.

Your role is to:
1. Answer questions accurately based ONLY on the provided context from annual reports
2. Extract and explain financial metrics clearly
3. Provide insights grounded in the document evidence
4. Cite specific sections or figures when possible
5. If the answer is not in the context, clearly state that

Always be precise with numbers. Format financial figures clearly (e.g., "$2.3B", "23.5%").
If comparing companies, be objective and data-driven."""

    context_text = "\n\n---\n\n".join(
        [f"[Source {i+1}]\n{chunk}" for i, chunk in enumerate(context_chunks)]
    )

    messages = [SystemMessage(content=system_prompt)]

    # Add chat history
    for msg in chat_history[-6:]:  # Last 3 turns
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    # Current query with context
    user_message = f"""Context from Annual Reports:
{context_text}

Question: {query}

Please answer based on the context above. If you reference specific data, mention which source it comes from."""

    messages.append(HumanMessage(content=user_message))
    return messages


def build_extraction_prompt(text_sample: str, task: str) -> str:
    """Build prompts for financial extraction tasks."""
    prompts = {
        "ratios": f"""You are a financial data extractor. From the following text from an annual report, 
extract ALL financial ratios and metrics you can find. Return a valid JSON object with these fields 
(use null if not found):
{{
  "revenue": "value with unit",
  "net_income": "value with unit",
  "eps": "value",
  "pe_ratio": "value",
  "debt_to_equity": "value",
  "roe": "percentage",
  "roa": "percentage",
  "gross_margin": "percentage",
  "operating_margin": "percentage",
  "current_ratio": "value",
  "quick_ratio": "value",
  "free_cash_flow": "value with unit"
}}

Annual Report Text:
{text_sample[:8000]}

Return ONLY valid JSON, no explanation.""",

        "summary": f"""You are a financial analyst. Analyze the following annual report text and provide a 
comprehensive earnings summary. Return valid JSON:
{{
  "headline": "one sentence summary of financial performance",
  "key_highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4", "highlight 5"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "management_outlook": "paragraph about management's forward guidance",
  "full_summary": "2-3 paragraph comprehensive summary"
}}

Annual Report Text:
{text_sample[:10000]}

Return ONLY valid JSON.""",

        "comparison": f"""Compare the following financial data from multiple companies. 
Provide an objective analysis highlighting strengths, weaknesses, and investment implications.
Text: {text_sample[:6000]}"""
    }
    return prompts.get(task, "")


class LLMService:
    def __init__(self):
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            self._llm = get_llm()
        return self._llm

    async def answer_query(self, query: str, context_chunks: List[str], 
                           chat_history: List[Dict]) -> str:
        messages = build_rag_prompt(query, context_chunks, chat_history)
        response = await self.llm.ainvoke(messages)
        return response.content

    async def extract_json(self, prompt: str) -> Dict:
        import json, re
        llm = get_llm(temperature=0.0)
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        text = response.content.strip()
        
        # Strip markdown code blocks if present
        text = re.sub(r'^```(?:json)?\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
        
        return json.loads(text)

    async def generate_comparison(self, companies_data: str) -> str:
        llm = get_llm(temperature=0.2)
        prompt = f"""As a senior financial analyst, compare these companies based on their annual reports:

{companies_data}

Provide:
1. Key performance differences
2. Relative strengths and weaknesses
3. Risk profiles
4. Investment merit for each

Be concise, data-driven, and objective."""
        
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return response.content


llm_service = LLMService()
