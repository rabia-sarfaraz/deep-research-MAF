# Phase 1: Data Model - Deep Research Agent

**Date**: 2025-11-14  
**Feature**: Deep Research Agent with Multi-Agent Workflow

## Overview

이 문서는 Deep Research Agent의 핵심 데이터 모델과 엔티티를 정의합니다. 모든 엔티티는 Feature Spec의 Key Entities 섹션에서 도출되었으며, 시스템의 상태 관리와 데이터 흐름을 지원합니다.

---

## 1. Research Query (연구 질문)

### Description
사용자가 입력한 연구 질문과 관련 메타데이터를 나타냅니다.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | ✅ | 쿼리 고유 식별자 |
| `thread_id` | `string` (UUID) | ✅ | 소속된 대화 스레드 ID |
| `content` | `string` | ✅ | 사용자가 입력한 질문 텍스트 |
| `search_sources` | `array<string>` | ✅ | 검색 소스 선택 (["google", "arxiv"] 또는 ["google"] 또는 ["arxiv"]) |
| `created_at` | `datetime` | ✅ | 질문 생성 시각 |
| `status` | `enum` | ✅ | 처리 상태: `pending`, `processing`, `completed`, `failed` |

### Validation Rules
- `content`: 최소 1자, 최대 2000자
- `search_sources`: 최소 1개 이상 선택, 유효한 값: "google", "arxiv"
- `status`: 초기값 `pending`

### State Transitions
```
pending → processing → completed
              ↓
            failed
```

### Example
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "thread_id": "660e8400-e29b-41d4-a716-446655440001",
  "content": "quantum computing의 최신 발전 동향은?",
  "search_sources": ["google", "arxiv"],
  "created_at": "2025-11-14T10:30:00Z",
  "status": "processing"
}
```

---

## 2. Conversation Thread (대화 스레드)

### Description
연속된 질문과 답변으로 구성된 대화 세션. 각 스레드는 독립적으로 관리되며 멀티턴 대화의 컨텍스트를 유지합니다.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | ✅ | 스레드 고유 식별자 |
| `session_id` | `string` | ✅ | 브라우저 세션 ID (WebSocket 연결 식별) |
| `queries` | `array<ResearchQuery>` | ✅ | 스레드 내 모든 질문 리스트 (시간순) |
| `answers` | `array<SynthesizedAnswer>` | ✅ | 스레드 내 모든 답변 리스트 (시간순) |
| `created_at` | `datetime` | ✅ | 스레드 생성 시각 |
| `updated_at` | `datetime` | ✅ | 마지막 업데이트 시각 |
| `status` | `enum` | ✅ | 스레드 상태: `active`, `idle`, `closed` |

### Relationships
- 1 Thread : N Queries (1:N)
- 1 Thread : N Answers (1:N)
- 1 Query : 1 Answer (1:1)

### Validation Rules
- `session_id`: WebSocket 연결 시 생성
- `status`: 초기값 `active`, 10분 idle 시 `idle`, 사용자 명시적 종료 시 `closed`

### Example
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "session_id": "ws-session-abc123",
  "queries": ["550e8400-e29b-41d4-a716-446655440000"],
  "answers": ["770e8400-e29b-41d4-a716-446655440002"],
  "created_at": "2025-11-14T10:25:00Z",
  "updated_at": "2025-11-14T10:31:00Z",
  "status": "active"
}
```

---

## 3. Agent State (에이전트 상태)

### Description
개별 에이전트의 현재 작업 상태, 진행률, 중간 결과물을 추적합니다.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_id` | `string` | ✅ | 에이전트 식별자: `planning`, `research`, `reflect`, `content` |
| `query_id` | `string` (UUID) | ✅ | 처리 중인 질문 ID |
| `status` | `enum` | ✅ | 에이전트 상태: `idle`, `thinking`, `working`, `completed`, `failed` |
| `progress` | `float` | ✅ | 진행률 (0.0 ~ 1.0) |
| `current_task` | `string` | ❌ | 현재 수행 중인 작업 설명 |
| `intermediate_result` | `object` | ❌ | 중간 결과물 (에이전트별 구조 상이) |
| `error` | `string` | ❌ | 오류 발생 시 에러 메시지 |
| `updated_at` | `datetime` | ✅ | 마지막 업데이트 시각 |

### State Transitions
```
idle → thinking → working → completed
                     ↓
                   failed
```

### Agent-Specific Intermediate Results

#### Planning Agent
```json
{
  "search_strategy": "3단계 검색: 1) 개요 2) 최신 논문 3) 실제 응용",
  "keywords": ["quantum computing", "2024", "qubits", "applications"]
}
```

#### Research Agent
```json
{
  "sources_found": 15,
  "google_results": 10,
  "arxiv_results": 5
}
```

#### Reflect Agent
```json
{
  "quality_score": 0.85,
  "relevance_score": 0.92,
  "needs_more_search": false,
  "feedback": "충분한 최신 정보 확보됨"
}
```

#### Content Writing Agent
```json
{
  "outline": ["서론", "최신 발전", "주요 응용", "결론"],
  "sections_completed": 2
}
```

### Example
```json
{
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
  "updated_at": "2025-11-14T10:30:30Z"
}
```

---

## 4. Search Result (검색 결과)

### Description
Google 또는 arXiv에서 가져온 개별 검색 결과.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | ✅ | 검색 결과 고유 식별자 |
| `query_id` | `string` (UUID) | ✅ | 관련 질문 ID |
| `source` | `enum` | ✅ | 검색 소스: `google`, `arxiv` |
| `title` | `string` | ✅ | 결과 제목 |
| `url` | `string` (URL) | ✅ | 결과 링크 |
| `snippet` | `string` | ✅ | 요약 또는 발췌문 |
| `authors` | `array<string>` | ❌ | 저자 목록 (arXiv 전용) |
| `published_date` | `datetime` | ❌ | 발행일 (arXiv 전용) |
| `relevance_score` | `float` | ❌ | 관련성 점수 (0.0 ~ 1.0, Reflect Agent가 계산) |
| `created_at` | `datetime` | ✅ | 검색 결과 수집 시각 |

### Validation Rules
- `url`: 유효한 URL 형식
- `source`: "google" 또는 "arxiv"만 허용
- `authors`, `published_date`: arXiv 결과에만 필수

### Example (Google)
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "google",
  "title": "Quantum Computing Breakthrough 2024",
  "url": "https://example.com/quantum-2024",
  "snippet": "Recent advances in quantum computing have...",
  "relevance_score": 0.92,
  "created_at": "2025-11-14T10:30:15Z"
}
```

### Example (arXiv)
```json
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
```

---

## 5. Research Plan (연구 계획)

### Description
Planning Agent가 생성한 검색 전략 및 단계별 계획.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | ✅ | 연구 계획 고유 식별자 |
| `query_id` | `string` (UUID) | ✅ | 관련 질문 ID |
| `strategy` | `string` | ✅ | 전반적인 검색 전략 설명 |
| `keywords` | `array<string>` | ✅ | 추출된 키워드 목록 |
| `search_steps` | `array<SearchStep>` | ✅ | 단계별 검색 계획 |
| `estimated_time` | `integer` | ✅ | 예상 소요 시간 (초) |
| `created_at` | `datetime` | ✅ | 계획 생성 시각 |

### Nested Type: SearchStep

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step_number` | `integer` | ✅ | 단계 번호 (1부터 시작) |
| `description` | `string` | ✅ | 단계 설명 |
| `sources` | `array<string>` | ✅ | 사용할 검색 소스 |
| `keywords` | `array<string>` | ✅ | 이 단계의 키워드 |

### Example
```json
{
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
```

---

## 6. Synthesized Answer (종합 답변)

### Description
Content Writing Agent가 생성한 최종 답변으로, 구조화된 텍스트와 인용 정보를 포함합니다.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | ✅ | 답변 고유 식별자 |
| `query_id` | `string` (UUID) | ✅ | 관련 질문 ID |
| `thread_id` | `string` (UUID) | ✅ | 소속 스레드 ID |
| `content` | `string` | ✅ | 답변 본문 (Markdown 형식) |
| `sources` | `array<SourceCitation>` | ✅ | 인용된 출처 목록 |
| `sections` | `array<AnswerSection>` | ✅ | 답변 구조 (섹션별 구분) |
| `metadata` | `object` | ✅ | 답변 메타데이터 |
| `created_at` | `datetime` | ✅ | 답변 생성 시각 |

### Nested Type: SourceCitation

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | ✅ | 출처 ID (SearchResult ID 참조) |
| `title` | `string` | ✅ | 출처 제목 |
| `url` | `string` | ✅ | 출처 링크 |
| `citation_number` | `integer` | ✅ | 본문 내 인용 번호 [1], [2], ... |

### Nested Type: AnswerSection

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `heading` | `string` | ✅ | 섹션 제목 |
| `content` | `string` | ✅ | 섹션 내용 |
| `citations` | `array<integer>` | ✅ | 이 섹션에서 인용한 출처 번호들 |

### Nested Type: Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total_sources` | `integer` | ✅ | 총 출처 개수 |
| `google_sources` | `integer` | ✅ | Google 검색 출처 개수 |
| `arxiv_sources` | `integer` | ✅ | arXiv 논문 출처 개수 |
| `word_count` | `integer` | ✅ | 답변 단어 수 |

### Example
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "thread_id": "660e8400-e29b-41d4-a716-446655440001",
  "content": "# Quantum Computing의 최신 발전 동향\n\n## 개요\n...",
  "sources": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "title": "Quantum Computing Breakthrough 2024",
      "url": "https://example.com/quantum-2024",
      "citation_number": 1
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "title": "Advances in Quantum Error Correction",
      "url": "https://arxiv.org/abs/2410.12345",
      "citation_number": 2
    }
  ],
  "sections": [
    {
      "heading": "개요",
      "content": "Quantum computing은 2024년 들어 획기적인 발전을 이루었습니다[1].",
      "citations": [1]
    },
    {
      "heading": "최신 기술",
      "content": "양자 오류 정정 기술이 크게 향상되었습니다[2].",
      "citations": [2]
    }
  ],
  "metadata": {
    "total_sources": 2,
    "google_sources": 1,
    "arxiv_sources": 1,
    "word_count": 850
  },
  "created_at": "2025-11-14T10:31:00Z"
}
```

---

## 7. Agent Message (에이전트 메시지)

### Description
에이전트 간 통신 메시지로, Group Chat 워크플로우에서 에이전트들이 주고받는 메시지입니다.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | ✅ | 메시지 고유 식별자 |
| `query_id` | `string` (UUID) | ✅ | 관련 질문 ID |
| `sender` | `string` | ✅ | 발신 에이전트 ID |
| `recipient` | `string` | ❌ | 수신 에이전트 ID (null이면 브로드캐스트) |
| `message_type` | `enum` | ✅ | 메시지 타입: `request`, `response`, `notification`, `error` |
| `content` | `object` | ✅ | 메시지 내용 (구조는 message_type에 따라 다름) |
| `timestamp` | `datetime` | ✅ | 메시지 전송 시각 |

### Message Type Examples

#### `request` (Planning → Research)
```json
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
  "timestamp": "2025-11-14T10:30:10Z"
}
```

#### `response` (Research → Reflect)
```json
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
  "timestamp": "2025-11-14T10:30:25Z"
}
```

#### `notification` (Reflect → All)
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440008",
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender": "reflect",
  "recipient": null,
  "message_type": "notification",
  "content": {
    "status": "quality_check_passed",
    "quality_score": 0.85
  },
  "timestamp": "2025-11-14T10:30:40Z"
}
```

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│ ConversationThread  │
│ - id (PK)           │
│ - session_id        │
│ - status            │
└──────┬──────────────┘
       │ 1
       │
       │ N
       ├─────────────┬──────────────┐
       │             │              │
┌──────▼─────────┐  │         ┌────▼─────────────┐
│ ResearchQuery  │  │         │ SynthesizedAnswer│
│ - id (PK)      │  │         │ - id (PK)        │
│ - thread_id(FK)│  │         │ - thread_id (FK) │
│ - status       │  │         │ - query_id (FK)  │
└──────┬─────────┘  │         └────┬─────────────┘
       │ 1          │              │ 1
       │            │              │
       │ 1          │ 1            │ N
┌──────▼─────────┐  │         ┌────▼──────────┐
│ ResearchPlan   │  │         │ SourceCitation│
│ - id (PK)      │  │         │ - citation_#  │
│ - query_id(FK) │  │         └───────────────┘
└────────────────┘  │
                    │ 1
       ┌────────────┤
       │            │ N
┌──────▼─────────┐  │
│ AgentState     │  │
│ - agent_id(PK) │  │
│ - query_id(FK) │  │
│ - status       │  │
└────────────────┘  │
                    │ 1
       ┌────────────┤
       │            │ N
┌──────▼─────────┐  │
│ SearchResult   │  │
│ - id (PK)      │  │
│ - query_id(FK) │  │
│ - source       │  │
└────────────────┘  │
                    │ 1
                    │
                    │ N
            ┌───────▼────────┐
            │ AgentMessage   │
            │ - id (PK)      │
            │ - query_id(FK) │
            │ - sender       │
            └────────────────┘
```

---

## Implementation Notes

### Backend (Python/Pydantic)
```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum

class QueryStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ResearchQuery(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    thread_id: UUID
    content: str = Field(min_length=1, max_length=2000)
    search_sources: List[str] = Field(min_items=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: QueryStatus = QueryStatus.PENDING
```

### Frontend (TypeScript)
```typescript
export enum QueryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ResearchQuery {
  id: string;
  threadId: string;
  content: string;
  searchSources: string[];
  createdAt: string;
  status: QueryStatus;
}
```

---

## Summary

총 7개의 핵심 엔티티가 정의되었습니다:

1. ✅ **ResearchQuery**: 사용자 질문 및 메타데이터
2. ✅ **ConversationThread**: 대화 세션 관리
3. ✅ **AgentState**: 에이전트 작업 상태 추적
4. ✅ **SearchResult**: 검색 결과 저장
5. ✅ **ResearchPlan**: Planning Agent 출력
6. ✅ **SynthesizedAnswer**: 최종 답변 구조
7. ✅ **AgentMessage**: 에이전트 간 통신

모든 엔티티는:
- 명확한 필드 정의 및 타입
- 유효성 검증 규칙
- 상태 전이 다이어그램 (해당 시)
- 관계 정의 (FK 포함)
- 실제 예제 포함

다음 단계: API Contracts 정의
