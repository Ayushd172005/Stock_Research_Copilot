import os
import pickle
from typing import List, Dict, Tuple, Optional
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.core.config import get_settings

settings = get_settings()


class VectorStoreService:
    def __init__(self):
        os.makedirs(settings.faiss_index_path, exist_ok=True)
        self._stores: Dict[str, FAISS] = {}
        self._embeddings = self._init_embeddings()

    def _init_embeddings(self):
        if settings.llm_provider == "openai" or settings.openai_api_key:
            return OpenAIEmbeddings(
                model=settings.embedding_model,
                openai_api_key=settings.openai_api_key or "sk-placeholder"
            )
        # Fallback to a local embedding (sentence-transformers)
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    def _index_path(self, doc_id: str) -> str:
        return os.path.join(settings.faiss_index_path, doc_id)

    def index_documents(self, doc_id: str, documents: List[Document]) -> int:
        """Create FAISS index for a document."""
        store = FAISS.from_documents(documents, self._embeddings)
        
        # Persist to disk
        store.save_local(self._index_path(doc_id))
        self._stores[doc_id] = store
        
        return len(documents)

    def load_index(self, doc_id: str) -> Optional[FAISS]:
        """Load FAISS index from disk if not already in memory."""
        if doc_id in self._stores:
            return self._stores[doc_id]
        
        idx_path = self._index_path(doc_id)
        if os.path.exists(idx_path):
            store = FAISS.load_local(
                idx_path,
                self._embeddings,
                allow_dangerous_deserialization=True
            )
            self._stores[doc_id] = store
            return store
        
        return None

    def search(self, query: str, doc_ids: List[str], k: int = None) -> List[Tuple[Document, float]]:
        """Search across multiple FAISS indices and return ranked results."""
        if k is None:
            k = settings.retrieval_k

        all_results = []
        for doc_id in doc_ids:
            store = self.load_index(doc_id)
            if store is None:
                continue
            
            results = store.similarity_search_with_score(query, k=k)
            all_results.extend(results)

        # Sort by score (lower = better for L2; higher = better for cosine)
        all_results.sort(key=lambda x: x[1])
        return all_results[:k]

    def delete_index(self, doc_id: str):
        """Remove index from memory and disk."""
        self._stores.pop(doc_id, None)
        import shutil
        idx_path = self._index_path(doc_id)
        if os.path.exists(idx_path):
            shutil.rmtree(idx_path)

    def merge_indices(self, doc_ids: List[str]) -> Optional[FAISS]:
        """Merge multiple FAISS indices into one for combined search."""
        stores = []
        for doc_id in doc_ids:
            store = self.load_index(doc_id)
            if store:
                stores.append(store)
        
        if not stores:
            return None
        
        base = stores[0]
        for other in stores[1:]:
            base.merge_from(other)
        
        return base


vector_store = VectorStoreService()
