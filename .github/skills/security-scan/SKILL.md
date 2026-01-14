---
name: security-scan
description: Python 프로젝트 보안 취약점 스캔 및 보안 강화 가이드
version: 1.0.0
tags:
  - python
  - security
  - vulnerability
  - scanning
  - SAST
author: deep-research-MAF
---

# Security Scan Skill

## Overview
Python 프로젝트의 보안 취약점 검사, 민감 정보 탐지, 보안 모범 사례 적용 가이드

## Security Scanning Tools

### 1. Bandit (SAST)
Python 코드 보안 취약점 정적 분석

#### 설치
```bash
uv add --dev bandit

# 또는 uvx로 직접 실행 (설치 없이)
uvx bandit -r backend/src
```

#### 기본 사용법
```bash
# 전체 프로젝트 스캔
bandit -r backend/src

# 심각도 레벨 설정 (low, medium, high)
bandit -r backend/src -ll

# 결과를 JSON으로 저장
bandit -r backend/src -f json -o security-report.json

# 특정 테스트만 실행
bandit -r backend/src -t B201,B301

# 특정 테스트 제외
bandit -r backend/src -s B101
```

#### Configuration (.bandit)
```yaml
# .bandit
exclude_dirs:
  - /tests
  - /venv
  - /.venv

tests:
  - B201  # Flask debug mode
  - B301  # Pickle usage
  - B302  # Marshal usage
  - B303  # MD5/SHA1 usage
  - B304  # Insecure cipher
  - B305  # Insecure cipher mode
  - B306  # Insecure mktemp usage
  - B307  # eval usage
  - B308  # mark_safe usage
  - B309  # HTTPSConnection
  - B310  # URL open
  - B311  # Random usage
  - B312  # Telnet usage
  - B313  # XML vulnerabilities
  - B314  - B320  # XML vulnerabilities
  - B321  # FTP usage
  - B323  # Unverified context
  - B324  # Insecure hash
  - B401  - B413  # Import checks
  - B501  - B509  # Certificate/SSL checks
  - B601  - B612  # Shell injection
  - B701  # Jinja2 autoescape
```

### 2. Safety
의존성 패키지 취약점 검사

```bash
uv add --dev safety

# 설치된 패키지 검사
safety check

# requirements.txt 검사
safety check -r requirements.txt

# JSON 출력
safety check --json

# 전체 보고서
safety check --full-report
```

### 3. Pip-audit
PyPI 패키지 보안 감사

```bash
uv add --dev pip-audit

# 현재 환경 검사
pip-audit

# requirements.txt 검사
pip-audit -r requirements.txt

# 취약점 자동 수정
pip-audit --fix

# JSON 형식 출력
pip-audit --format json
```

### 4. Semgrep
고급 정적 분석 (SAST)

```bash
# Docker로 실행
docker run -v $(pwd):/src returntocorp/semgrep semgrep --config=auto /src

# 또는 설치
uv add --dev semgrep

# Python 보안 규칙으로 스캔
semgrep --config=p/python backend/src

# OWASP Top 10 체크
semgrep --config=p/owasp-top-ten backend/src

# 커스텀 규칙
semgrep --config=.semgrep.yml backend/src
```

### 5. Trivy
컨테이너 이미지 및 파일시스템 스캔

```bash
# 설치 (macOS)
brew install aquasecurity/trivy/trivy

# 파일시스템 스캔
trivy fs backend/

# requirements.txt 스캔
trivy fs --scanners vuln requirements.txt

# Docker 이미지 스캔
trivy image your-image:tag

# 심각도 필터
trivy fs --severity HIGH,CRITICAL backend/
```

## Common Security Issues

### 1. Hardcoded Secrets

#### ❌ Bad
```python
API_KEY = "sk-1234567890abcdef"
DATABASE_URL = "postgresql://user:password@localhost/db"
```

#### ✅ Good
```python
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not API_KEY:
    raise ValueError("API_KEY environment variable is required")
```

#### Detection
```bash
# Detect-secrets
uv add --dev detect-secrets
detect-secrets scan > .secrets.baseline
detect-secrets audit .secrets.baseline

# TruffleHog
docker run -it -v "$PWD:/pwd" trufflesecurity/trufflehog:latest filesystem /pwd
```

### 2. SQL Injection

#### ❌ Bad
```python
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
```

#### ✅ Good
```python
def get_user(user_id: int):
    query = "SELECT * FROM users WHERE id = %s"
    cursor.execute(query, (user_id,))
```

### 3. Command Injection

#### ❌ Bad
```python
import os
os.system(f"ls {user_input}")
```

#### ✅ Good
```python
import subprocess
subprocess.run(["ls", user_input], check=True, capture_output=True)
```

### 4. Insecure Deserialization

#### ❌ Bad
```python
import pickle
data = pickle.loads(untrusted_data)
```

#### ✅ Good
```python
import json
data = json.loads(trusted_data)
```

### 5. Weak Cryptography

#### ❌ Bad
```python
import hashlib
hashlib.md5(password.encode()).hexdigest()
```

#### ✅ Good
```python
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
```

## Security Best Practices

### 1. Environment Variables

```python
# .env (never commit to git)
AZURE_OPENAI_KEY=your-key-here
BING_API_KEY=your-key-here

# .gitignore
.env
.env.local
*.key
*.pem
```

### 2. Input Validation

```python
from pydantic import BaseModel, validator, Field

class Query(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    
    @validator('text')
    def validate_text(cls, v):
        # Sanitize input
        if '<script>' in v.lower():
            raise ValueError('Invalid characters detected')
        return v.strip()
```

### 3. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/query")
@limiter.limit("10/minute")
async def query_endpoint(request: Request):
    pass
```

### 4. CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # Not "*"
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### 5. Security Headers

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# HTTPS redirect
app.add_middleware(HTTPSRedirectMiddleware)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com"]
)

# Custom security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response
```

## Security Scanning Workflow

### 1. Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/PyCQA/bandit
    rev: '1.7.5'
    hooks:
      - id: bandit
        args: ['-r', 'backend/src']

  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### 2. CI/CD Pipeline

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install UV
        run: pip install uv
      
      - name: Run Bandit
        run: |
          uv add --dev bandit
          bandit -r backend/src -f json -o bandit-report.json
      
      - name: Run Safety
        run: |
          uv add --dev safety
          safety check --json
      
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: |
            bandit-report.json
            trivy-report.json
```

### 3. Regular Scans

```bash
#!/bin/bash
# security-scan.sh

echo "🔍 Running security scans..."

echo "📦 Checking dependencies..."
pip-audit

echo "🔐 Scanning code..."
bandit -r backend/src -ll

echo "🕵️ Detecting secrets..."
detect-secrets scan --baseline .secrets.baseline

echo "📊 Trivy scan..."
trivy fs --severity HIGH,CRITICAL .

echo "✅ Security scan complete!"
```

## Vulnerability Management

### 1. Severity Levels
- **CRITICAL**: Immediate action required
- **HIGH**: Fix within 7 days
- **MEDIUM**: Fix within 30 days
- **LOW**: Fix when convenient

### 2. Response Process
1. **Identify**: Run security scans
2. **Assess**: Determine impact and severity
3. **Fix**: Update dependencies or patch code
4. **Verify**: Re-scan to confirm fix
5. **Document**: Record in security log

### 3. Security Checklist

- [ ] No hardcoded secrets in code
- [ ] All dependencies up to date
- [ ] No known vulnerabilities in dependencies
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Logging and monitoring enabled
- [ ] Regular security scans scheduled
- [ ] .env files in .gitignore

## Quick Commands

```bash
# Complete security scan
bandit -r backend/src -ll
safety check
pip-audit
detect-secrets scan

# Fix vulnerabilities
pip-audit --fix
safety check --json | safety review

# Generate reports
bandit -r backend/src -f json -o security-report.json
trivy fs --format json --output trivy-report.json .
```

## References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Python Security Best Practices](https://python.readthedocs.io/en/stable/library/security_warnings.html)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
