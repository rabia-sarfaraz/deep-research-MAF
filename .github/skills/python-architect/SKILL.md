---
name: python-architect
description: Python 프로젝트 아키텍처 분석 및 설계 검토 가이드
version: 1.0.0
tags:
  - python
  - architecture
  - design-patterns
  - best-practices
author: deep-research-MAF
---

# Python Architecture Analysis Skill

## Overview
Python 프로젝트의 아키텍처 분석, 설계 패턴 검토, 구조 개선을 위한 가이드

## Architecture Analysis Tools

### 1. Dependency Analysis

#### PyDepTree
의존성 트리 시각화

```bash
uv add --dev pipdeptree
pipdeptree
pipdeptree --graph-output png > dependencies.png

# 또는 uvx로 직접 실행
uvx pipdeptree
```

#### PyReverse (Pylint)
UML 다이어그램 생성

```bash
uv add --dev pylint
pyreverse -o png backend/src
# 생성된 파일: classes.png, packages.png

# 또는 uvx로 직접 실행
uvx pylint pyreverse -o png backend/src
```

### 2. Code Metrics

#### Radon
코드 복잡도 측정

```bash
uv add --dev radon

# Cyclomatic Complexity (CC)
radon cc backend/src -a -s

# Maintainability Index (MI)
radon mi backend/src -s

# Raw metrics (LOC, LLOC, SLOC)
radon raw backend/src -s
```

**복잡도 등급:**
- A: 1-5 (Simple)
- B: 6-10 (Well structured)
- C: 11-20 (Slightly complex)
- D: 21-30 (More complex)
- E: 31-40 (Complex)
- F: 41+ (Extremely complex)

#### Prospector
종합 코드 품질 분석

```bash
uv add --dev prospector
prospector backend/src

# 또는 uvx로 직접 실행
uvx prospector backend/src
```

### 3. Architecture Visualization

#### py2puml
PlantUML 다이어그램 생성

```bash
uv add --dev py2puml
py2puml backend/src backend.models > models.puml

# 또는 uvx로 직접 실행
uvx py2puml backend/src backend.models > models.puml
```

#### pydeps
모듈 의존성 그래프

```bash
uv add --dev pydeps
pydeps backend/src --max-bacon 2 -o dependencies.svg

# 또는 uvx로 직접 실행
uvx pydeps backend/src --max-bacon 2 -o dependencies.svg
```

## Architecture Patterns

### 1. Layered Architecture (현재 프로젝트)

```
backend/src/
├── main.py              # Entry point
├── api/                 # Presentation Layer
│   ├── routes.py
│   └── middleware.py
├── workflows/           # Application Layer
│   └── group_chat.py
├── agents/              # Domain Layer
│   ├── planning_agent.py
│   ├── research_agent.py
│   └── content_agent.py
├── services/            # Infrastructure Layer
│   ├── azure_openai_service.py
│   └── bing_grounding_search.py
└── models/              # Domain Models
    └── query.py
```

**체크리스트:**
- [ ] 각 레이어 간 의존성 방향이 올바른가?
- [ ] 순환 의존성이 없는가?
- [ ] 각 레이어의 책임이 명확한가?

### 2. Repository Pattern

```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class Repository(ABC, Generic[T]):
    """Base repository interface."""
    
    @abstractmethod
    async def get(self, id: str) -> Optional[T]:
        """Get entity by ID."""
        pass
    
    @abstractmethod
    async def save(self, entity: T) -> T:
        """Save entity."""
        pass
    
    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Delete entity."""
        pass
```

### 3. Service Layer Pattern

```python
class ResearchService:
    """
    Service layer for research operations.
    Orchestrates multiple agents and repositories.
    """
    
    def __init__(
        self,
        planning_agent: PlanningAgent,
        research_agent: ResearchAgent,
        search_service: SearchService
    ):
        self.planning_agent = planning_agent
        self.research_agent = research_agent
        self.search_service = search_service
    
    async def conduct_research(self, query: str) -> ResearchResult:
        """Coordinate research workflow."""
        plan = await self.planning_agent.create_plan(query)
        results = await self.research_agent.execute(plan)
        return results
```

### 4. Dependency Injection

```python
# Using FastAPI's Depends
from fastapi import Depends

def get_azure_service() -> AzureOpenAIService:
    """Dependency factory."""
    return AzureOpenAIService()

@app.post("/research")
async def research(
    query: Query,
    azure_service: AzureOpenAIService = Depends(get_azure_service)
):
    """Endpoint with DI."""
    return await azure_service.process(query)
```

## Architecture Review Checklist

### 1. SOLID Principles

#### Single Responsibility Principle
```python
# ❌ Bad: Multiple responsibilities
class UserManager:
    def save_user(self, user): pass
    def send_email(self, user): pass
    def generate_report(self, user): pass

# ✅ Good: Single responsibility
class UserRepository:
    def save(self, user): pass

class EmailService:
    def send(self, user): pass

class ReportGenerator:
    def generate(self, user): pass
```

#### Open/Closed Principle
```python
# ✅ Good: Open for extension, closed for modification
from abc import ABC, abstractmethod

class SearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str) -> list:
        pass

class BingSearch(SearchProvider):
    async def search(self, query: str) -> list:
        # Bing implementation
        pass

class GoogleSearch(SearchProvider):
    async def search(self, query: str) -> list:
        # Google implementation
        pass
```

#### Dependency Inversion Principle
```python
# ✅ Good: Depend on abstractions
class ResearchWorkflow:
    def __init__(self, search_provider: SearchProvider):
        self.search = search_provider  # Abstract interface
```

### 2. Module Organization

```python
# Check module cohesion
radon raw backend/src -s
radon cc backend/src -a -s
```

**Guidelines:**
- 모듈 크기: 300-500 LOC 권장
- 함수 복잡도: CC < 10 권장
- 클래스 복잡도: CC < 20 권장

### 3. Circular Dependencies

```bash
# Check for circular imports
pydeps backend/src --max-bacon 2 --show-cycles
```

### 4. Coupling & Cohesion

#### Low Coupling
```python
# ✅ Good: Loose coupling via interfaces
class Agent:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
```

#### High Cohesion
```python
# ✅ Good: Related functionality grouped
class SearchService:
    def search(self): pass
    def filter_results(self): pass
    def rank_results(self): pass
```

## Architecture Documentation

### 1. ADR (Architecture Decision Records)

```markdown
# ADR-001: Use FastAPI for API Layer

## Status
Accepted

## Context
Need a modern Python web framework for async API endpoints.

## Decision
Use FastAPI for REST and WebSocket endpoints.

## Consequences
- Automatic OpenAPI documentation
- Native async/await support
- Type validation with Pydantic
```

### 2. C4 Model

#### Level 1: System Context
```python
"""
System: Deep Research Agent
Users: Researchers, Data Analysts
External Systems: Azure OpenAI, Bing Search API
"""
```

#### Level 2: Container Diagram
```
[Frontend (React)] ---> [Backend API (FastAPI)] ---> [Azure OpenAI]
                                                 ---> [Bing Search]
```

#### Level 3: Component Diagram
```
API Layer (routes, middleware)
    ↓
Workflow Layer (group_chat)
    ↓
Agent Layer (planning, research, content)
    ↓
Service Layer (azure_openai, search)
```

## Code Quality Metrics

### 1. Maintainability Index

```bash
radon mi backend/src -s
```

**Interpretation:**
- 100-20: High maintainability
- 19-10: Medium maintainability
- 9-0: Low maintainability

### 2. Technical Debt

```bash
# Using prospector
prospector backend/src --strictness veryhigh

# Using SonarQube (if available)
sonar-scanner \
  -Dsonar.projectKey=deep-research-maf \
  -Dsonar.sources=backend/src
```

## Refactoring Patterns

### 1. Extract Method
```python
# Before
def process_query(query):
    # 50 lines of code
    pass

# After
def process_query(query):
    validated_query = validate_query(query)
    plan = create_plan(validated_query)
    results = execute_plan(plan)
    return format_results(results)

def validate_query(query): pass
def create_plan(query): pass
def execute_plan(plan): pass
def format_results(results): pass
```

### 2. Replace Conditional with Polymorphism
```python
# Before
def search(provider, query):
    if provider == "bing":
        return bing_search(query)
    elif provider == "google":
        return google_search(query)

# After
class SearchProvider(ABC):
    @abstractmethod
    def search(self, query): pass

class BingProvider(SearchProvider):
    def search(self, query): pass

class GoogleProvider(SearchProvider):
    def search(self, query): pass
```

## Quick Commands

```bash
# Architecture analysis
pydeps backend/src --max-bacon 2 -o arch.svg
pyreverse -o png backend/src

# Code metrics
radon cc backend/src -a -s
radon mi backend/src -s

# Dependency tree
pipdeptree

# Comprehensive analysis
prospector backend/src
```

## References
- [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Python Design Patterns](https://refactoring.guru/design-patterns/python)
- [Cosmic Python - Architecture Patterns](https://www.cosmicpython.com/)
