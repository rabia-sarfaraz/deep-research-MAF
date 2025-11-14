"""Agent State model."""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import Field, field_validator

from . import AgentId, AgentStatus, BaseEntity, UUID


class AgentState(BaseEntity):
    """
    Tracks the current state, progress, and intermediate results of an agent.
    
    State Transitions:
    idle → thinking → working → completed
                         ↓
                      failed
    
    Agent-Specific Intermediate Results:
    - Planning Agent: search_strategy, keywords
    - Research Agent: sources_found, google_results, arxiv_results
    - Reflect Agent: quality_score, relevance_score, needs_more_search, feedback
    - Content Writing Agent: outline, sections_completed
    """
    
    agent_id: AgentId = Field(..., description="Agent identifier (planning, research, reflect, content)")
    query_id: UUID = Field(..., description="ID of the query being processed")
    status: AgentStatus = Field(default=AgentStatus.IDLE, description="Current agent status")
    progress: float = Field(default=0.0, ge=0.0, le=1.0, description="Progress percentage (0.0 - 1.0)")
    current_task: Optional[str] = Field(None, description="Description of current task being performed")
    intermediate_result: Optional[Dict[str, Any]] = Field(None, description="Agent-specific intermediate results")
    error: Optional[str] = Field(None, description="Error message if status is 'failed'")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    @field_validator("progress")
    @classmethod
    def validate_progress(cls, v: float) -> float:
        """Ensure progress is between 0.0 and 1.0."""
        if not 0.0 <= v <= 1.0:
            raise ValueError("Progress must be between 0.0 and 1.0")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "bb0e8400-e29b-41d4-a716-446655440006",
                "agent_id": "research",
                "query_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "working",
                "progress": 0.6,
                "current_task": "arXiv 논문 검색 중",
                "intermediate_result": {
                    "sources_found": 8,
                    "google_results": 5,
                    "arxiv_results": 3
                },
                "created_at": "2025-11-14T10:30:00Z",
                "updated_at": "2025-11-14T10:30:30Z"
            }
        }
