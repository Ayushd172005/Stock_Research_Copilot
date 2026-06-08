# Stock Research Copilot

> AI-powered annual report analysis using RAG, FAISS, and LangChain

---

## Architecture

```
stock-research-copilot/
├── backend/                  # FastAPI + RAG pipeline
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── api/
│   │   │   ├── documents.py  # Upload, list, delete PDFs
│   │   │   ├── chat.py       # RAG Q&A endpoint
│   │   │   └── analysis.py   # Ratios, summary, compare
│   │   ├── services/
│   │   │   ├── pdf_service.py     # PDF text + table extraction
│   │   │   ├── vector_store.py    # FAISS indexing + search
│   │   │   ├── llm_service.py     # OpenAI / Gemini wrapper
│   │   │   └── analysis_service.py # Financial extraction logic
│   │   ├── models/
│   │   │   └── schemas.py    # Pydantic request/response models
│   │   └── core/
│   │       └── config.py     # Environment settings
│   └── requirements.txt
└── frontend/                 # React + Vite + Tailwind
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx       # Document library
    │   │   ├── ChatPanel.jsx     # RAG chat interface
    │   │   ├── RatiosPanel.jsx   # Financial ratio extractor
    │   │   ├── SummaryPanel.jsx  # AI earnings summary
    │   │   ├── ComparePanel.jsx  # Multi-company comparison
    │   │   └── UploadModal.jsx   # PDF upload with drag-drop
    │   ├── hooks/
    │   │   └── useAppContext.jsx  # Global state (React Context)
    │   └── utils/
    │       └── api.js            # Axios API client
    └── package.json
```

---

## RAG Pipeline Flow

```
PDF Upload
   ↓
pdfplumber → extract text + tables (page-aware)
   ↓
RecursiveCharacterTextSplitter (1000 tokens, 200 overlap)
   ↓
OpenAI text-embedding-3-small → embeddings
   ↓
FAISS index (persisted to disk, per document)
   ↓
User Query
   ↓
FAISS similarity search (top-k chunks)
   ↓
GPT-4o-mini / Gemini 1.5 Flash → grounded answer
   ↓
Source attribution (chunk text + page + relevance score)
```

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env → set OPENAI_API_KEY or GOOGLE_API_KEY

# Run server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | `openai` or `gemini` | `openai` |
| `OPENAI_API_KEY` | OpenAI key | — |
| `OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` |
| `GOOGLE_API_KEY` | Gemini key | — |
| `GEMINI_MODEL` | Gemini model | `gemini-1.5-flash` |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `CHUNK_SIZE` | Token chunk size | `1000` |
| `CHUNK_OVERLAP` | Overlap tokens | `200` |
| `RETRIEVAL_K` | Top-k chunks | `6` |

---

## Features

### 1. PDF Upload & Indexing
- Drag-and-drop PDF upload
- Automatic text + table extraction (pdfplumber)
- Page-aware chunking with metadata
- FAISS vector index persisted per document
- Auto-infers company name and year from filename

### 2. RAG Chat
- Select one or more documents
- Ask natural language questions
- Sources shown with page numbers and relevance scores
- Full chat history maintained per session
- Streaming support (SSE endpoint)

### 3. Financial Ratio Extraction
- Extracts: Revenue, Net Income, EPS, P/E, D/E, ROE, ROA, Margins, FCF
- Uses targeted semantic search + GPT extraction
- Visual bar chart for margin/returns
- Grouped by Income Statement / Balance Sheet / Returns / Valuation

### 4. Earnings Summary
- AI-generated headline
- Key highlights (5 bullet points)
- Risk factors
- Growth opportunities
- Management outlook / guidance

### 5. Company Comparison
- Select 2–5 reports
- Side-by-side metrics table
- AI-written comparative analysis
- Investment implication summary

---

## Cost Estimates (OpenAI)

| Operation | Approximate Cost |
|-----------|-----------------|
| Upload 100-page PDF | ~$0.01–0.05 (embeddings) |
| Chat query | ~$0.001–0.005 (gpt-4o-mini) |
| Ratio extraction | ~$0.005–0.02 |
| Summary generation | ~$0.01–0.05 |
| Company comparison | ~$0.02–0.10 |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend API | FastAPI + uvicorn |
| RAG Framework | LangChain |
| Vector Store | FAISS (CPU) |
| PDF Processing | pdfplumber |
| LLM | OpenAI GPT-4o-mini / Gemini 1.5 Flash |
| Embeddings | OpenAI text-embedding-3-small |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | React Context |
