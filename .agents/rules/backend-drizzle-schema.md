---
trigger: model_decision
description: Drizzle ORM 데이터베이스 스키마 정의 및 마이그레이션 규칙
---

# 백엔드 Drizzle 스키마 및 마이그레이션 규칙 (Backend Drizzle Schema & Migrations)

## 스키마 정의 (Schema Definition)
- 모든 데이터베이스 스키마는 `packages/backend/src/db/schema.ts`에 정의해야 합니다.
- 적절한 경우 관계형 쿼리(Relational queries)를 사용하세요. Drizzle의 `relations` 함수를 사용하여 테이블 간의 관계를 명시적으로 정의합니다.
- `drizzle-zod`는 프로젝트 기술 스택에 포함되어 있지 않으므로, 유효성 검증을 위해 Drizzle 테이블과 일치하는 Zod 스키마를 `packages/shared/src/schema.ts`에 수동으로 정의하세요. 정의된 스키마는 백엔드와 프론트엔드 전반에서 사용할 수 있도록 export합니다.

## 마이그레이션 (Migrations)
- 프로덕션 환경의 데이터베이스 스키마는 불변(immutable)으로 취급해야 합니다.
- `schema.ts`에 대한 모든 변경은 반드시 Drizzle Kit을 사용한 마이그레이션 생성을 수반해야 합니다.
- `drizzle-kit generate`를 실행하여 SQL 마이그레이션 파일을 생성하세요.
- 생성된 마이그레이션 SQL을 데이터베이스에 적용하기 전에 내용을 꼼꼼히 검증하세요.
