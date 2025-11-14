# Implementation Plan: Deep Research Agent with Multi-Agent Workflow

**Branch**: `001-deep-research-agent` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-deep-research-agent/spec.md`  
**Quick Start**: [quickstart.md](./quickstart.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deep Research Agent는 Google Search와 arXiv API를 활용하여 연구 질문에 대한 종합적인 답변을 제공하는 멀티에이전트 시스템입니다. Microsoft Agent Framework의 Group Chat 워크플로우를 사용하여 Planning, Research, Reflect, Content Writing의 4개 에이전트가 협력하여 작업합니다. 각 에이전트의 작업 과정은 React 기반의 모던한 UI를 통해 실시간으로 시각화되며, 스레드 기반 멀티턴 대화를 지원합니다.

## Technical Context

**Language/Version**: Python 3.12+, JavaScript (React 18+)  
**Primary Dependencies**: 
- Backend: Microsoft Agent Framework, Azure OpenAI API, Google Custom Search API, arXiv API, uv (패키지 관리)
- Frontend: React 18+, Zustand (상태 관리), WebSocket (백엔드 통신)
**Storage**: 세션 기반 메모리 저장 (초기 버전, 영구 저장소 없음)  
**Testing**: pytest (backend), Jest/React Testing Library (frontend) - 초기 버전에서는 테스트 제외  
**Target Platform**: Web (데스크톱 및 태블릿 브라우저, macOS/Linux 개발 환경)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: 
- 첫 검색 결과 표시 < 10초
- 전체 답변 생성 < 60초
- UI 업데이트 지연 < 1초
- 동시 사용자 10명 지원
**Constraints**: 
- 단일 질문 최대 처리 시간 2분
- 외부 API 타임아웃 및 속도 제한 고려
- 세션 격리 및 스레드 안전성
**Scale/Scope**: 
- 초기 MVP: 4개 에이전트, 2개 검색 소스
- 동시 사용자: 10명
- 대화 세션: 브라우저 세션 내 유지

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

#### Principle 1: Microsoft Agent Framework 사용
- ✅ **Custom Agent 패턴**: 모든 에이전트(Planning, Research, Reflect, Content Writing)는 Custom Agent로 구현 예정
- ✅ **Group Chat 워크플로우**: 멀티에이전트 협력을 위해 Group Chat 패턴 사용
- ✅ **멀티턴 대화**: 스레드 기반 대화 관리로 컨텍스트 유지
- ✅ **관찰가능성(Observability)**: agent_observability.py 샘플 참고하여 구현
- ✅ **스테이트 관리**: 워크플로우 전반에 걸친 공유 상태 관리

**참고 문서**:
- Custom Agent: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/agents/agent-types/custom-agent?pivots=programming-language-python
- Group Chat: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/workflows/orchestrations/group-chat?pivots=programming-language-python
- Multi-turn: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/agents/multi-turn-conversation?pivots=programming-language-python
- Observability: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/workflows/observability
- State Management: https://learn.microsoft.com/ko-kr/agent-framework/user-guide/workflows/shared-states?pivots=programming-language-python

#### Principle 2: 모던 React UI
- ✅ **React 18+**: 프론트엔드 프레임워크로 사용
- ✅ **ChatGPT 스타일**: 세련되고 모던한 UI 디자인
- ✅ **실시간 시각화**: 에이전트 작업 과정 표시
- ✅ **접이식 UI**: 에이전트 세부 내용 확장/축소 가능

#### Principle 3-4: 테스트 코드
- ✅ **초기 버전 제외**: 테스트 코드는 나중에 작성 (constitution 명시)
- ✅ **문서 언어**: 구조는 영어, 내용은 한글

#### Principle 5: Observability
- ✅ **필수 구현**: agent_observability.py 샘플 코드 참고
- ✅ **디버깅 지원**: 에이전트 작업 과정 추적 및 로깅

#### 기술 스택 요구사항
- ✅ **Python 3.12+**: 백엔드 언어 버전
- ✅ **React 18+**: 프론트엔드 프레임워크 버전

### Gate Status: ✅ PASS

모든 constitution 원칙을 준수합니다. 추가 정당화가 필요한 위반 사항 없음.

## Project Structure

### Documentation (this feature)

```text
specs/001-deep-research-agent/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── backend-api.yaml         # Backend REST API or WebSocket protocol
│   └── agent-messages.yaml      # Agent 간 메시지 스키마
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── pyproject.toml               # uv 프로젝트 설정
├── uv.lock                      # 의존성 락 파일
├── src/
│   ├── agents/                  # 에이전트 구현
│   │   ├── __init__.py
│   │   ├── base.py              # Base Custom Agent
│   │   ├── planning_agent.py   # Planning Agent
│   │   ├── research_agent.py   # Research Agent
│   │   ├── reflect_agent.py    # Reflect Agent
│   │   └── content_agent.py    # Content Writing Agent
│   ├── workflows/               # 워크플로우 구현
│   │   ├── __init__.py
│   │   ├── group_chat.py        # Group Chat 워크플로우
│   │   └── state_manager.py    # 공유 상태 관리
│   ├── services/                # 외부 서비스 통합
│   │   ├── __init__.py
│   │   ├── google_search.py    # Google Custom Search API
│   │   ├── arxiv_search.py     # arXiv API
│   │   └── azure_openai_service.py  # Azure OpenAI API
│   ├── models/                  # 데이터 모델
│   │   ├── __init__.py
│   │   ├── query.py             # Research Query
│   │   ├── thread.py            # Conversation Thread
│   │   ├── agent_state.py       # Agent State
│   │   └── search_result.py    # Search Result
│   ├── api/                     # API 엔드포인트
│   │   ├── __init__.py
│   │   ├── routes.py            # REST or WebSocket routes
│   │   └── middleware.py       # CORS, error handling
│   ├── observability/           # 관찰가능성
│   │   ├── __init__.py
│   │   └── telemetry.py         # Logging, tracing
│   └── main.py                  # 애플리케이션 진입점
└── tests/                       # 테스트 (초기 버전 제외)
    ├── unit/
    └── integration/

frontend/
├── package.json
├── src/
│   ├── components/              # React 컴포넌트
│   │   ├── ChatInterface.tsx    # 메인 채팅 인터페이스
│   │   ├── MessageList.tsx      # 메시지 리스트
│   │   ├── InputBox.tsx         # 질문 입력
│   │   ├── AgentPanel.tsx       # 에이전트 작업 패널
│   │   ├── AgentCard.tsx        # 개별 에이전트 카드
│   │   └── SourceList.tsx       # 검색 출처 목록
│   ├── hooks/                   # Custom React hooks
│   │   ├── useWebSocket.ts      # WebSocket 연결
│   │   └── useAgentState.ts     # 에이전트 상태 관리
│   ├── services/                # API 통신
│   │   ├── api.ts               # Backend API 클라이언트
│   │   └── websocket.ts         # WebSocket 클라이언트
│   ├── store/                   # 상태 관리 (Redux/Zustand 등)
│   │   ├── index.ts
│   │   ├── conversationSlice.ts
│   │   └── agentSlice.ts
│   ├── types/                   # TypeScript 타입 정의
│   │   ├── agent.ts
│   │   ├── message.ts
│   │   └── search.ts
│   ├── App.tsx                  # 루트 컴포넌트
│   └── main.tsx                 # 진입점
└── tests/                       # 테스트 (초기 버전 제외)

.specify/                        # Speckit 메타데이터
└── memory/
    └── constitution.md          # 프로젝트 원칙
```

**Structure Decision**: Web application 구조 선택 (Option 2). Backend는 Python/Microsoft Agent Framework, Frontend는 React 18+를 사용하는 전형적인 풀스택 웹 애플리케이션입니다. Backend는 uv로 패키지 관리되며, 에이전트와 워크플로우를 명확히 분리한 계층 구조를 따릅니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - Constitution Check에서 모든 항목이 통과했으므로 복잡도 추적이 필요 없습니다.
