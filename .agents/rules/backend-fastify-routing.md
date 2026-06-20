---
trigger: model_decision
description: Fastify 라우팅, 컨트롤러 구조 및 Zod 유효성 검사 규칙
---

# Backend Fastify Routing & Validation

## Routing & Controllers
- Keep route declarations in `src/backend/routes/`.
- Routes should be extremely thin: Handle parameter extraction, pass to a service layer, and return the formatted response.
- Business logic MUST be abstracted into `src/backend/services/`.

## Validation
- Since Fastify natively uses Ajv (JSON Schema) and a Zod type provider is not installed by default, do NOT inject Zod schemas directly into Fastify's route `schema` object.
- Instead, validate requests using Zod's `.parse()` or `.safeParse()` inside the route handler (or a `preHandler` hook) and throw appropriate custom errors for bad requests.
