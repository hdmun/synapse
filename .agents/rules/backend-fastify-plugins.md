---
trigger: model_decision
description: Fastify 플러그인 생태계와 전역 에러 핸들링 규칙
---

# Backend Fastify Plugins & Errors

## Plugin Ecosystem
- If a custom plugin requires modifying the global Fastify instance (e.g., decorators, socket.io attachments), you must install and use the `fastify-plugin` package to wrap it.
- This ensures plugins don't leak out of their intended encapsulation scope.

## Error Handling
- Never throw generic `Error` strings.
- Create and throw custom error classes (e.g., `NotFoundError`, `UnauthorizedError`) from services.
- Use a global Fastify error handler (`fastify.setErrorHandler`) to catch these custom classes and map them to appropriate HTTP status codes cleanly.
