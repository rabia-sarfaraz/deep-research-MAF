# Phase 0: Research - Deep Research Agent

**Date**: 2025-11-14  
**Feature**: Deep Research Agent with Multi-Agent Workflow

## Research Tasks

이 문서는 Technical Context에서 식별된 NEEDS CLARIFICATION 항목들을 해결하고, 기술 선택에 대한 근거를 제공합니다.

---

## 1. Frontend 상태 관리 라이브러리 선택

### Decision: Zustand

### Rationale:
1. **경량성**: Redux보다 훨씬 작은 번들 크기 (3kb vs 15kb+)
2. **단순성**: Boilerplate 코드가 적고 React hooks와 자연스럽게 통합
3. **실시간 업데이트 적합성**: 에이전트 상태가 자주 변경되는 환경에 최적
4. **학습 곡선**: 짧은 개발 기간에 적합한 간단한 API
5. **TypeScript 지원**: 완벽한 타입 안정성

### Alternatives Considered:
- **Redux Toolkit**: 강력하지만 이 프로젝트 규모에는 과도한 복잡도
- **Jotai**: 좋은 선택이지만 커뮤니티가 Zustand보다 작음
- **Context API**: 성능 문제 가능성 (빈번한 상태 업데이트)

### Implementation Notes:
```typescript
// 예상 스토어 구조
const useConversationStore = create((set) => ({
  threads: [],
  currentThread: null,
  addMessage: (message) => set((state) => ...),
}))

const useAgentStore = create((set) => ({
  agents: { planning: {}, research: {}, reflect: {}, content: {} },
  updateAgentState: (agentId, state) => set(...),
}))
```

---

## 2. Backend-Frontend 통신 프로토콜 선택

### Decision: WebSocket (Socket.IO or native WebSocket)

### Rationale:
1. **실시간 양방향 통신**: 에이전트 상태 업데이트를 즉시 프론트엔드에 푸시
2. **낮은 지연**: SC-003 요구사항 (UI 업데이트 < 1초) 충족
3. **효율성**: Long polling이나 SSE보다 오버헤드가 적음
4. **멀티턴 대화 지원**: 지속적인 연결로 대화 컨텍스트 유지 용이

### Alternatives Considered:
- **Server-Sent Events (SSE)**: 단방향 통신만 가능, 클라이언트→서버는 별도 HTTP 필요
- **REST with Polling**: 비효율적이고 지연 발생 (1초 요구사항 충족 어려움)
- **GraphQL Subscriptions**: 과도한 복잡도, 프로젝트 규모에 부적합

### Implementation Notes:
```python
# Backend (FastAPI + WebSocket)
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/{thread_id}")
async def websocket_endpoint(websocket: WebSocket, thread_id: str):
    await websocket.accept()
    # 에이전트 상태 변경 시 실시간 푸시
    await websocket.send_json({
        "type": "agent_update",
        "agent": "planning",
        "state": "thinking"
    })
```

```typescript
// Frontend (React)
const ws = new WebSocket('ws://localhost:8000/ws/thread-123')
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  updateAgentState(data.agent, data.state)
}
```

---

## 3. Microsoft Agent Framework Best Practices

### Research from Official Documentation

#### Custom Agent 구현 패턴
**Source**: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/agents/agent-types/custom-agent

**Key Patterns**:
1. **Agent Interface 구현**:
   ```python
   from agent_framework import Agent, AgentContext
   
   class PlanningAgent(Agent):
       async def run(self, context: AgentContext):
           # 에이전트 로직
           pass
   ```

2. **State Management**: 각 에이전트는 context를 통해 공유 상태에 접근
3. **Error Handling**: 명시적 예외 처리 및 fallback 전략 구현

#### Group Chat 워크플로우 패턴
**Source**: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/workflows/orchestrations/group-chat

**Key Patterns**:
1. **선택적 메시지 라우팅**: 특정 에이전트만 응답하도록 필터링
2. **종료 조건**: 답변 완성 시 워크플로우 종료 로직
3. **에이전트 순서**: Planning → Research → Reflect → Content 순서 보장

#### Multi-turn Conversation 패턴
**Source**: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/agents/multi-turn-conversation

**Key Patterns**:
1. **Thread ID 기반 세션 관리**:
   ```python
   thread = await agent_runtime.create_thread()
   # thread.id로 대화 세션 식별
   ```

2. **대화 히스토리 자동 관리**: 프레임워크가 메시지 이력 추적
3. **컨텍스트 윈도우 관리**: 토큰 제한 고려한 이력 압축

#### Observability 구현
**Source**: https://github.com/microsoft/agent-framework/blob/main/python/samples/getting_started/observability/agent_observability.py

**Key Patterns**:
1. **OpenTelemetry 통합**:
   ```python
   from opentelemetry import trace
   from agent_framework.observability import enable_observability
   
   enable_observability(service_name="deep-research-agent")
   ```

2. **Custom Spans**: 각 에이전트 단계를 span으로 래핑
3. **Structured Logging**: JSON 형식 로그로 분석 용이

#### Shared State Management
**Source**: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/workflows/shared-states

**Key Patterns**:
1. **State Dictionary**: 워크플로우 전체에서 접근 가능한 공유 딕셔너리
2. **Thread-safe Operations**: 동시성 제어 내장
3. **State Snapshot**: 특정 시점의 상태 저장 및 복원

---

## 4. Google Custom Search API 통합

### Research Summary

**API Documentation**: https://developers.google.com/custom-search/v1/overview

**Key Points**:
1. **API Key 필요**: Google Cloud Console에서 발급
2. **사용량 제한**: 무료 티어 100 queries/day, 유료 $5/1000 queries
3. **검색 결과 형식**: JSON 응답, 최대 10개 결과/요청
4. **프로그래머블 검색 엔진**: 사전에 검색 엔진 ID 생성 필요

**Integration Pattern**:
```python
import requests

def search_google(query: str, api_key: str, search_engine_id: str):
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": api_key,
        "cx": search_engine_id,
        "q": query,
        "num": 10
    }
    response = requests.get(url, params=params)
    return response.json()
```

**Best Practices**:
- 검색 쿼리 최적화로 API 호출 최소화
- 캐싱으로 동일 쿼리 재사용
- Rate limiting 처리 (429 응답 핸들링)

---

## 5. arXiv API 통합

### Research Summary

**API Documentation**: https://info.arxiv.org/help/api/index.html

**Key Points**:
1. **인증 불필요**: 공개 API, API key 없이 사용 가능
2. **사용량 제한**: 초당 1회 요청 권장 (rate limiting)
3. **검색 쿼리**: 제목, 저자, 카테고리 등 필드별 검색 가능
4. **응답 형식**: Atom XML 형식

**Integration Pattern**:
```python
import arxiv

def search_arxiv(query: str, max_results: int = 10):
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance
    )
    results = []
    for paper in client.results(search):
        results.append({
            "title": paper.title,
            "authors": [author.name for author in paper.authors],
            "summary": paper.summary,
            "url": paper.entry_id,
            "published": paper.published
        })
    return results
```

**Best Practices**:
- 1초 딜레이로 rate limit 준수
- 결과 수 제한으로 응답 시간 최적화
- PDF 링크 포함하여 원문 접근 제공

**Python Library**: `arxiv` 패키지 사용 권장 (XML 파싱 자동화)

---

## 6. LLM Service 선택

### Decision: Azure OpenAI Service

### Rationale:
1. **엔터프라이즈급 보안**: Azure 보안 및 컴플라이언스 표준 준수
2. **Microsoft 생태계 통합**: Agent Framework와 네이티브 통합
3. **API 안정성**: 99.9% SLA 보장
4. **컨텍스트 윈도우**: GPT-4-turbo 128k tokens (긴 대화 지원)
5. **비용 관리**: Azure Portal에서 통합 모니터링 및 비용 추적
6. **리전 선택**: 데이터 주권 요구사항 충족 가능

### Deployment Models:
- **gpt-35-turbo**: 경제적이고 빠른 응답 (초기 권장)
- **gpt-4**: 복잡한 추론 작업에 우수한 품질
- **gpt-4-turbo**: 긴 컨텍스트 지원 (128k tokens)

### Alternatives Considered:
- **OpenAI API (직접)**: Azure 보안/컴플라이언스 부족
- **Anthropic Claude**: Microsoft 생태계 통합 약함
- **Local LLM (Llama 3)**: 추론 속도와 품질이 요구사항 미충족 가능성

### Cost Considerations:
- gpt-35-turbo: 경제적 (프로덕션 사용에 적합)
- gpt-4-turbo: 고급 추론 필요 시
- **권장**: 초기에는 gpt-35-turbo로 시작, 필요시 gpt-4로 업그레이드

### Azure OpenAI 설정:
1. Azure Portal에서 리소스 생성
2. 배포(Deployment) 생성 (모델 선택)
3. API Key, Endpoint, Deployment Name 확보
4. 환경변수 설정 (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME)

---

## 7. 백엔드 웹 프레임워크 선택

### Decision: FastAPI

### Rationale:
1. **WebSocket 지원**: 네이티브 WebSocket 엔드포인트 제공
2. **성능**: 비동기 I/O로 동시 요청 처리 효율적
3. **타입 안정성**: Pydantic 통합으로 데이터 검증 자동화
4. **문서 자동 생성**: OpenAPI/Swagger 자동 생성
5. **Python 3.12 호환**: 최신 Python 기능 활용 가능

### Alternatives Considered:
- **Flask**: 동기식이며 WebSocket 지원 약함
- **Django**: 과도한 기능, 프로젝트 규모에 부적합
- **Starlette**: FastAPI의 기반, 직접 사용보다 FastAPI가 편리

---

## 8. 프론트엔드 UI 라이브러리 선택

### Decision: Tailwind CSS + shadcn/ui

### Rationale:
1. **빠른 개발**: Utility-first CSS로 빠른 스타일링
2. **모던 디자인**: ChatGPT 스타일 UI 구현에 적합
3. **반응형**: Mobile-first 디자인 패턴 내장
4. **컴포넌트 라이브러리**: shadcn/ui로 고품질 컴포넌트 제공
5. **커스터마이징**: 쉬운 테마 변경 및 확장

### Alternatives Considered:
- **Material-UI**: 무겁고 ChatGPT 스타일과 거리가 있음
- **Chakra UI**: 좋지만 번들 크기가 큼
- **CSS Modules**: 일관성 유지 어려움

### Component Examples:
- **접이식 패널**: Accordion 또는 Collapsible 컴포넌트
- **메시지 리스트**: Virtualized list (react-window)로 성능 최적화
- **입력 박스**: Textarea with auto-resize

---

## 9. 세션 관리 및 스레드 격리

### Decision: In-memory session store (초기 버전)

### Rationale:
1. **단순성**: 데이터베이스 없이 빠른 프로토타이핑
2. **성능**: 메모리 접근으로 낮은 지연
3. **요구사항 충족**: 10명 동시 사용자는 메모리로 충분
4. **세션 기반**: 브라우저 세션 유지 동안만 보관 (요구사항과 일치)

### Implementation Pattern:
```python
from collections import defaultdict
from typing import Dict
from uuid import uuid4

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, ConversationThread] = {}
    
    def create_session(self) -> str:
        thread_id = str(uuid4())
        self.sessions[thread_id] = ConversationThread(thread_id)
        return thread_id
    
    def get_session(self, thread_id: str) -> ConversationThread:
        return self.sessions.get(thread_id)
    
    def cleanup_session(self, thread_id: str):
        if thread_id in self.sessions:
            del self.sessions[thread_id]
```

### Future Considerations:
- **Redis**: 영구 저장 및 분산 환경 지원 시 고려
- **Database**: PostgreSQL 등 (사용자 인증 기능 추가 시)

---

## 10. 에러 핸들링 및 타임아웃 전략

### Strategy

#### 외부 API 타임아웃
```python
import asyncio

async def search_with_timeout(query: str, timeout: float = 10.0):
    try:
        return await asyncio.wait_for(
            google_search(query),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        logger.warning(f"Google search timed out for query: {query}")
        return {"error": "timeout", "results": []}
```

#### 에이전트 오류 처리
- **Fallback**: 에이전트 실패 시 부분 결과 반환
- **Retry**: 일시적 오류는 최대 3회 재시도
- **User Notification**: 명확한 에러 메시지 표시

#### Rate Limiting
```python
from aiolimiter import AsyncLimiter

arxiv_limiter = AsyncLimiter(max_rate=1, time_period=1)  # 1 req/sec

async def search_arxiv_with_limit(query: str):
    async with arxiv_limiter:
        return await search_arxiv(query)
```

---

## Summary

모든 NEEDS CLARIFICATION 항목이 해결되었습니다:

1. ✅ **상태 관리**: Zustand 선택
2. ✅ **통신 프로토콜**: WebSocket 선택
3. ✅ **백엔드 프레임워크**: FastAPI 선택
4. ✅ **프론트엔드 UI**: Tailwind CSS + shadcn/ui 선택
5. ✅ **LLM Service**: OpenAI GPT-4/3.5-turbo 선택
6. ✅ **세션 관리**: In-memory store 선택

추가 리서치:
- Microsoft Agent Framework 패턴 정리
- Google Custom Search API 통합 방법
- arXiv API 통합 방법
- 에러 핸들링 전략 정의

다음 단계: Phase 1 - Design & Contracts
