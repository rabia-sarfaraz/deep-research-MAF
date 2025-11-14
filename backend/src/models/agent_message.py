"""Agent Message model."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import Field

from . import AgentId, BaseEntity, UUID


class MessageType(str, Enum):
    """Type of agent message."""
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    ERROR = "error"


class AgentMessage(BaseEntity):
    """
    Represents a message exchanged between agents in the Group Chat workflow.
    
    Message Types:
    - request: Agent requests another agent to perform an action
    - response: Agent responds to a request
    - notification: Agent broadcasts a status update
    - error: Agent reports an error
    """
    
    query_id: UUID = Field(..., description="ID of the related query")
    sender: AgentId = Field(..., description="Sender agent ID")
    recipient: Optional[AgentId] = Field(None, description="Recipient agent ID (null for broadcast)")
    message_type: MessageType = Field(..., description="Message type")
    content: Dict[str, Any] = Field(..., description="Message content (structure varies by type)")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "id": "bb0e8400-e29b-41d4-a716-446655440006",
                    "query_id": "550e8400-e29b-41d4-a716-446655440000",
                    "sender": "planning",
                    "recipient": "research",
                    "message_type": "request",
                    "content": {
                        "action": "search",
                        "keywords": ["quantum computing", "2024"],
                        "sources": ["google", "arxiv"]
                    },
                    "timestamp": "2025-11-14T10:30:10Z",
                    "created_at": "2025-11-14T10:30:10Z"
                },
                {
                    "id": "cc0e8400-e29b-41d4-a716-446655440007",
                    "query_id": "550e8400-e29b-41d4-a716-446655440000",
                    "sender": "research",
                    "recipient": "reflect",
                    "message_type": "response",
                    "content": {
                        "results_count": 15,
                        "results": ["880e8400-...", "990e8400-..."]
                    },
                    "timestamp": "2025-11-14T10:30:25Z",
                    "created_at": "2025-11-14T10:30:25Z"
                },
                {
                    "id": "dd0e8400-e29b-41d4-a716-446655440008",
                    "query_id": "550e8400-e29b-41d4-a716-446655440000",
                    "sender": "reflect",
                    "recipient": None,
                    "message_type": "notification",
                    "content": {
                        "status": "quality_check_passed",
                        "quality_score": 0.85
                    },
                    "timestamp": "2025-11-14T10:30:40Z",
                    "created_at": "2025-11-14T10:30:40Z"
                }
            ]
        }
