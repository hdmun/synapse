---
trigger: model_decision
description: Socket.io 기반 실시간 통신 백엔드 룸 처리 및 이벤트 브로드캐스팅 규칙
---

# 실시간 통신 백엔드 구현 규칙 (Real-time Backend Implementation)

## 백엔드 구현 원칙 (Backend Implementation)
- 연결된 소켓을 논리적인 네임스페이스(`namespaces`)나 룸(`rooms`, 예: 프로젝트 ID별 room)으로 그룹화하여 관련 클라이언트에게만 메시지가 브로드캐스트되도록 구성하세요.
- 상태 변경 작업(예: 데이터베이스에 메시지 저장)이 성공적으로 완료된 **이후에만** 클라이언트로 실시간 이벤트를 브로드캐스트해야 데이터 정합성이 깨지지 않습니다.
