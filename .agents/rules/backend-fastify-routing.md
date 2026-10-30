---
trigger: model_decision
description: Fastify 라우팅, 컨트롤러 구조 및 Zod 유효성 검사 규칙
---

# 백엔드 Fastify 라우팅 및 검증 규칙 (Backend Fastify Routing & Validation)

## 라우팅 및 컨트롤러 구조 (Routing & Controllers)
- 라우트 선언은 `packages/backend/src/routes/`에 유지하세요.
- 라우트 핸들러는 매우 얇게(thin) 유지해야 합니다: 파라미터 추출, 서비스 계층으로의 전달, 포맷팅된 응답 반환 역할만 수행합니다.
- 비즈니스 로직은 반드시 `packages/backend/src/services/`로 추상화하여 분리해야 합니다.

## 요청 유효성 검증 (Validation)
- Fastify는 기본적으로 Ajv(JSON Schema)를 사용하며 Zod 타입 프로바이더가 기본 설치되어 있지 않으므로, Fastify 라우트의 `schema` 객체에 Zod 스키마를 직접 주입하지 마세요.
- 대신 라우트 핸들러 내부(또는 `preHandler` 훅)에서 Zod의 `.parse()` 또는 `.safeParse()`를 사용하여 요청을 검증하고, 잘못된 요청에 대해서는 적절한 커스텀 에러를 발생시키세요.
