# 🛠 백엔드 리팩토링 계획 (Backend Refactoring Plan)

## 1. 리팩토링 목표 (Goals)
본 리팩토링의 주된 목적은 현재 기능적으로 작동하지만 아키텍처적으로 미흡한 백엔드 시스템을 프로젝트의 규칙(Rules)에 맞게 개선하는 것입니다. 'Thin Routes', 명확한 비즈니스 로직 분리, 타입 안정성, 데이터베이스 성능 최적화 및 안정적인 인프라 구축을 목표로 합니다.

## 2. 주요 문제점 및 개선 방향 (Key Issues and Direction)
*   **아키텍처 위반:** `api.ts`에 라우팅, 복잡한 비즈니스 로직, 직접적인 DB 조작이 혼재되어 있습니다. 
    *   👉 **개선:** `Controller` 계층을 도입하고 비즈니스 로직을 전문화된 `Service`로 분리하여 'Thin Routes' 원칙을 준수합니다.
*   **데이터베이스 관리:** `initDb`에서 수동으로 SQL을 실행하여 Drizzle Kit 마이그레이션을 우회하고 있으며, Drizzle Relations가 정의되지 않아 N+1 쿼리 문제가 발생하고 있습니다.
    *   👉 **개선:** Drizzle Kit 마이그레이션을 초기화하고, `schema.ts`에 명시적인 Relation을 정의합니다.
*   **유효성 검사 및 타입 안정성:** Fastify 라우트에서 Zod를 활용한 유효성 검사가 누락되었으며, 서비스 계층(`Syncer` 등)에 `any` 타입이 남용되고 있습니다.
    *   👉 **개선:** 모든 라우트에 Zod를 적용하여 Params/Query를 검증하고, `any` 타입을 제거하여 타입 안정성을 확보합니다.
*   **성능 문제:** `Syncer`가 대용량 세션 파일 처리 시 트랜잭션 없이 순차적인 DB Insert를 수행하며, 라우트에서는 N+1 쿼리 패턴이 존재합니다.
    *   👉 **개선:** `Syncer`에 DB 트랜잭션 및 일괄 삽입(Batch Inserts)을 적용하고, Drizzle Relational Queries를 활용해 N+1 문제를 해결합니다.
*   **인프라 누락:** 전역 에러 핸들러 및 사용자 정의 커스텀 에러 클래스가 없으며, Socket.io가 Fastify 플러그인 형태로 적절히 통합되지 않았습니다.
    *   👉 **개선:** 전역 에러 핸들러 및 커스텀 에러 클래스를 구현하고, Socket.io를 Fastify 플러그인으로 리팩토링합니다.
*   **코드 중복:** 복잡한 메시지 내용에서 일반 텍스트 요약을 추출하는 로직이 `api.ts`와 `syncer.ts` 양쪽에 중복되어 있습니다.
    *   👉 **개선:** 해당 로직을 공유 유틸리티 함수로 분리하여 중복을 제거합니다.

---

## 3. 단계별 리팩토링 계획 (Phased Refactoring Plan)

### Phase 1: 데이터베이스 및 스키마 개선 (Database & Schema)
*   **Drizzle 설정 및 마이그레이션 도입:** 수동 SQL 테이블 생성 로직(`initDb`)을 제거하고 `drizzle-kit` 마이그레이션 워크플로우를 설정합니다.
*   **스키마 관계 정의:** `src/backend/db/schema.ts` 파일에 테이블 간의 명시적인 관계(Relations)를 정의합니다. (Project - Session - Message - Thought/ToolCall)

### Phase 2: 인프라 및 기반 유틸리티 구축 (Infra & Utilities)
*   **전역 에러 처리:** `CustomError` 클래스 계층을 생성하고 Fastify의 전역 `setErrorHandler`를 등록합니다.
*   **유틸리티 추출:** 메시지 요약(Summary) 텍스트 추출 로직을 분리하여 `src/backend/utils/message.ts` 등의 공통 유틸리티로 만듭니다.
*   **Socket.io 통합:** 기존 `app.ts`에 하드코딩된 Socket.io 초기화 코드를 Fastify 플러그인 형태(`fastify-socket.io` 등 활용 또는 커스텀 플러그인)로 분리합니다.

### Phase 3: 아키텍처 재편 및 비즈니스 로직 분리 (Architecture & Logic)
*   **컨트롤러 도입:** `src/backend/controllers/` 디렉토리를 생성하고 `api.ts`의 라우트 핸들러를 적절한 도메인(Project, Session 등)의 컨트롤러로 이동시킵니다.
*   **라우트 경량화 & Zod 유효성 검사:** `src/backend/routes/api.ts`는 컨트롤러를 연결하는 역할만 수행하도록 수정(Thin Routes)하며, Fastify-Zod Provider를 이용해 Query, Params, Body에 대한 엄격한 Zod 스키마 검증을 추가합니다.
*   **타입 안정성 확보:** `Syncer` 및 주요 서비스 계층에서 사용되는 `any` 타입을 적절한 Zod 스키마 타입 또는 TypeScript 인터페이스로 대체합니다.

### Phase 4: 성능 최적화 (Performance Optimization)
*   **Syncer DB 트랜잭션 적용:** `src/backend/services/syncer.ts` 내의 개별 Insert 작업을 Drizzle DB Transaction(`db.transaction`)으로 묶고, 가능한 부분은 `insert().values([...])` 형태의 일괄 삽입(Batch Insert)으로 변경하여 대용량 파일 동기화 성능을 개선합니다.
*   **Relational Query 적용:** 라우트에서 데이터를 조회할 때(예: 메시지와 관련된 thoughts, tool calls 등) N+1 쿼리가 발생하지 않도록 Phase 1에서 정의한 Drizzle Relations 기반의 `db.query.tableName.findMany(...)` 등을 활용해 단일 쿼리로 효율적인 데이터 패칭을 수행합니다.

---

## 4. 상세 파일 변경 내역 (Specific File Changes)

*   **`src/backend/db/schema.ts`**:
    *   Drizzle `relations` 추가 (projects, sessions, messages, thoughts 등).
*   **`src/backend/db/index.ts`** (또는 `initDb` 관련 파일):
    *   하드코딩된 SQL 초기화 스크립트 제거. Drizzle Kit 스크립트를 package.json에 추가.
*   **`src/backend/app.ts`**:
    *   전역 에러 핸들러 설정 추가 (`fastify.setErrorHandler`).
    *   Socket.io 인스턴스를 관리할 Fastify 플러그인 등록 방식 적용.
*   **`src/backend/utils/message-utils.ts` (신규)**:
    *   `extractMessageSummary`와 같은 텍스트 변환 공통 로직 이관.
*   **`src/backend/controllers/*` (신규)**:
    *   `project.controller.ts`, `session.controller.ts` 등을 생성하여 비즈니스 로직 이동.
*   **`src/backend/routes/api.ts`**:
    *   각 라우트에 `schema` 정의 추가 (Zod 기반 파라미터/쿼리 검증).
    *   비즈니스 로직을 모두 컨트롤러/서비스 호출로 대체하여 라우트 파일 경량화.
*   **`src/backend/services/syncer.ts`**:
    *   `any` 타입 제거 및 엄격한 타입 정의.
    *   DB 저장 로직을 트랜잭션(`tx`) 및 `insert().values(배열)` 형태로 수정.
    *   중복된 요약 로직을 유틸리티 호출로 대체.
