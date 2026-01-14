---
name: python-code-style
description: Python 코드 스타일 검사 및 품질 관리 가이드
version: 1.0.0
tags:
  - python
  - linting
  - code-quality
  - ruff
  - mypy
author: deep-research-MAF
---

# Python Code Style Check Skill

## Overview
Python 코드 스타일 검사 및 품질 관리를 위한 가이드

## Tools & Configuration

### 1. Ruff (권장)
현재 프로젝트에서 사용 중인 fast Python linter & formatter

#### 설치
```bash
# UV를 사용하여 dev 의존성으로 설치
uv add --dev ruff

# 또는 직접 실행 (설치 없이)
uvx ruff
```

#### 기본 사용법
```bash
# 코드 스타일 체크
ruff check .

# 자동 수정 가능한 문제 수정
ruff check . --fix

# 포맷팅
ruff format .

# 특정 파일/디렉토리 체크
ruff check backend/src
```

#### Configuration (pyproject.toml)
```toml
[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = [
    "E",  # pycodestyle errors
    "W",  # pycodestyle warnings
    "F",  # pyflakes
    "I",  # isort
    "B",  # flake8-bugbear
    "C4", # flake8-comprehensions
    "UP", # pyupgrade
]
ignore = [
    "E501",  # line too long
]

[tool.ruff.lint.isort]
known-first-party = ["src"]
```

### 2. Black (Alternative Formatter)
코드 포맷터로 사용 가능

```bash
uv add --dev black
black backend/src
black --check backend/src  # 체크만 (수정 안 함)

# 또는 uvx로 직접 실행
uvx black backend/src
```

### 3. Mypy (Type Checking)
타입 체킹

```bash
uv add --dev mypy
mypy backend/src

# 또는 uvx로 직접 실행
uvx mypy backend/src
```

#### Configuration (pyproject.toml)
```toml
[tool.mypy]
python_version = "3.12"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### 4. Pylint
상세한 코드 분석

```bash
uv add --dev pylint
pylint backend/src

# 또는 uvx로 직접 실행
uvx pylint backend/src
```

## Best Practices

### 코드 스타일 가이드라인

1. **PEP 8 준수**
   - 들여쓰기: 스페이스 4개
   - 최대 라인 길이: 88자 (Black 기본값) 또는 79자 (PEP 8)
   - 함수/클래스 간 공백: 2줄

2. **Import 정렬**
   ```python
   # Standard library imports
   import os
   import sys
   
   # Third-party imports
   import fastapi
   import pydantic
   
   # Local imports
   from src.models import Query
   from src.services import AzureOpenAIService
   ```

3. **타입 힌트 사용**
   ```python
   def process_query(query: str, max_results: int = 10) -> list[str]:
       """Process search query and return results."""
       results: list[str] = []
       return results
   ```

4. **Docstring 작성**
   ```python
   def complex_function(param1: str, param2: int) -> dict:
       """
       Brief description of the function.
       
       Args:
           param1: Description of param1
           param2: Description of param2
           
       Returns:
           Description of return value
           
       Raises:
           ValueError: When invalid input is provided
       """
       pass
   ```

## Pre-commit Integration

### Setup
```bash
uv add --dev pre-commit
```

### .pre-commit-config.yaml
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.13
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

### Install hooks
```bash
pre-commit install
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          pip install uv
          uv sync --dev
      - name: Run Ruff
        run: ruff check .
      - name: Run MyPy
        run: mypy backend/src
```

## Quick Commands

### 프로젝트 전체 체크
```bash
# 스타일 체크
ruff check .

# 타입 체크
mypy backend/src

# 자동 포맷팅
ruff format .
```

### 특정 파일 체크
```bash
ruff check backend/src/main.py
mypy backend/src/main.py
```

### 변경된 파일만 체크
```bash
git diff --name-only --cached | grep '\.py$' | xargs ruff check
```

## Common Issues & Solutions

### Issue 1: Import 순서 문제
```bash
ruff check --select I --fix .
```

### Issue 2: 사용하지 않는 import
```bash
ruff check --select F401 --fix .
```

### Issue 3: 라인 길이 초과
```bash
ruff format .  # 자동으로 포맷팅
```

## VS Code Integration

### settings.json
```json
{
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll": true,
      "source.organizeImports": true
    }
  },
  "ruff.lint.args": ["--config=backend/pyproject.toml"]
}
```

## References
- [PEP 8 – Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Type hints cheat sheet](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html)
