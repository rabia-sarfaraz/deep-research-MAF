# Quick Start Guide - Deep Research Agent

**Version**: 1.0.0  
**Date**: 2025-11-14  
**Target Audience**: Developers implementing the Deep Research Agent

## Overview

이 가이드는 Deep Research Agent 시스템을 처음부터 구현하기 위한 단계별 지침을 제공합니다. Constitution.md의 원칙과 이 문서의 설계를 준수하여 개발하세요.

---

## Prerequisites

### Required Tools
- **Python**: 3.12 이상
- **Node.js**: 18 이상
- **uv**: Python 패키지 관리자 ([설치 가이드](https://github.com/astral-sh/uv))
- **Git**: 버전 관리

### Required API Keys
1. **Azure OpenAI API Key**: LLM 서비스용
   - Azure Portal에서 Azure OpenAI 리소스 생성
   - API Key, Endpoint, Deployment Name 확보
   - https://portal.azure.com/ → Azure OpenAI Service
2. **Google Custom Search API Key**: 웹 검색용
   - https://developers.google.com/custom-search/v1/introduction 참조
3. **Google Custom Search Engine ID**: 프로그래머블 검색 엔진
   - https://programmablesearchengine.google.com/ 에서 생성

### Optional
- **arXiv API**: 인증 불필요 (공개 API)

---

## Project Setup

### 1. Initialize Backend

```bash
# 프로젝트 디렉토리 생성
mkdir deep-researcher-maf
cd deep-researcher-maf

# Backend 디렉토리 생성
mkdir backend
cd backend

# uv로 Python 프로젝트 초기화
uv init --python 3.12

# 핵심 의존성 추가
uv add microsoft-agent-framework
uv add fastapi uvicorn websockets
uv add openai  # Azure OpenAI 지원 (버전 1.0+)
uv add google-api-python-client
uv add arxiv
uv add pydantic
uv add python-dotenv

# Observability 의존성
uv add opentelemetry-api opentelemetry-sdk
uv add opentelemetry-instrumentation-fastapi

# 개발 의존성 (나중에 테스트 작성 시)
uv add --dev pytest pytest-asyncio httpx
```

### 2. Initialize Frontend

```bash
# 프로젝트 루트로 돌아가기
cd ..

# Vite + React + TypeScript 프로젝트 생성
npm create vite@latest frontend -- --template react-ts
cd frontend

# 의존성 설치
npm install

# UI 라이브러리 설치
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 상태 관리 (Zustand)
npm install zustand

# WebSocket 클라이언트
npm install ws
npm install @types/ws --save-dev

# shadcn/ui 설정 (선택 사항, UI 컴포넌트)
npx shadcn-ui@latest init
```

### 3. Environment Configuration

Backend `.env` 파일 생성:

```bash
cd ../backend
cat > .env << EOF
# Azure OpenAI Service
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-35-turbo  # or gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Google Custom Search
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id-here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Observability
ENABLE_OBSERVABILITY=true
OTEL_SERVICE_NAME=deep-research-agent
EOF
```

---

## Implementation Steps

### Phase 1: Data Models (Backend)

**파일**: `backend/src/models/`

참조 문서: `specs/001-deep-research-agent/data-model.md`

```bash
cd backend/src
mkdir models
cd models
touch __init__.py query.py thread.py agent_state.py search_result.py
```

**구현 우선순위**:
1. `query.py` - ResearchQuery 모델
2. `thread.py` - ConversationThread 모델
3. `agent_state.py` - AgentState 모델
4. `search_result.py` - SearchResult 모델

**예제** (`query.py`):
```python
from pydantic import BaseModel, Field
from typing import List
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
    
    class Config:
        use_enum_values = True
```

---

### Phase 2: External Services Integration (Backend)

**파일**: `backend/src/services/`

참조 문서: `specs/001-deep-research-agent/research.md` (섹션 4, 5)

```bash
cd ../services
touch __init__.py google_search.py arxiv_search.py azure_openai_service.py
```

**구현 우선순위**:
1. `google_search.py` - Google Custom Search API 통합
2. `arxiv_search.py` - arXiv API 통합
3. `azure_openai_service.py` - Azure OpenAI API 통합

**예제** (`google_search.py`):
```python
import os
from googleapiclient.discovery import build
from typing import List, Dict

class GoogleSearchService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.search_engine_id = os.getenv("GOOGLE_SEARCH_ENGINE_ID")
        self.service = build("customsearch", "v1", developerKey=self.api_key)
    
    async def search(self, query: str, num_results: int = 10) -> List[Dict]:
        result = self.service.cse().list(
            q=query,
            cx=self.search_engine_id,
            num=num_results
        ).execute()
        
        return [
            {
                "title": item.get("title"),
                "url": item.get("link"),
                "snippet": item.get("snippet")
            }
            for item in result.get("items", [])
        ]
```

---

### Phase 3: Custom Agents (Backend)

**파일**: `backend/src/agents/`

참조 문서:
- `specs/001-deep-research-agent/research.md` (섹션 3)
- Constitution.md (Microsoft Agent Framework 링크)

```bash
cd ../agents
touch __init__.py base.py planning_agent.py research_agent.py reflect_agent.py content_agent.py
```

**구현 우선순위**:
1. `base.py` - Base Custom Agent (공통 로직)
2. `planning_agent.py` - Planning Agent
3. `research_agent.py` - Research Agent
4. `reflect_agent.py` - Reflect Agent
5. `content_agent.py` - Content Writing Agent

**예제** (`planning_agent.py`):
```python
from agent_framework import Agent, AgentContext
from ..services.azure_openai_service import AzureOpenAIService
from ..models.query import ResearchQuery

class PlanningAgent(Agent):
    def __init__(self, llm_service: AzureOpenAIService):
        super().__init__(name="planning")
        self.llm_service = llm_service
    
    async def run(self, context: AgentContext):
        query: ResearchQuery = context.get("query")
        
        # LLM을 사용하여 검색 전략 생성
        prompt = f"""
        다음 연구 질문에 대한 검색 전략을 수립하세요:
        질문: {query.content}
        
        응답 형식:
        - 전체 전략 설명
        - 키워드 목록
        - 단계별 검색 계획
        """
        
        strategy = await self.llm_service.generate(prompt)
        
        # 상태 업데이트
        context.set("research_plan", strategy)
        
        return {
            "status": "completed",
            "strategy": strategy
        }
```

---

### Phase 4: Group Chat Workflow (Backend)

**파일**: `backend/src/workflows/`

참조 문서:
- Constitution.md (Group Chat 링크)
- `specs/001-deep-research-agent/contracts/agent-messages.md`

```bash
cd ../workflows
touch __init__.py group_chat.py state_manager.py
```

**구현 우선순위**:
1. `state_manager.py` - 공유 상태 관리
2. `group_chat.py` - Group Chat 워크플로우 구성

**예제** (`group_chat.py`):
```python
from agent_framework.workflows import GroupChat
from ..agents import PlanningAgent, ResearchAgent, ReflectAgent, ContentAgent

class ResearchWorkflow:
    def __init__(self, agents: dict):
        self.planning = agents["planning"]
        self.research = agents["research"]
        self.reflect = agents["reflect"]
        self.content = agents["content"]
        
        self.workflow = GroupChat(
            agents=[self.planning, self.research, self.reflect, self.content],
            max_turns=20
        )
    
    async def execute(self, query: ResearchQuery):
        # 워크플로우 시작
        result = await self.workflow.run(
            initial_context={"query": query}
        )
        return result
```

---

### Phase 5: API Endpoints (Backend)

**파일**: `backend/src/api/`

참조 문서: `specs/001-deep-research-agent/contracts/backend-api.yaml`

```bash
cd ../api
touch __init__.py routes.py middleware.py websocket.py
```

**구현 우선순위**:
1. `middleware.py` - CORS, 에러 핸들링
2. `routes.py` - REST API 엔드포인트
3. `websocket.py` - WebSocket 엔드포인트

**예제** (`routes.py`):
```python
from fastapi import APIRouter, HTTPException
from ..models.thread import ConversationThread
from ..models.query import ResearchQuery
from typing import Dict
from uuid import uuid4

router = APIRouter()

# In-memory session store (초기 버전)
sessions: Dict[str, ConversationThread] = {}

@router.post("/threads")
async def create_thread(session_id: str):
    thread = ConversationThread(
        id=uuid4(),
        session_id=session_id,
        queries=[],
        answers=[],
        status="active"
    )
    sessions[str(thread.id)] = thread
    return thread

@router.post("/threads/{thread_id}/queries")
async def submit_query(thread_id: str, query_data: dict):
    thread = sessions.get(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    query = ResearchQuery(
        thread_id=thread.id,
        content=query_data["content"],
        search_sources=query_data["search_sources"]
    )
    
    # 비동기로 워크플로우 실행 (백그라운드 태스크)
    # asyncio.create_task(workflow.execute(query))
    
    return query
```

---

### Phase 6: Frontend Components

**파일**: `frontend/src/components/`

```bash
cd ../../../../frontend/src
mkdir components
cd components
touch ChatInterface.tsx MessageList.tsx InputBox.tsx AgentPanel.tsx AgentCard.tsx
```

**구현 우선순위**:
1. `ChatInterface.tsx` - 메인 채팅 인터페이스
2. `InputBox.tsx` - 질문 입력
3. `MessageList.tsx` - 메시지 리스트
4. `AgentPanel.tsx` - 에이전트 패널
5. `AgentCard.tsx` - 개별 에이전트 카드

**예제** (`AgentCard.tsx`):
```typescript
import React from 'react';
import { AgentState } from '../types/agent';

interface AgentCardProps {
  agent: AgentState;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  return (
    <div className="border rounded-lg p-4 mb-2">
      <div 
        className="flex justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-semibold">{agent.agent_id}</h3>
        <span className="text-sm text-gray-600">{agent.status}</span>
      </div>
      
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${agent.progress * 100}%` }}
          />
        </div>
      </div>
      
      {expanded && agent.current_task && (
        <div className="mt-4 p-2 bg-gray-50 rounded">
          <p className="text-sm">{agent.current_task}</p>
        </div>
      )}
    </div>
  );
};
```

---

### Phase 7: State Management (Frontend)

**파일**: `frontend/src/store/`

참조 문서: `specs/001-deep-research-agent/research.md` (섹션 1)

```bash
cd ../store
touch index.ts conversationSlice.ts agentSlice.ts
```

**예제** (`agentSlice.ts`):
```typescript
import { create } from 'zustand';
import { AgentState } from '../types/agent';

interface AgentStore {
  agents: Record<string, AgentState>;
  updateAgentState: (agentId: string, state: Partial<AgentState>) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: {
    planning: { agent_id: 'planning', status: 'idle', progress: 0 },
    research: { agent_id: 'research', status: 'idle', progress: 0 },
    reflect: { agent_id: 'reflect', status: 'idle', progress: 0 },
    content: { agent_id: 'content', status: 'idle', progress: 0 },
  },
  updateAgentState: (agentId, newState) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [agentId]: { ...state.agents[agentId], ...newState },
      },
    })),
}));
```

---

### Phase 8: WebSocket Integration (Frontend)

**파일**: `frontend/src/services/`

```bash
cd ../services
touch websocket.ts api.ts
```

**예제** (`websocket.ts`):
```typescript
import { useAgentStore } from '../store/agentSlice';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  
  connect(threadId: string) {
    this.ws = new WebSocket(`ws://localhost:8000/ws/${threadId}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }
  
  handleMessage(message: any) {
    const { updateAgentState } = useAgentStore.getState();
    
    switch (message.type) {
      case 'agent_state_update':
        updateAgentState(message.data.agent_id, message.data);
        break;
      case 'agent_message':
        // Handle agent communication
        console.log('Agent message:', message.data);
        break;
      // ... other message types
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

---

## Running the Application

### 1. Start Backend

```bash
cd backend

# 개발 서버 실행
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend

```bash
cd frontend

# 개발 서버 실행
npm run dev
```

### 3. Access Application

- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8000/docs

---

## Testing Checklist

개발 완료 후 다음 항목을 테스트하세요:

### Backend Tests
- [ ] Thread 생성 및 조회 API
- [ ] Query 제출 API
- [ ] WebSocket 연결 및 메시지 수신
- [ ] Google Search API 통합
- [ ] arXiv API 통합
- [ ] LLM 서비스 통합
- [ ] 에이전트 워크플로우 실행

### Frontend Tests
- [ ] UI 렌더링 (모든 컴포넌트)
- [ ] 질문 입력 및 제출
- [ ] 메시지 리스트 표시
- [ ] 에이전트 카드 확장/축소
- [ ] 실시간 에이전트 상태 업데이트
- [ ] WebSocket 연결 안정성

### Integration Tests
- [ ] End-to-end 질문 처리 (질문 → 답변)
- [ ] 멀티턴 대화 (후속 질문)
- [ ] 동시 사용자 시뮬레이션 (10명)
- [ ] 에러 핸들링 (API 타임아웃, 네트워크 오류)

---

## Troubleshooting

### Common Issues

**1. WebSocket Connection Failed**
```bash
# CORS 설정 확인
# backend/src/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. Azure OpenAI API Key Not Found**
```bash
# .env 파일 로드 확인
# backend/src/main.py
from dotenv import load_dotenv
load_dotenv()

# Azure OpenAI 환경변수 확인
echo $AZURE_OPENAI_API_KEY
echo $AZURE_OPENAI_ENDPOINT
```

**3. Microsoft Agent Framework Import Error**
```bash
# 패키지 재설치
uv sync
uv pip list | grep microsoft-agent-framework
```

---

## Next Steps

1. ✅ **Phase 0-1 완료**: Research 및 Data Model 정의
2. ✅ **Phase 2 완료**: API Contracts 작성
3. 🔄 **Phase 3 시작**: 실제 코드 구현
   - Backend 데이터 모델 구현
   - 외부 서비스 통합
   - Custom Agent 구현
   - Group Chat 워크플로우 구성
4. 🔄 **Phase 4**: Frontend 구현
   - React 컴포넌트 개발
   - Zustand 상태 관리
   - WebSocket 통합
5. 🔄 **Phase 5**: 통합 테스트 및 디버깅

---

## Reference Documents

- **Specification**: `specs/001-deep-research-agent/spec.md`
- **Implementation Plan**: `specs/001-deep-research-agent/plan.md`
- **Research**: `specs/001-deep-research-agent/research.md`
- **Data Model**: `specs/001-deep-research-agent/data-model.md`
- **API Contracts**: `specs/001-deep-research-agent/contracts/`
- **Constitution**: `.specify/memory/constitution.md`

---

## Support Resources

### Microsoft Agent Framework
- Docs: https://learn.microsoft.com/ko-kr/agent-framework/
- Samples: https://github.com/microsoft/agent-framework/tree/main/python/samples
- Observability Sample: https://github.com/microsoft/agent-framework/blob/main/python/samples/getting_started/observability/agent_observability.py

### External APIs
- Azure OpenAI Service: https://learn.microsoft.com/en-us/azure/ai-services/openai/
- Azure OpenAI Python SDK: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/migration
- Google Custom Search: https://developers.google.com/custom-search/v1/overview
- arXiv API: https://info.arxiv.org/help/api/index.html

### Frontend
- React Docs: https://react.dev/
- Zustand Docs: https://docs.pmnd.rs/zustand/
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/

---

**Last Updated**: 2025-11-14  
**Version**: 1.0.0
