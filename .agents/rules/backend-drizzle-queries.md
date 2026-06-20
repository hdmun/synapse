---
trigger: model_decision
description: 백엔드 Drizzle ORM의 Query Builder API 및 SQL 쿼리 작성 규칙
---

# Backend Drizzle Queries

## Querying
- Always use Drizzle's Query Builder API (`db.select().from(...)`, `db.query.tableName.findMany(...)`).
- Do not write raw SQL strings using template literals unless absolutely necessary for advanced features unsupported by Drizzle. This prevents SQL injection and maintains type safety.
