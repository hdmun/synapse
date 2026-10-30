---
trigger: model_decision
description: Fastify 플러그인 생태계와 전역 에러 핸들링 규칙
---

# 백엔드 Fastify 플러그인 및 에러 핸들링 규칙 (Backend Fastify Plugins & Errors)

## 플러그인 생태계 (Plugin Ecosystem)
- 커스텀 플러그인이 전역 Fastify 인스턴스를 수정해야 하는 경우(예: 데코레이터 등록, socket.io 인스턴스 부착 등), 반드시 `fastify-plugin` 패키지로 감싸서 정의해야 합니다.
- 이를 통해 플러그인이 의도한 캡슐화 범위를 벗어나 예상치 못한 부작용을 일으키는 것을 방지합니다.

## 에러 핸들링 (Error Handling)
- 일반적인 `Error` 문자열을 던지지 마세요.
- 서비스 계층에서는 커스텀 에러 클래스(예: `NotFoundError`, `UnauthorizedError`)를 정의하고 발생시키세요.
- Fastify 전역 에러 핸들러(`fastify.setErrorHandler`)를 활용하여 이러한 커스텀 에러 클래스를 적절한 HTTP 상태 코드와 깔끔한 응답 구조로 변환하세요.
