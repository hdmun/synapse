---
trigger: model_decision
description: Conventional Commits 커밋 규격, 환경 변수 보안 및 빌드 검증 프로세스 규칙
---

# 프로젝트 워크플로우 및 보안 규칙 (Project Workflow & Security)

## Git 및 커밋 규칙 (Git & Commits)
- **커밋 도구**: 일관성을 보장하기 위해 가능한 경우 `git-staged-commit` 스킬을 활용하세요.
- **표준 규격**: [Conventional Commits](https://www.conventionalcommits.org/) 규칙을 준수하세요.
  - `feat`: 새로운 기능 추가.
  - `fix`: 버그 수정.
  - `docs`: 문서 변경만 있는 경우.
  - `style`: 코드 포맷팅, 세미콜론 누락 등 코드 동작에 영향을 주지 않는 변경.
  - `refactor`: 버그 수정이나 새 기능 추가가 아닌 코드 구조 개선.
  - `test`: 누락된 테스트 추가 또는 기존 테스트 수정.
  - `chore`: 빌드 업무 수정, 패키지 매니저 설정 변경 등.

## 환경 변수 관리 (Environment Variables)
- **보안 (Security)**: `.env` 파일이나 시크릿(비밀값)이 포함된 파일을 절대 커밋하지 마세요. `.gitignore`에 등록되어 있는지 반드시 확인하세요.
- **백엔드 (Backend)**: 변수 로드를 위해 `dotenv`를 사용하고, `process.env`를 통해 접근하세요.
- **프론트엔드 (Frontend)**: 클라이언트 환경 변수는 반드시 `VITE_` 접두사를 붙여야 합니다(예: `VITE_API_URL`). 접근 시 `import.meta.env`를 사용하세요.
- **유효성 검증 (Validation)**: 애플리케이션 시작 시 환경 변수의 유효성을 검증할 때 Zod 사용을 권장합니다.

## 빌드 및 분석 (Build & Analysis)
- **번들 크기 분석 (Bundle Analysis)**: 번들 크기 모니터링을 위해 프론트엔드의 주요 릴리스 전 `bun run analyze`(`vite build --mode analyze` 실행)를 구동해 점검하세요.
- **프로덕션 빌드 (Production Build)**: shared 또는 frontend 코드에 유의미한 변경이 발생한 후에는 항상 `bun run build`를 로컬에서 실행하여 빌드가 정상 작동하는지 검증하세요.
