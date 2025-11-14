# [PROJECT_NAME] Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->
딥리서치 chat gpt서비스를 구글 서치와 arxiv 논문검색을 통해서 수행하는 AI 에이전트를 구현합니다.
멀티에이전트 워크플로우를 통해서 Reasoning & Planning, 검색, 비평, 요약, 응답생성 등의 기능을 수행합니다.

## Core Principles

### [PRINCIPLE_1_NAME]
<!-- Example: I. Library-First -->
[PRINCIPLE_1_DESCRIPTION]
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->
Microsoft Agent Framework 라이브러리를 사용해서 에이전트, 멀티에이전트 워크플로우, 스레드관리를 구현합니다. 아래 링크의 샘플을 최대한 참고합니다.

에이전트는 https://learn.microsoft.com/ko-kr/agent-framework/user-guide/agents/agent-types/custom-agent?pivots=programming-language-python 를 참고하여 Custom Agent로 구현합니다.
워크플로우는 https://learn.microsoft.com/ko-kr/agent-framework/user-guide/workflows/orchestrations/group-chat?pivots=programming-language-python 를 참고하여 Group Chat 워크플로우로 구현합니다.
스레드관리는 https://learn.microsoft.com/ko-kr/agent-framework/user-guide/agents/multi-turn-conversation?pivots=programming-language-python#practical-multi-turn-example 를 참고하여 멀티턴 대화로 구현합니다.
관찰가능성은 https://learn.microsoft.com/ko-kr/agent-framework/user-guide/workflows/observability#enable-observability 를 참고하여 구현합니다.
워크플로우내 스테이트 관리는 https://learn.microsoft.com/ko-kr/agent-framework/user-guide/workflows/shared-states?pivots=programming-language-python#writing-to-shared-states 를 참고하여 구현합니다.

### [PRINCIPLE_2_NAME]
<!-- Example: II. CLI Interface -->
[PRINCIPLE_2_DESCRIPTION]
화면이 세련되고 모던한 느낌의 챗GPT 스타일의 UI를 구현합니다. Frontend 프레임워크로는 React를 사용합니다.

### [PRINCIPLE_3_NAME]
<!-- Example: III. Test-First (NON-NEGOTIABLE) -->
[PRINCIPLE_3_DESCRIPTION]
테스트코드는 지금 작성하지 마세요. 각 문서의 구조는 영어를 유지하되 콘텐츠 내용은 한글로 작성합니다.

### [PRINCIPLE_4_NAME]
<!-- Example: IV. Integration Testing -->
[PRINCIPLE_4_DESCRIPTION]
통합테스트코드도 지금 작성하지 마세요>

### [PRINCIPLE_5_NAME]
<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
[PRINCIPLE_5_DESCRIPTION]
디버깅을 위해 obsearbility는 필수입니다.
https://github.com/microsoft/agent-framework/blob/main/python/samples/getting_started/observability/agent_observability.py 의 코드를 최대한 참고해서 구현하세요

## [SECTION_2_NAME]
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->
Python 3.12 이상 버전을 사용한 백엔드와 React 18 이상 버전을 사용한 프론트엔드로 구현합니다.
## [SECTION_3_NAME]
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
