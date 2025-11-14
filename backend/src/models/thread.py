"""Conversation Thread model."""

from datetime import datetime
from typing import List

from pydantic import Field

from . import BaseEntity, ThreadStatus, UUID


class ConversationThread(BaseEntity):
    """
    Represents a conversation session with multiple queries and answers.
    
    Relationships:
    - 1 Thread : N Queries (1:N)
    - 1 Thread : N Answers (1:N)
    - 1 Query : 1 Answer (1:1)
    
    Validation Rules:
    - session_id: Created on WebSocket connection
    - status: Defaults to 'active', transitions to 'idle' after 10 min, 'closed' on explicit termination
    """
    
    session_id: str = Field(..., description="WebSocket session identifier")
    queries: List[UUID] = Field(default_factory=list, description="List of query IDs in chronological order")
    answers: List[UUID] = Field(default_factory=list, description="List of answer IDs in chronological order")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    status: ThreadStatus = Field(default=ThreadStatus.ACTIVE, description="Thread status")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "660e8400-e29b-41d4-a716-446655440001",
                "session_id": "ws-session-abc123",
                "queries": ["550e8400-e29b-41d4-a716-446655440000"],
                "answers": ["770e8400-e29b-41d4-a716-446655440002"],
                "created_at": "2025-11-14T10:25:00Z",
                "updated_at": "2025-11-14T10:31:00Z",
                "status": "active"
            }
        }
