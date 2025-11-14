# Tasks: Deep Research Agent with Multi-Agent Workflow

**Input**: Design documents from `/specs/001-deep-research-agent/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per constitution.md, tests are excluded from initial version

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with:
- Backend: `backend/src/`
- Frontend: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend directory structure: src/{agents,workflows,services,models,api,observability}
- [x] T002 Initialize backend Python project with uv in backend/pyproject.toml
- [x] T003 [P] Add backend dependencies: microsoft-agent-framework, fastapi, uvicorn, websockets, openai, google-api-python-client, arxiv, pydantic, python-dotenv
- [x] T004 [P] Add observability dependencies: opentelemetry-api, opentelemetry-sdk, opentelemetry-instrumentation-fastapi
- [x] T005 Create frontend with Vite + React + TypeScript in frontend/
- [x] T006 [P] Add frontend dependencies: zustand, tailwindcss, ws (@types/ws)
- [x] T007 [P] Configure Tailwind CSS in frontend/tailwind.config.js and frontend/postcss.config.js
- [x] T008 Create backend/.env template with Azure OpenAI, Google Search, arXiv API configuration
- [x] T009 Create frontend directory structure: src/{components,hooks,services,store,types}

**Checkpoint**: Project structure initialized, dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Data Models (Backend)

- [x] T010 [P] Create base Pydantic models with UUID, datetime, enum types in backend/src/models/__init__.py
- [x] T011 [P] Implement ResearchQuery model in backend/src/models/query.py
- [x] T012 [P] Implement ConversationThread model in backend/src/models/thread.py
- [x] T013 [P] Implement AgentState model in backend/src/models/agent_state.py
- [x] T014 [P] Implement SearchResult model in backend/src/models/search_result.py
- [x] T015 [P] Implement ResearchPlan model in backend/src/models/research_plan.py
- [x] T016 [P] Implement SynthesizedAnswer model in backend/src/models/synthesized_answer.py
- [x] T017 [P] Implement AgentMessage model in backend/src/models/agent_message.py

### External Services Integration (Backend)

- [x] T018 [P] Implement Azure OpenAI service client in backend/src/services/azure_openai_service.py
- [x] T019 [P] Implement Google Custom Search service in backend/src/services/google_search.py
- [x] T020 [P] Implement arXiv search service in backend/src/services/arxiv_search.py

### Observability & Infrastructure (Backend)

- [x] T021 [P] Implement telemetry and logging setup in backend/src/observability/telemetry.py
- [x] T022 [P] Implement CORS and error handling middleware in backend/src/api/middleware.py

### Type Definitions (Frontend)

- [x] T023 [P] Define AgentState TypeScript types in frontend/src/types/agent.ts
- [x] T024 [P] Define Message TypeScript types in frontend/src/types/message.ts
- [x] T025 [P] Define Search TypeScript types in frontend/src/types/search.ts

### Base Agent Implementation (Backend)

- [x] T026 Create base Custom Agent class in backend/src/agents/base.py
- [x] T027 Implement shared state manager for Group Chat in backend/src/workflows/state_manager.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 연구 질문에 대한 종합적인 답변 받기 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 복잡한 연구 질문을 입력하면, Google 검색과 arXiv 검색을 통해 정보를 수집하고 체계적인 답변을 제공

**Independent Test**: "quantum computing의 최신 발전 동향은?" 질문 입력 → 검색 수행 → 구조화된 답변 + 출처 표시

### Custom Agents Implementation (Backend)

- [x] T028 [P] [US1] Implement Planning Agent in backend/src/agents/planning_agent.py
- [x] T029 [P] [US1] Implement Research Agent in backend/src/agents/research_agent.py
- [x] T030 [P] [US1] Implement Reflect Agent in backend/src/agents/reflect_agent.py
- [x] T031 [P] [US1] Implement Content Writing Agent in backend/src/agents/content_agent.py

### Group Chat Workflow (Backend)

- [x] T032 [US1] Implement Group Chat orchestration in backend/src/workflows/group_chat.py (depends on T028-T031)
- [x] T033 [US1] Integrate all agents into workflow execution pipeline in backend/src/workflows/group_chat.py

### API Endpoints (Backend)

- [x] T034 [US1] Implement POST /threads endpoint in backend/src/api/routes.py
- [x] T035 [US1] Implement GET /threads/{thread_id} endpoint in backend/src/api/routes.py
- [x] T036 [US1] Implement POST /threads/{thread_id}/queries endpoint in backend/src/api/routes.py
- [x] T037 [US1] Implement WebSocket endpoint /ws/{thread_id} in backend/src/api/routes.py
- [x] T038 [US1] Create FastAPI application entry point in backend/src/main.py

### State Management (Frontend)

- [x] T039 [P] [US1] Create conversation state slice with Zustand in frontend/src/store/conversationSlice.ts
- [x] T040 [P] [US1] Create agent state slice with Zustand in frontend/src/store/agentSlice.ts
- [x] T041 [US1] Create store index and exports in frontend/src/store/index.ts

### Services & Hooks (Frontend)

- [x] T042 [P] [US1] Implement REST API client in frontend/src/services/api.ts
- [x] T043 [P] [US1] Implement WebSocket client in frontend/src/services/websocket.ts
- [x] T044 [P] [US1] Create useWebSocket custom hook in frontend/src/hooks/useWebSocket.ts
- [x] T045 [P] [US1] Create useAgentState custom hook in frontend/src/hooks/useAgentState.ts

### UI Components (Frontend)

- [x] T046 [P] [US1] Create ChatInterface component in frontend/src/components/ChatInterface.tsx
- [x] T047 [P] [US1] Create InputBox component in frontend/src/components/InputBox.tsx
- [x] T048 [P] [US1] Create MessageList component in frontend/src/components/MessageList.tsx
- [x] T049 [P] [US1] Create SourceList component in frontend/src/components/SourceList.tsx
- [x] T050 [US1] Wire up ChatInterface with InputBox, MessageList, SourceList in frontend/src/components/ChatInterface.tsx
- [x] T051 [US1] Create main App component in frontend/src/App.tsx
- [x] T052 [US1] Create app entry point in frontend/src/main.tsx

### Integration & Error Handling

- [x] T053 [US1] Add error handling for external API timeouts (Google, arXiv, Azure OpenAI)
- [x] T054 [US1] Add validation for empty search results scenario
- [x] T055 [US1] Add user feedback for processing states (searching, analyzing, generating)

**Checkpoint**: User Story 1 MVP complete - Users can ask questions and get synthesized answers with sources

---

## Phase 4: User Story 2 - 멀티에이전트 작업 과정 실시간 모니터링 (Priority: P1)

**Goal**: 각 에이전트(Planning, Research, Reflect, Content Writing)의 작업 과정을 실시간으로 모니터링하고 세부 내용을 확인

**Independent Test**: 질문 입력 → UI에서 각 에이전트 상태 확인 → 에이전트 클릭하여 세부 내용 펼치기/접기

### Backend Agent State Broadcasting

- [ ] T056 [US2] Implement agent state update broadcasting via WebSocket in backend/src/workflows/group_chat.py
- [ ] T057 [US2] Add agent progress tracking in all agents (Planning, Research, Reflect, Content)
- [ ] T058 [US2] Implement agent message logging for inter-agent communication

### Frontend Agent Monitoring UI

- [ ] T059 [P] [US2] Create AgentPanel component in frontend/src/components/AgentPanel.tsx
- [ ] T060 [P] [US2] Create AgentCard component with expand/collapse in frontend/src/components/AgentCard.tsx
- [ ] T061 [US2] Integrate AgentPanel into ChatInterface in frontend/src/components/ChatInterface.tsx
- [ ] T062 [US2] Add WebSocket handler for agent_state_update events in frontend/src/services/websocket.ts
- [ ] T063 [US2] Add WebSocket handler for agent_message events in frontend/src/services/websocket.ts

### Visual Feedback

- [ ] T064 [P] [US2] Add progress bar visualization in AgentCard component
- [ ] T065 [P] [US2] Add agent status icons (idle, thinking, working, completed, failed)
- [ ] T066 [US2] Add animation for agent state transitions
- [ ] T067 [US2] Style agent panel with ChatGPT-inspired modern design

**Checkpoint**: User Story 2 complete - Users can monitor agent work in real-time

---

## Phase 5: User Story 3 - 대화 이력을 통한 후속 질문 (Priority: P2)

**Goal**: 이전 대화 맥락을 유지하면서 후속 질문을 할 수 있으며, 시스템이 이전 내용을 참조하여 답변 생성

**Independent Test**: 첫 질문 후 "좀 더 구체적으로 설명해줘" 입력 → 맥락이 유지된 답변 확인

### Backend Multi-Turn Support

- [ ] T068 [US3] Add conversation context management in backend/src/workflows/state_manager.py
- [ ] T069 [US3] Modify Planning Agent to consider previous Q&A context
- [ ] T070 [US3] Modify Research Agent to reference previous search results
- [ ] T071 [US3] Add context window management for long conversations

### Frontend Conversation History

- [ ] T072 [P] [US3] Add conversation history display to MessageList component
- [ ] T073 [P] [US3] Add "New Conversation" button to ChatInterface
- [ ] T074 [US3] Implement conversation history state persistence in Zustand store
- [ ] T075 [US3] Add visual indicator for context-aware responses

### API Enhancement

- [ ] T076 [US3] Add GET /threads/{thread_id}/history endpoint in backend/src/api/routes.py
- [ ] T077 [US3] Add conversation context to query submission payload

**Checkpoint**: User Story 3 complete - Multi-turn conversations with context preservation

---

## Phase 6: User Story 4 - 검색 소스 선택 및 필터링 (Priority: P3)

**Goal**: 사용자가 Google 검색만, arXiv만, 또는 둘 다 사용할지 선택 가능

**Independent Test**: 설정에서 "arXiv only" 선택 → 질문 입력 → arXiv 논문만 검색되는지 확인

### Backend Source Filtering

- [ ] T078 [US4] Add search source validation in ResearchQuery model
- [ ] T079 [US4] Modify Research Agent to respect search_sources parameter
- [ ] T080 [US4] Add source-specific result formatting

### Frontend Source Selection UI

- [ ] T081 [P] [US4] Add search source selector to InputBox component
- [ ] T082 [P] [US4] Add default source selection to settings (store)
- [ ] T083 [US4] Display selected sources in query submission
- [ ] T084 [US4] Add visual distinction for source types in SourceList

**Checkpoint**: User Story 4 complete - Flexible source selection

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Performance & Optimization

- [ ] T085 [P] Add response caching for repeated queries
- [ ] T086 [P] Optimize WebSocket message batching for high-frequency updates
- [ ] T087 [P] Add lazy loading for conversation history
- [ ] T088 Implement rate limiting for API calls (Google, arXiv)

### Error Handling & Edge Cases

- [ ] T089 [P] Handle agent failure gracefully with user feedback
- [ ] T090 [P] Add timeout handling for long-running queries (>2 min)
- [ ] T091 [P] Handle WebSocket disconnection and reconnection
- [ ] T092 Handle browser refresh during active query processing
- [ ] T093 Add fallback UI for empty search results

### Documentation & Code Quality

- [ ] T094 [P] Add API documentation to backend/README.md
- [ ] T095 [P] Add component documentation to frontend/README.md
- [ ] T096 [P] Add inline code comments for complex agent logic
- [ ] T097 Run quickstart.md validation for all setup steps

### Security & Configuration

- [ ] T098 [P] Add API key validation on startup
- [ ] T099 [P] Add rate limiting for concurrent users (10 users max)
- [ ] T100 [P] Add session isolation verification
- [ ] T101 Add HTTPS support for production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US2 (Phase 4) are both P1 - can proceed in parallel after foundational
  - US3 (Phase 5) is P2 - can start after foundational, integrates with US1
  - US4 (Phase 6) is P3 - can start after foundational, enhances US1
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
  - Delivers: Complete research workflow with agent execution
  - MVP-ready: This story alone is a functional product
  
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 agents being implemented
  - Delivers: Real-time monitoring UI for agent work
  - Enhances: US1 by adding transparency and visibility
  - Can work in parallel: Frontend team can work on US2 while backend completes US1 agents
  
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Extends US1 conversation flow
  - Delivers: Multi-turn conversations with context
  - Enhances: US1 by enabling follow-up questions
  - Independent implementation: Separate context management module
  
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 search flexibility
  - Delivers: Source selection UI and filtering
  - Enhances: US1 by adding user control over sources
  - Independent implementation: Separate UI controls and validation

### Within Each User Story

#### User Story 1 (Research Workflow)
1. Agents can be implemented in parallel (T028-T031) [P]
2. Group Chat workflow requires all agents (T032-T033)
3. API endpoints can be implemented in parallel (T034-T038)
4. Frontend components can be implemented in parallel (T039-T052) [P]
5. Integration and error handling last (T053-T055)

#### User Story 2 (Agent Monitoring)
1. Backend broadcasting setup (T056-T058)
2. Frontend UI components can be in parallel (T059-T060) [P]
3. Integration and styling (T061-T067)

#### User Story 3 (Multi-Turn)
1. Backend context management (T068-T071)
2. Frontend history UI can be in parallel (T072-T073) [P]
3. Integration (T074-T077)

#### User Story 4 (Source Selection)
1. Backend filtering (T078-T080)
2. Frontend UI can be in parallel (T081-T082) [P]
3. Integration (T083-T084)

### Parallel Opportunities

**Phase 1 (Setup)**:
- T003, T004 (backend deps) can run parallel
- T006, T007 (frontend setup) can run parallel
- T008, T009 (configuration) can run parallel

**Phase 2 (Foundational)**:
- All data models (T010-T017) can run in parallel [P]
- All external services (T018-T020) can run in parallel [P]
- All observability setup (T021-T022) can run in parallel [P]
- All TypeScript types (T023-T025) can run in parallel [P]

**Phase 3 (US1)**:
- All 4 agents (T028-T031) can run in parallel [P]
- Frontend store slices (T039-T040) can run in parallel [P]
- Frontend services (T042-T045) can run in parallel [P]
- Frontend UI components (T046-T049) can run in parallel [P]

**Phase 4 (US2)**:
- Frontend components (T059-T060) can run in parallel [P]
- Visual feedback (T064-T065) can run in parallel [P]

**Phase 5 (US3)**:
- Frontend history components (T072-T073) can run in parallel [P]

**Phase 6 (US4)**:
- Frontend UI controls (T081-T082) can run in parallel [P]

**Phase 7 (Polish)**:
- Most polish tasks (T085-T101) can run in parallel [P]

---

## Parallel Example: Foundational Phase

If you have 3 developers, you can parallelize Phase 2 like this:

```bash
# Dev 1: Data Models
T010, T011, T012, T013, T014, T015, T016, T017

# Dev 2: External Services + Observability
T018, T019, T020, T021, T022

# Dev 3: Frontend Types + Base Agent
T023, T024, T025, T026, T027
```

All devs can work simultaneously since these files don't conflict.

---

## Parallel Example: User Story 1

If you have backend and frontend teams:

```bash
# Backend Team (2 devs)
Dev 1: T028, T029 (Planning, Research agents)
Dev 2: T030, T031 (Reflect, Content agents)
→ Then Dev 1: T032-T033 (Group Chat integration)
→ Then Dev 2: T034-T038 (API endpoints)

# Frontend Team (2 devs)
Dev 3: T039-T041, T042-T043 (Store + Services)
Dev 4: T044-T045, T046-T049 (Hooks + Components)
→ Then Dev 3: T050-T052 (Integration)
→ Both: T053-T055 (Error handling)
```

---

## Implementation Strategy

### MVP Scope (Recommended First Milestone)

Implement in this order for fastest time-to-value:

1. **Phase 1 + 2**: Setup + Foundational (1-2 weeks)
2. **Phase 3**: User Story 1 only (2-3 weeks)
   - This gives you a working research agent with full workflow
   - Testable end-to-end: User asks question → gets answer with sources

**Stop here for MVP demo** - You have a functional Deep Research Agent

3. **Phase 4**: Add User Story 2 (1 week)
   - Adds transparency and monitoring to existing workflow
   
4. **Phase 5**: Add User Story 3 (1 week)
   - Enables multi-turn conversations

5. **Phase 6**: Add User Story 4 (3-5 days)
   - Adds source filtering flexibility

6. **Phase 7**: Polish (ongoing)
   - Performance, security, documentation

### Incremental Delivery

Each user story after US1 can be released independently:
- **Release 1.0**: US1 only (core research agent)
- **Release 1.1**: US1 + US2 (add monitoring)
- **Release 1.2**: US1 + US2 + US3 (add multi-turn)
- **Release 1.3**: US1 + US2 + US3 + US4 (add source selection)

---

## Task Summary

- **Total Tasks**: 101
- **Setup Phase**: 9 tasks
- **Foundational Phase**: 18 tasks
- **User Story 1 (P1)**: 28 tasks
- **User Story 2 (P1)**: 12 tasks
- **User Story 3 (P2)**: 10 tasks
- **User Story 4 (P3)**: 7 tasks
- **Polish Phase**: 17 tasks

### Tasks by User Story

| User Story | Priority | Task Count | Parallel Tasks | Estimated Effort |
|------------|----------|------------|----------------|------------------|
| US1: Core Research Workflow | P1 | 28 | 18 | 2-3 weeks |
| US2: Agent Monitoring | P1 | 12 | 6 | 1 week |
| US3: Multi-Turn Conversations | P2 | 10 | 2 | 1 week |
| US4: Source Selection | P3 | 7 | 2 | 3-5 days |

### Parallel Opportunities

- **Foundational Phase**: 15 tasks can run in parallel
- **User Story 1**: 18 tasks can run in parallel
- **User Story 2**: 6 tasks can run in parallel
- **Polish Phase**: Most tasks can run in parallel

### Independent Test Criteria

- **US1**: Submit query "quantum computing의 최신 발전 동향은?" → Receive structured answer with 3+ sources from Google and arXiv
- **US2**: Submit query → See 4 agent cards updating in real-time → Expand each card to see detailed progress
- **US3**: Ask "quantum computing 설명해줘" → Then ask "좀 더 구체적으로" → Second answer references first question
- **US4**: Select "arXiv only" → Submit query → Verify only arXiv papers in results

---

## Validation Checklist

All tasks follow the required format:
- ✅ Every task has checkbox `- [ ]`
- ✅ Every task has sequential ID (T001-T101)
- ✅ Parallelizable tasks marked with [P]
- ✅ User story tasks labeled [US1], [US2], [US3], [US4]
- ✅ Every task has exact file path in description
- ✅ Tasks organized by user story phases
- ✅ Each phase has clear goal and test criteria
- ✅ Dependencies documented
- ✅ Parallel opportunities identified
- ✅ MVP scope defined (Phase 1 + 2 + 3)
