---
trigger: model_decision
description: 프론트엔드와 백엔드 간 Socket.io 이벤트 및 데이터 페이로드 타입 정의 규칙
---

# Real-time Event Contracts

## Event Contracts
- All Socket.io event names and payload structures MUST be defined in `src/shared/types.ts` or `src/shared/schema.ts`.
- Use TypeScript interfaces for `ServerToClientEvents` and `ClientToServerEvents` to strictly type the socket instances on both the backend and frontend. Avoid "magic strings" for event names.
