from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    openai_api_key: str = ""
    google_api_key: str = ""  

    llm_provider: str = "openai"
    openai_model: str = "gpt-4o-mini"
    gemini_model: str = "gemini-1.5-flash"

    embedding_model: str = "text-embedding-3-small"

    faiss_index_path: str = "./faiss_indices"

    upload_dir: str = "./uploads"

    chunk_size: int = 1000
    chunk_overlap: int = 200

    retrieval_k: int = 6

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
