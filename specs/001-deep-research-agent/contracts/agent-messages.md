# Agent Message Protocol - Deep Research Agent

**Version**: 1.0.0  
**Date**: 2025-11-14

## Overview

이 문서는 Microsoft Agent Framework Group Chat 워크플로우 내에서 에이전트 간 통신에 사용되는 메시지 스키마를 정의합니다.

---

## Base Message Schema

모든 에이전트 메시지는 다음 기본 구조를 따릅니다:

```yaml
AgentMessage:
  id: string (UUID)
  query_id: string (UUID)
  sender: enum [planning, research, reflect, content]
  recipient: enum [planning, research, reflect, content] | null  # null = broadcast
  message_type: enum [request, response, notification, error]
  content: object  # 메시지 타입별로 상이
  timestamp: datetime (ISO 8601)
```

---

## Message Flow Diagram

```
User Query
    ↓
┌─────────────────┐
│ Planning Agent  │ ──(1)── [PlanningRequest] ─────────┐
└─────────────────┘                                      │
    ↑                                                    ↓
    │                                         ┌─────────────────┐
    │                                         │ Research Agent  │
    │                                         └─────────────────┘
    │                                                    │
    │                                                    │ (2) [SearchResults]
    │                                                    ↓
    │                                         ┌─────────────────┐
    │                                         │ Reflect Agent   │
    │ (5) [FinalApproval]                     └─────────────────┘
    │         ↑                                          │
    │         │                                          │
    │         │                                          ↓
    │         │                               (3) [QualityFeedback]
    │         │                                          │
┌─────────────────┐                                      │
│ Content Agent   │ ←──(4)── [ContentRequest] ──────────┘
└─────────────────┘
    │
    │ (6) [FinalAnswer]
    ↓
 User
```

---

## Message Type Definitions

### 1. Planning Phase Messages

#### 1.1 Planning Request (Planning → Research)

**Purpose**: Planning Agent가 Research Agent에게 검색 실행을 요청합니다.

```yaml
message_type: request
sender: planning
recipient: research
content:
  action: "search"
  strategy: string  # 전체 검색 전략 설명
  search_steps:
    - step_number: integer
      description: string
      sources: array<"google" | "arxiv">
      keywords: array<string>
  estimated_time: integer  # 예상 소요 시간 (초)
```

**Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "planning",
  "recipient": "research",
  "message_type": "request",
  "content": {
    "action": "search",
    "strategy": "3단계 검색: 개요 → 최신 논문 → 응용 사례",
    "search_steps": [
      {
        "step_number": 1,
        "description": "Quantum computing 개요 검색",
        "sources": ["google"],
        "keywords": ["quantum computing", "overview", "2024"]
      },
      {
        "step_number": 2,
        "description": "최신 학술 논문",
        "sources": ["arxiv"],
        "keywords": ["quantum computing", "2024", "qubits"]
      }
    ],
    "estimated_time": 45
  },
  "timestamp": "2025-11-14T10:30:05Z"
}
```

---

### 2. Research Phase Messages

#### 2.1 Search Progress (Research → All)

**Purpose**: Research Agent가 검색 진행 상황을 브로드캐스트합니다.

```yaml
message_type: notification
sender: research
recipient: null  # broadcast
content:
  event: "search_progress"
  step_number: integer
  step_description: string
  progress: float  # 0.0 ~ 1.0
  sources_found: integer
```

**Example**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "research",
  "recipient": null,
  "message_type": "notification",
  "content": {
    "event": "search_progress",
    "step_number": 1,
    "step_description": "Quantum computing 개요 검색 중",
    "progress": 0.33,
    "sources_found": 5
  },
  "timestamp": "2025-11-14T10:30:15Z"
}
```

#### 2.2 Search Results (Research → Reflect)

**Purpose**: Research Agent가 수집한 검색 결과를 Reflect Agent에게 전달합니다.

```yaml
message_type: response
sender: research
recipient: reflect
content:
  action: "search_completed"
  total_results: integer
  google_results: integer
  arxiv_results: integer
  result_ids: array<string (UUID)>  # SearchResult IDs
  execution_time: integer  # 실제 소요 시간 (초)
```

**Example**:
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "research",
  "recipient": "reflect",
  "message_type": "response",
  "content": {
    "action": "search_completed",
    "total_results": 15,
    "google_results": 10,
    "arxiv_results": 5,
    "result_ids": [
      "990e8400-e29b-41d4-a716-446655440004",
      "aa0e8400-e29b-41d4-a716-446655440005"
    ],
    "execution_time": 38
  },
  "timestamp": "2025-11-14T10:30:43Z"
}
```

---

### 3. Reflection Phase Messages

#### 3.1 Quality Assessment (Reflect → All)

**Purpose**: Reflect Agent가 검색 결과의 품질을 평가하고 피드백을 브로드캐스트합니다.

```yaml
message_type: notification
sender: reflect
recipient: null  # broadcast
content:
  event: "quality_assessment"
  quality_score: float  # 0.0 ~ 1.0
  relevance_score: float  # 0.0 ~ 1.0
  coverage_score: float  # 0.0 ~ 1.0
  needs_more_search: boolean
  feedback: string
  recommendations: array<string>
```

**Example**:
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440006",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "reflect",
  "recipient": null,
  "message_type": "notification",
  "content": {
    "event": "quality_assessment",
    "quality_score": 0.85,
    "relevance_score": 0.92,
    "coverage_score": 0.78,
    "needs_more_search": false,
    "feedback": "검색 결과가 충분히 포괄적이며 최신 정보를 포함하고 있습니다.",
    "recommendations": [
      "Google 검색 결과 중 상위 5개가 매우 관련성이 높음",
      "arXiv 논문 2건이 2024년 발행으로 최신 동향 반영"
    ]
  },
  "timestamp": "2025-11-14T10:30:50Z"
}
```

#### 3.2 Additional Search Request (Reflect → Research)

**Purpose**: Reflect Agent가 추가 검색이 필요하다고 판단한 경우 Research Agent에게 요청합니다.

```yaml
message_type: request
sender: reflect
recipient: research
content:
  action: "additional_search"
  reason: string
  keywords: array<string>
  sources: array<"google" | "arxiv">
  max_results: integer
```

**Example**:
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440007",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "reflect",
  "recipient": "research",
  "message_type": "request",
  "content": {
    "action": "additional_search",
    "reason": "실제 응용 사례가 부족함",
    "keywords": ["quantum computing", "applications", "industry", "2024"],
    "sources": ["google"],
    "max_results": 5
  },
  "timestamp": "2025-11-14T10:31:00Z"
}
```

#### 3.3 Content Request (Reflect → Content)

**Purpose**: Reflect Agent가 품질 검증을 완료하고 Content Agent에게 답변 작성을 요청합니다.

```yaml
message_type: request
sender: reflect
recipient: content
content:
  action: "generate_answer"
  approved_result_ids: array<string (UUID)>
  quality_scores:
    - result_id: string (UUID)
      score: float  # 0.0 ~ 1.0
  suggested_structure: array<string>  # 제안 섹션 구조
```

**Example**:
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440008",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "reflect",
  "recipient": "content",
  "message_type": "request",
  "content": {
    "action": "generate_answer",
    "approved_result_ids": [
      "990e8400-e29b-41d4-a716-446655440004",
      "aa0e8400-e29b-41d4-a716-446655440005"
    ],
    "quality_scores": [
      { "result_id": "990e8400-e29b-41d4-a716-446655440004", "score": 0.95 },
      { "result_id": "aa0e8400-e29b-41d4-a716-446655440005", "score": 0.88 }
    ],
    "suggested_structure": ["개요", "최신 발전", "주요 응용", "향후 전망", "결론"]
  },
  "timestamp": "2025-11-14T10:31:05Z"
}
```

---

### 4. Content Writing Phase Messages

#### 4.1 Writing Progress (Content → All)

**Purpose**: Content Agent가 답변 작성 진행 상황을 브로드캐스트합니다.

```yaml
message_type: notification
sender: content
recipient: null  # broadcast
content:
  event: "writing_progress"
  current_section: string
  sections_completed: integer
  total_sections: integer
  progress: float  # 0.0 ~ 1.0
```

**Example**:
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440009",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "content",
  "recipient": null,
  "message_type": "notification",
  "content": {
    "event": "writing_progress",
    "current_section": "최신 발전",
    "sections_completed": 2,
    "total_sections": 5,
    "progress": 0.4
  },
  "timestamp": "2025-11-14T10:31:20Z"
}
```

#### 4.2 Answer Draft (Content → Reflect)

**Purpose**: Content Agent가 작성한 답변 초안을 Reflect Agent에게 검토 요청합니다.

```yaml
message_type: request
sender: content
recipient: reflect
content:
  action: "review_draft"
  answer_id: string (UUID)
  sections:
    - heading: string
      content: string
      citations: array<integer>
  word_count: integer
```

**Example**:
```json
{
  "id": "ff0e8400-e29b-41d4-a716-44665544000a",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "content",
  "recipient": "reflect",
  "message_type": "request",
  "content": {
    "action": "review_draft",
    "answer_id": "110e8400-e29b-41d4-a716-44665544000b",
    "sections": [
      {
        "heading": "개요",
        "content": "Quantum computing은 2024년...",
        "citations": [1, 2]
      }
    ],
    "word_count": 850
  },
  "timestamp": "2025-11-14T10:31:45Z"
}
```

#### 4.3 Final Answer (Content → All)

**Purpose**: Content Agent가 최종 답변 완성을 알립니다.

```yaml
message_type: notification
sender: content
recipient: null  # broadcast
content:
  event: "answer_completed"
  answer_id: string (UUID)
  total_sources: integer
  word_count: integer
```

**Example**:
```json
{
  "id": "220e8400-e29b-41d4-a716-44665544000c",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "content",
  "recipient": null,
  "message_type": "notification",
  "content": {
    "event": "answer_completed",
    "answer_id": "110e8400-e29b-41d4-a716-44665544000b",
    "total_sources": 15,
    "word_count": 1200
  },
  "timestamp": "2025-11-14T10:32:00Z"
}
```

---

### 5. Error Messages

#### 5.1 Agent Error (Any → All)

**Purpose**: 에이전트가 오류를 발생시킨 경우 모든 에이전트에게 알립니다.

```yaml
message_type: error
sender: <any_agent>
recipient: null  # broadcast
content:
  error_type: enum [timeout, api_error, validation_error, internal_error]
  error_message: string
  details: object | null
  recoverable: boolean
  suggested_action: string | null
```

**Example**:
```json
{
  "id": "330e8400-e29b-41d4-a716-44665544000d",
  "query_id": "660e8400-e29b-41d4-a716-446655440000",
  "sender": "research",
  "recipient": null,
  "message_type": "error",
  "content": {
    "error_type": "api_error",
    "error_message": "Google Search API rate limit exceeded",
    "details": {
      "api": "google_custom_search",
      "status_code": 429,
      "retry_after": 60
    },
    "recoverable": true,
    "suggested_action": "60초 후 재시도"
  },
  "timestamp": "2025-11-14T10:30:25Z"
}
```

---

## Implementation Guidelines

### Backend (Python with Microsoft Agent Framework)

```python
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum

class MessageType(str, Enum):
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    ERROR = "error"

class AgentId(str, Enum):
    PLANNING = "planning"
    RESEARCH = "research"
    REFLECT = "reflect"
    CONTENT = "content"

@dataclass
class AgentMessage:
    id: UUID
    query_id: UUID
    sender: AgentId
    recipient: Optional[AgentId]
    message_type: MessageType
    content: Dict[str, Any]
    timestamp: datetime
    
    @classmethod
    def create(cls, query_id: UUID, sender: AgentId, 
               message_type: MessageType, content: Dict[str, Any],
               recipient: Optional[AgentId] = None):
        return cls(
            id=uuid4(),
            query_id=query_id,
            sender=sender,
            recipient=recipient,
            message_type=message_type,
            content=content,
            timestamp=datetime.utcnow()
        )

# Usage example
planning_request = AgentMessage.create(
    query_id=query.id,
    sender=AgentId.PLANNING,
    recipient=AgentId.RESEARCH,
    message_type=MessageType.REQUEST,
    content={
        "action": "search",
        "strategy": "3단계 검색...",
        "search_steps": [...]
    }
)
```

### Frontend (TypeScript)

```typescript
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  ERROR = 'error',
}

export enum AgentId {
  PLANNING = 'planning',
  RESEARCH = 'research',
  REFLECT = 'reflect',
  CONTENT = 'content',
}

export interface AgentMessage {
  id: string;
  queryId: string;
  sender: AgentId;
  recipient: AgentId | null;
  messageType: MessageType;
  content: Record<string, any>;
  timestamp: string;
}

// WebSocket message handler
ws.onmessage = (event) => {
  const wsEvent = JSON.parse(event.data);
  
  if (wsEvent.type === 'agent_message') {
    const message: AgentMessage = wsEvent.data;
    handleAgentMessage(message);
  }
};

function handleAgentMessage(message: AgentMessage) {
  switch (message.sender) {
    case AgentId.PLANNING:
      // Handle planning agent messages
      break;
    case AgentId.RESEARCH:
      // Handle research agent messages
      break;
    // ...
  }
}
```

---

## Message Validation Rules

1. **Required Fields**: 모든 메시지는 `id`, `query_id`, `sender`, `message_type`, `content`, `timestamp` 필수
2. **UUID Format**: `id`, `query_id`는 유효한 UUID v4 형식
3. **Timestamp Format**: ISO 8601 형식 (UTC)
4. **Sender/Recipient**: `planning`, `research`, `reflect`, `content` 중 하나
5. **Content Structure**: 각 메시지 타입별로 정의된 구조 준수
6. **Broadcast**: `recipient`가 `null`이면 모든 에이전트에게 브로드캐스트

---

## Sequence Diagrams

### Normal Flow
```
User → Planning: submit query
Planning → Research: PlanningRequest
Research → Research: execute searches
Research → All: SearchProgress (multiple)
Research → Reflect: SearchResults
Reflect → Reflect: evaluate quality
Reflect → All: QualityAssessment
Reflect → Content: ContentRequest
Content → All: WritingProgress (multiple)
Content → Reflect: AnswerDraft (optional)
Reflect → Content: approval (optional)
Content → All: FinalAnswer
System → User: answer ready
```

### Error Flow with Recovery
```
Research → All: SearchProgress
Research → All: Error (API timeout)
Research → Research: retry logic
Research → All: SearchProgress (resumed)
Research → Reflect: SearchResults
```

---

## Summary

총 11개의 메시지 타입이 정의되었습니다:

**Planning Phase**:
1. ✅ PlanningRequest (Planning → Research)

**Research Phase**:
2. ✅ SearchProgress (Research → All)
3. ✅ SearchResults (Research → Reflect)

**Reflection Phase**:
4. ✅ QualityAssessment (Reflect → All)
5. ✅ AdditionalSearchRequest (Reflect → Research)
6. ✅ ContentRequest (Reflect → Content)

**Content Phase**:
7. ✅ WritingProgress (Content → All)
8. ✅ AnswerDraft (Content → Reflect)
9. ✅ FinalAnswer (Content → All)

**Error Handling**:
10. ✅ AgentError (Any → All)

모든 메시지는:
- 명확한 구조와 타입 정의
- 실제 사용 예제 포함
- 유효성 검증 규칙 명시
- Python/TypeScript 구현 가이드 제공

다음 단계: Quickstart Guide 작성
