---
trigger: model_decision
description: Bun Test 및 Fastify app.inject를 활용한 백엔드 라우트 및 데이터베이스 테스트 규칙
---

# 백엔드 테스트 전략 규칙 (Backend Testing Strategy)

## 핵심 원칙 (Core Principles)
- **구현보다 동작 중심 검증 (Behavior over Implementation)**: 코드가 '어떻게' 수행하는지가 아니라 '무엇을' 하는지 테스트하세요. 입출력이 동일하다면 내부 로직을 리팩터링해도 테스트가 깨지지 않아야 합니다.
- **동일 위치 배치 (Co-location)**: 테스트 파일은 테스트 대상 파일 바로 옆에 함께 위치해야 합니다(예: `watcher.ts` -> `watcher.test.ts`).

## 백엔드 테스트 - Bun Test
- 내장 `bun test`를 사용하세요. 실행 시 `NODE_ENV=test` 환경인지 확인하세요.
- **API 테스트**: Fastify 라우트 테스트 시 `app.inject()`를 사용하세요. 이는 실제 포트에 바인딩하지 않고 HTTP 요청을 시뮬레이션하므로 테스트가 훨씬 빠르고 병렬 실행이 가능합니다. 반환되는 HTTP 상태 코드와 파싱된 JSON 본문을 검증하세요.
- **데이터베이스 테스트**: Drizzle ORM을 무리하게 목(mock) 처리하기보다는 격리된 로컬 테스트 데이터베이스(예: 테스트용 인메모리 SQLite DB)를 대상으로 쿼리를 실행하는 것을 선호합니다. ORM을 과도하게 목킹하면 중요한 통합 버그를 놓치기 쉽습니다.
