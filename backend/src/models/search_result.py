"""Search Result model."""

from datetime import datetime
from typing import List, Optional

from pydantic import Field, HttpUrl, field_validator

from . import BaseEntity, SearchSource, UUID


class SearchResult(BaseEntity):
    """
    Represents an individual search result from Google or arXiv.
    
    Validation Rules:
    - url: Must be a valid URL
    - source: Must be 'google' or 'arxiv'
    - authors, published_date: Required for arXiv, optional for Google
    - relevance_score: 0.0 - 1.0, calculated by Reflect Agent
    """
    
    query_id: UUID = Field(..., description="ID of the related query")
    source: SearchSource = Field(..., description="Search source (google or arxiv)")
    title: str = Field(..., description="Result title")
    url: HttpUrl = Field(..., description="Result URL")
    snippet: str = Field(..., description="Summary or excerpt")
    authors: Optional[List[str]] = Field(None, description="Author list (arXiv only)")
    published_date: Optional[datetime] = Field(None, description="Publication date (arXiv only)")
    relevance_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Relevance score (0.0 - 1.0)")
    
    @field_validator("relevance_score")
    @classmethod
    def validate_relevance_score(cls, v: Optional[float]) -> Optional[float]:
        """Ensure relevance score is between 0.0 and 1.0 if provided."""
        if v is not None and not 0.0 <= v <= 1.0:
            raise ValueError("Relevance score must be between 0.0 and 1.0")
        return v
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "id": "880e8400-e29b-41d4-a716-446655440003",
                    "query_id": "550e8400-e29b-41d4-a716-446655440000",
                    "source": "google",
                    "title": "Quantum Computing Breakthrough 2024",
                    "url": "https://example.com/quantum-2024",
                    "snippet": "Recent advances in quantum computing have...",
                    "relevance_score": 0.92,
                    "created_at": "2025-11-14T10:30:15Z"
                },
                {
                    "id": "990e8400-e29b-41d4-a716-446655440004",
                    "query_id": "550e8400-e29b-41d4-a716-446655440000",
                    "source": "arxiv",
                    "title": "Advances in Quantum Error Correction",
                    "url": "https://arxiv.org/abs/2410.12345",
                    "snippet": "We present novel techniques for quantum error correction...",
                    "authors": ["Alice Smith", "Bob Johnson"],
                    "published_date": "2024-10-15T00:00:00Z",
                    "relevance_score": 0.88,
                    "created_at": "2025-11-14T10:30:20Z"
                }
            ]
        }
