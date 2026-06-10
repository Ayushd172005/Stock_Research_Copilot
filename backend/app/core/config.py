from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # API Keys
    openai_api_key: str = ""
    google_api_key: str = ""  # Gemini

    # Model selection: "openai" or "gemini"
    llm_provider: str = "openai"
    openai_model: str = "gpt-4o-mini"
    gemini_model: str = "gemini-1.5-flash"

    # Embedding model
    embedding_model: str = "text-embedding-3-small"

    # FAISS index storage
    faiss_index_path: str = "./faiss_indices"

    # Upload directory
    upload_dir: str = "./uploads"

    # Chunking params
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval
    retrieval_k: int = 6

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
