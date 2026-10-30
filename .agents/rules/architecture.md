---
trigger: model_decision
description: 모노레포 폴더 구조, 경계 규칙 및 패키지 관리 규칙
---

# 아키텍처 및 모노레포 경계 (Architecture & Monorepo Boundaries)

## 프로젝트 구조 (Project Structure)
이 프로젝트는 Bun 워크스페이스 기반 모노레포입니다. 패키지 간 엄격한 경계 규칙이 적용됩니다:
- **`packages/backend`**: 서버 사이드 Fastify API 및 데이터 수집·적재(Ingester) 로직.
- **`packages/frontend`**: Vite를 사용하는 React SPA UI 클라이언트.
- **`packages/shared`**: 공용 Zod 스키마, TypeScript 타입, 경로 설정, 메시징 유틸리티.
- **`packages/collector`**: 에이전트로부터 원시 데이터를 수집하는 독립 데몬.

## 공통 규칙 (Shared Conventions)
1. **단일 진실 공급원 (SSOT, Single Source of Truth)**: 모든 데이터 모델(Zod 스키마), TypeScript 타입, 공유 설정은 `packages/shared`에 정의합니다.
2. **순수 함수 (Pure Functions)**: 공유 유틸리티는 순수 함수여야 하며, 가드(guard) 없이 플랫폼 전용 전역 객체(`window`, `process` 등)에 접근해서는 안 됩니다.

## 경계 격리 규칙 (Boundary Rules)
1. **프론트엔드 격리 (Frontend Isolation)**: `packages/frontend`의 코드는 `packages/backend` 또는 `packages/collector`에서 가져오기(import)를 **절대 해서는 안 됩니다**.
2. **백엔드 격리 (Backend Isolation)**: `packages/backend`의 코드는 `packages/frontend` 또는 `packages/collector`에서 가져오기(import)를 **절대 해서는 안 됩니다**.
3. **컬렉터 격리 (Collector Isolation)**: `packages/collector`의 코드는 `packages/frontend` 또는 `packages/backend`에서 가져오기(import)를 **절대 해서는 안 됩니다**.
4. **공유 모듈 임포트 (Shared Imports)**: Frontend, Backend, Collector 패키지는 타입과 설정을 공유할 때 반드시 `@synapse/shared`를 통해 가져와야 합니다. 패키지 간 직접적인 상대 경로 import는 허용되지 않습니다.

## 패키지 관리 (Package Management)
- **도구**: Bun workspace.
- **스크립트**: 루트에서 `bun install`을 실행합니다. 개별 패키지 스크립트는 `--filter` 워크스페이스 플래그를 사용합니다.
