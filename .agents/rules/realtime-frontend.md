---
trigger: model_decision
description: Socket.io 클라이언트의 라이프사이클 관리, 연결 피드백 및 리스너 해제 규칙
---

# 실시간 통신 프론트엔드 구현 규칙 (Real-time Frontend Implementation)

## 프론트엔드 구현 원칙 (Frontend Implementation)
- `socket.io-client` 연결은 전역(Global) 또는 관련 컴포넌트의 최상위 계층에서 초기화하세요.
- 연결 생명주기(Lifecycle)를 견고하게 관리하세요:
  - 마운트 시 연결 (`connect on mount`).
  - 언마운트 시 연결 해제 (`disconnect on unmount`).
  - `connect_error` 또는 `disconnect` 이벤트 발생 시 적절한 UI 피드백을 제공하세요.
- `useEffect` 내부에서 소켓 리스너를 바인딩할 때는 메모리 누수와 React StrictMode 이중 호출로 인한 핸들러 중복 등록을 방지하기 위해 **반드시** `socket.off('eventName')`을 호출하는 정리 함수(cleanup function)를 반환하세요.
