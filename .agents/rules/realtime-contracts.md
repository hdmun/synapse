---
trigger: model_decision
description: 프론트엔드와 백엔드 간 Socket.io 이벤트 및 데이터 페이로드 타입 정의 규칙
---

# 실시간 이벤트 계약 규칙 (Real-time Event Contracts)

## 이벤트 계약 정의 (Event Contracts)
- 모든 Socket.io 이벤트 이름과 페이로드(Payload) 구조는 반드시 `packages/shared/src/types.ts` 또는 `packages/shared/src/schema.ts`에 정의해야 합니다.
- 백엔드와 프론트엔드 양쪽의 소켓 인스턴스에 엄격한 타입을 적용하기 위해 `ServerToClientEvents` 및 `ClientToServerEvents` TypeScript 인터페이스를 사용하세요. 이벤트 이름에 하드코딩된 "매직 스트링(magic strings)"을 사용하지 마세요.
