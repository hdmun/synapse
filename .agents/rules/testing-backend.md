---
trigger: model_decision
description: Bun Test 및 Fastify app.inject를 활용한 백엔드 라우트 및 데이터베이스 테스트 규칙
---

# Backend Testing Strategy

## Core Principles
- **Behavior over Implementation:** Test what the code does, not how it does it. Refactoring internal logic shouldn't break tests if the input/output remains the same.
- **Co-location:** Test files must reside next to the files they test (e.g., `watcher.ts` -> `watcher.test.ts`).

## Backend (Bun Test)
- Use `bun test` natively. Ensure `NODE_ENV=test`.
- **API Tests:** Test Fastify routes using `app.inject()`. This simulates HTTP requests without binding to a port, making tests faster and parallelizable. Assert on HTTP status codes and parsed JSON bodies.
- **Database Tests:** Prefer running queries against a localized, isolated test database (e.g., an in-memory SQLite DB for tests) over heavily mocking Drizzle ORM, as mocking ORMs often hides critical integration bugs.
