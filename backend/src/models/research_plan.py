"""Research Plan model."""

from typing import List

from pydantic import BaseModel, Field

from . import BaseEntity, SearchSource, UUID


class SearchStep(BaseModel):
    """Represents a single step in the research plan."""
    
    step_number: int = Field(..., ge=1, description="Step number (starts from 1)")
    description: str = Field(..., description="Step description")
    sources: List[SearchSource] = Field(..., min_length=1, description="Search sources to use")
    keywords: List[str] = Field(..., min_length=1, description="Keywords for this step")
    
    class Config:
        json_schema_extra = {
            "example": {
                "step_number": 1,
                "description": "Quantum computing 최신 개요 검색",
                "sources": ["google"],
                "keywords": ["quantum computing", "overview", "2024"]
            }
        }


class ResearchPlan(BaseEntity):
    """
    Represents the search strategy and step-by-step plan created by Planning Agent.
    
    Validation Rules:
    - keywords: At least one keyword
    - search_steps: At least one step
    - estimated_time: Time in seconds
    """
    
    query_id: UUID = Field(..., description="ID of the related query")
    strategy: str = Field(..., description="Overall search strategy description")
    keywords: List[str] = Field(..., min_length=1, description="Extracted keyword list")
    search_steps: List[SearchStep] = Field(..., min_length=1, description="Step-by-step search plan")
    estimated_time: int = Field(..., gt=0, description="Estimated time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "aa0e8400-e29b-41d4-a716-446655440005",
                "query_id": "550e8400-e29b-41d4-a716-446655440000",
                "strategy": "먼저 quantum computing의 최신 개요를 검색하고, 2024년 논문을 중점적으로 찾은 후, 실제 응용 사례를 조사합니다.",
                "keywords": ["quantum computing", "2024", "qubits", "quantum algorithms", "applications"],
                "search_steps": [
                    {
                        "step_number": 1,
                        "description": "Quantum computing 최신 개요 검색",
                        "sources": ["google"],
                        "keywords": ["quantum computing", "overview", "2024"]
                    },
                    {
                        "step_number": 2,
                        "description": "최신 학술 논문 검색",
                        "sources": ["arxiv"],
                        "keywords": ["quantum computing", "2024", "qubits"]
                    },
                    {
                        "step_number": 3,
                        "description": "실제 응용 사례 검색",
                        "sources": ["google"],
                        "keywords": ["quantum computing", "applications", "industry"]
                    }
                ],
                "estimated_time": 45,
                "created_at": "2025-11-14T10:30:05Z"
            }
        }
