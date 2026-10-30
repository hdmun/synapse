---
trigger: model_decision
description: 백엔드 Drizzle ORM의 Query Builder API 및 SQL 쿼리 작성 규칙
---

# 백엔드 Drizzle 쿼리 규칙 (Backend Drizzle Queries)

## 쿼리 작성 원칙 (Querying)
- 항상 Drizzle의 쿼리 빌더(Query Builder) API(`db.select().from(...)`, `db.query.tableName.findMany(...)`)를 사용하세요.
- Drizzle에서 지원하지 않는 고급 기능이 반드시 필요한 경우가 아니라면 템플릿 리터럴을 사용한 원시 SQL(Raw SQL) 문자열을 직접 작성하지 마세요. 이는 SQL 인젝션 공격을 방지하고 타입 안전성(Type Safety)을 유지하기 위함입니다.
