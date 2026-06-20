---
trigger: model_decision
description: Socket.io 기반 실시간 통신 백엔드 룸 처리 및 이벤트 브로드캐스팅 규칙
---

# Real-time Backend Implementation

## Backend Implementation
- Group connections into logical `namespaces` or `rooms` (e.g., a room per project ID) to ensure messages are only broadcast to relevant clients.
- Ensure state mutations (e.g., saving a message to the DB) complete successfully *before* broadcasting the real-time event to clients.
