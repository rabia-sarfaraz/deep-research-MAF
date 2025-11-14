# Feature Specification: Deep Research Agent with Multi-Agent Workflow

**Feature Branch**: `001-deep-research-agent`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description: "구글서치와 arxiv서치를 통해 딥 리서치 에이전트를 구현할꺼야. 백엔드는 microsoft agent framework 라이브러리를 사용하여 Plan(Reasoning), research, Reflect, 콘텐츠 작성 방식의 멀티에이전트로 구성해. 워크플로우 작성 시 스테이트 관리해야 하고 스레드를 통해 멀티턴 대화가 가능해야해. 프론트는 모던한 느낌으로 구현하되, 각 멀티에이전트들이 작업하고 소통하는 과정을 화면에 보여줘야해. 이 과정은 접었다 펼수 있는 ui로 구성해야해. uv로 셋업해줘. 라이브러리는 constitution.md에 정의된 원칙과 패턴을 따라야해."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 연구 질문에 대한 종합적인 답변 받기 (Priority: P1)

사용자는 복잡한 연구 질문을 입력하면, 시스템이 Google 검색과 arXiv 논문 검색을 통해 관련 정보를 수집하고, 이를 종합하여 체계적인 답변을 제공받습니다.

**Why this priority**: 이것이 Deep Research Agent의 핵심 가치 제안이며, 사용자가 기대하는 주요 기능입니다. 이 기능만으로도 독립적인 MVP가 됩니다.

**Independent Test**: 사용자가 "quantum computing의 최신 발전 동향은?"과 같은 질문을 입력하면, 검색 결과를 기반으로 구조화된 답변을 받을 수 있는지 테스트할 수 있습니다.

**Acceptance Scenarios**:

1. **Given** 사용자가 메인 화면에 접속했을 때, **When** 연구 질문을 입력하고 제출하면, **Then** 시스템이 검색을 시작하고 진행 상태를 화면에 표시함
2. **Given** 검색이 완료되었을 때, **When** 시스템이 정보를 분석하면, **Then** 사용자에게 출처가 명시된 종합 답변이 제공됨
3. **Given** 답변이 생성되었을 때, **When** 사용자가 답변을 확인하면, **Then** Google 검색 결과와 arXiv 논문 출처가 함께 표시됨

---

### User Story 2 - 멀티에이전트 작업 과정 실시간 모니터링 (Priority: P1)

사용자는 백그라운드에서 각 에이전트(Planning, Research, Reflect, Content Writing)가 어떤 작업을 수행하고 있는지 실시간으로 확인할 수 있으며, 각 단계의 결과물을 확인할 수 있습니다.

**Why this priority**: 투명성과 신뢰성을 제공하는 핵심 차별화 기능입니다. 사용자가 AI의 사고 과정을 이해할 수 있게 합니다.

**Independent Test**: 질문을 입력한 후, UI에서 각 에이전트의 작업 상태와 중간 결과물을 확인할 수 있는지 테스트할 수 있습니다.

**Acceptance Scenarios**:

1. **Given** 연구 질문이 처리 중일 때, **When** 사용자가 화면을 확인하면, **Then** Planning Agent, Research Agent, Reflect Agent, Content Writing Agent의 현재 상태가 표시됨
2. **Given** 각 에이전트가 작업을 완료했을 때, **When** 사용자가 해당 에이전트 섹션을 클릭하면, **Then** 접혔던 세부 내용이 펼쳐지며 에이전트의 작업 결과와 사고 과정이 표시됨
3. **Given** 에이전트들이 서로 소통하고 있을 때, **When** 사용자가 모니터링 패널을 확인하면, **Then** 에이전트 간 메시지 교환 내용이 시각적으로 표시됨

---

### User Story 3 - 대화 이력을 통한 후속 질문 (Priority: P2)

사용자는 이전 질문과 답변의 맥락을 유지하면서 후속 질문을 할 수 있으며, 시스템은 이전 대화 내용을 참조하여 더 정확한 답변을 제공합니다.

**Why this priority**: 단순 일회성 질의응답을 넘어서 연구 워크플로우를 지원하는 기능으로, 사용자 경험을 크게 향상시킵니다.

**Independent Test**: 첫 질문 후 답변을 받고, "좀 더 구체적으로 설명해줘" 또는 "이것과 관련된 최신 논문은?"과 같은 후속 질문을 했을 때 맥락이 유지되는지 테스트할 수 있습니다.

**Acceptance Scenarios**:

1. **Given** 사용자가 첫 번째 질문에 대한 답변을 받았을 때, **When** 후속 질문을 입력하면, **Then** 시스템이 이전 대화 맥락을 참조하여 답변을 생성함
2. **Given** 여러 번의 대화가 진행되었을 때, **When** 사용자가 대화 이력을 확인하면, **Then** 시간순으로 정렬된 모든 질문과 답변을 볼 수 있음
3. **Given** 긴 대화 세션이 진행 중일 때, **When** 사용자가 새로운 주제로 전환하고 싶으면, **Then** 새 대화 세션을 시작할 수 있는 옵션이 제공됨

---

### User Story 4 - 검색 소스 선택 및 필터링 (Priority: P3)

사용자는 질문에 따라 Google 검색만 사용할지, arXiv 논문만 검색할지, 또는 둘 다 사용할지 선택할 수 있습니다.

**Why this priority**: 유용한 기능이지만 초기에는 기본값(둘 다 검색)으로도 충분히 작동합니다.

**Independent Test**: 설정 패널에서 검색 소스를 선택하고, 해당 소스만 사용하여 결과가 생성되는지 확인할 수 있습니다.

**Acceptance Scenarios**:

1. **Given** 사용자가 질문 입력 화면에 있을 때, **When** 검색 소스 옵션을 선택하면, **Then** Google 전용, arXiv 전용, 또는 통합 검색 중 선택할 수 있음
2. **Given** 특정 검색 소스가 선택되었을 때, **When** 연구 질문을 제출하면, **Then** 선택한 소스만 사용하여 검색이 수행됨
3. **Given** arXiv 전용 검색이 선택되었을 때, **When** 결과가 표시되면, **Then** 학술 논문 형식으로 정리된 결과가 제공됨

---

### Edge Cases

- 검색 결과가 전혀 없거나 관련성이 매우 낮은 경우 시스템은 어떻게 응답하는가?
- 에이전트 중 하나가 오류를 발생시키거나 응답하지 않을 때 워크플로우는 어떻게 처리하는가?
- 매우 긴 대화 세션으로 인해 컨텍스트가 제한을 초과할 경우 어떻게 관리하는가?
- 동시에 여러 사용자가 시스템을 사용할 때 스레드 격리가 보장되는가?
- 네트워크 지연이나 외부 API(Google, arXiv) 타임아웃이 발생할 경우 사용자에게 어떻게 피드백을 제공하는가?
- 사용자가 질문을 제출한 후 페이지를 새로고침하거나 브라우저를 닫았다가 다시 열었을 때 진행 중이던 작업 상태는 어떻게 되는가?

## Requirements *(mandatory)*

### Functional Requirements

#### 백엔드 요구사항

- **FR-001**: 시스템은 Microsoft Agent Framework를 사용하여 멀티에이전트 워크플로우를 구현해야 함
- **FR-002**: Planning Agent는 사용자 질문을 분석하고 검색 전략을 수립해야 함
- **FR-003**: Research Agent는 Google Search API와 arXiv API를 통해 관련 정보를 수집해야 함
- **FR-004**: Reflect Agent는 수집된 정보의 품질과 관련성을 평가하고 추가 검색이 필요한지 판단해야 함
- **FR-005**: Content Writing Agent는 수집된 정보를 종합하여 구조화된 답변을 생성해야 함
- **FR-006**: 시스템은 워크플로우 전반에 걸쳐 상태(state)를 관리하고 추적해야 함
- **FR-007**: 시스템은 스레드를 통한 멀티턴 대화를 지원해야 하며, 각 대화 세션은 독립적으로 관리되어야 함
- **FR-008**: 시스템은 Microsoft Agent Framework의 Group Chat 워크플로우 패턴을 사용하여 에이전트 간 통신을 구현해야 함
- **FR-009**: 시스템은 관찰가능성(observability)을 제공하여 디버깅과 모니터링이 가능해야 함
- **FR-010**: 모든 에이전트는 Custom Agent 패턴으로 구현되어야 함

#### 프론트엔드 요구사항

- **FR-011**: 사용자 인터페이스는 React를 사용하여 구현되어야 함
- **FR-012**: UI는 ChatGPT와 유사한 모던하고 세련된 디자인을 제공해야 함
- **FR-013**: 시스템은 각 에이전트의 작업 과정을 실시간으로 화면에 표시해야 함
- **FR-014**: 에이전트 작업 내용은 접었다 펼칠 수 있는 확장 가능한 섹션으로 표시되어야 함
- **FR-015**: 에이전트 간 통신과 상태 변화를 시각적으로 표현해야 함
- **FR-016**: 사용자는 질문과 답변의 이력을 시간순으로 확인할 수 있어야 함
- **FR-017**: UI는 반응형이어야 하며 데스크톱과 태블릿에서 잘 작동해야 함

#### 개발 환경 및 설정

- **FR-018**: 프로젝트는 uv를 사용하여 Python 의존성을 관리해야 함
- **FR-019**: 백엔드는 Python 3.12 이상 버전을 사용해야 함
- **FR-020**: 프론트엔드는 React 18 이상 버전을 사용해야 함
- **FR-021**: 코드는 constitution.md에 정의된 원칙과 패턴을 준수해야 함

#### 데이터 및 통합

- **FR-022**: 시스템은 Google Custom Search API를 통해 웹 검색을 수행해야 함
- **FR-023**: 시스템은 arXiv API를 통해 학술 논문을 검색해야 함
- **FR-024**: 모든 답변에는 출처 링크와 인용 정보가 포함되어야 함
- **FR-025**: 대화 세션 데이터는 사용자별로 격리되어 저장되어야 함

### Key Entities

- **Research Query (연구 질문)**: 사용자가 입력한 질문과 관련 메타데이터(타임스탬프, 검색 소스 선택 등)
- **Conversation Thread (대화 스레드)**: 연속된 질문과 답변으로 구성된 대화 세션, 각 스레드는 고유 ID와 상태를 가짐
- **Agent State (에이전트 상태)**: 각 에이전트의 현재 작업 상태, 진행률, 중간 결과물
- **Search Result (검색 결과)**: Google 또는 arXiv에서 가져온 개별 검색 결과, 제목, URL, 요약, 출처 정보 포함
- **Research Plan (연구 계획)**: Planning Agent가 생성한 검색 전략 및 단계별 계획
- **Synthesized Answer (종합 답변)**: Content Writing Agent가 생성한 최종 답변, 구조화된 텍스트와 인용 정보 포함
- **Agent Message (에이전트 메시지)**: 에이전트 간 통신 메시지, 발신자, 수신자, 메시지 내용, 타임스탬프 포함

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 사용자가 질문을 입력한 후 첫 번째 검색 결과가 표시되기까지 10초 이내 소요됨
- **SC-002**: 일반적인 연구 질문에 대해 종합 답변이 생성되기까지 60초 이내 완료됨
- **SC-003**: 멀티에이전트 작업 과정이 1초 미만의 지연으로 UI에 실시간 반영됨
- **SC-004**: 사용자가 후속 질문을 했을 때 시스템이 이전 대화 맥락을 참조하여 답변을 생성함 (맥락 유지율 90% 이상)
- **SC-005**: 생성된 답변에 최소 3개 이상의 출처(Google 또는 arXiv)가 포함됨
- **SC-006**: 동시에 10명의 사용자가 질문을 처리할 수 있으며, 각 사용자의 스레드는 독립적으로 관리됨
- **SC-007**: 에이전트 간 통신 과정이 UI에서 시각적으로 명확하게 표현됨 (사용자 이해도 테스트에서 80% 이상 긍정적 평가)
- **SC-008**: 시스템 오류 발생 시 사용자에게 명확한 오류 메시지와 복구 옵션이 제공됨

## Assumptions

- Google Custom Search API와 arXiv API는 안정적으로 사용 가능하며, 적절한 API 키와 사용량 제한이 설정되어 있음
- 사용자는 데스크톱 또는 태블릿 브라우저를 통해 접속하며, 모바일 최적화는 초기 버전에서 제외됨
- 단일 연구 질문의 최대 처리 시간은 2분으로 제한되며, 초과 시 부분 결과를 반환함
- Azure OpenAI API는 에이전트 구현에 사용되며, API 비용과 속도는 합리적 범위 내에 있음
- 초기 버전에서는 사용자 인증 및 개인화 기능이 제외되며, 모든 사용자는 익명으로 사용함
- 대화 이력은 세션 기반으로 관리되며, 브라우저를 닫으면 이력이 삭제됨 (영구 저장은 향후 기능)
- Microsoft Agent Framework는 필요한 모든 기능(Custom Agent, Group Chat, Multi-turn, State Management, Observability)을 제공함
- 개발 환경은 macOS 또는 Linux이며, Windows는 WSL을 통해 지원됨

## Dependencies

- Microsoft Agent Framework 라이브러리 및 관련 문서
- Google Custom Search API 계정 및 API 키
- arXiv API 접근 (인증 불필요, 공개 API)
- Azure OpenAI API (에이전트 구현용 - gpt-35-turbo 또는 gpt-4 배포)
- React 개발 환경 및 관련 라이브러리 (React Router, 상태 관리 라이브러리 등)
- uv 패키지 관리자

## Out of Scope (초기 버전)

- 사용자 인증 및 계정 관리
- 대화 이력 영구 저장 (데이터베이스)
- 모바일 앱 또는 모바일 최적화 UI
- PDF 다운로드 또는 결과 내보내기 기능
- 고급 필터링 (날짜 범위, 저자, 인용 횟수 등)
- 다국어 지원 (초기에는 한국어/영어만 지원)
- 결과에 대한 평가 및 피드백 시스템
- 협업 기능 (여러 사용자가 같은 연구 세션 공유)
