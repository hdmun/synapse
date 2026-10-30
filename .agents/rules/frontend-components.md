---
trigger: model_decision
description: 프론트엔드 React 함수형 컴포넌트, 커스텀 훅 및 useEffect 정리 규칙
---

# 프론트엔드 React 컴포넌트 규칙 (Frontend React Components)

## 컴포넌트 작성 원칙 (Component Paradigms)
- 엄격하게 함수형 컴포넌트(Functional Components)만 작성하세요. 클래스 컴포넌트는 금지됩니다.
- 컴포넌트가 단일 책임 원칙(Single Responsibility Principle)을 따르도록 하세요. 컴포넌트 코드가 약 150줄을 초과하면 하위 컴포넌트로 분리하는 것을 고려하세요.

## 훅 및 부수 효과 (Hooks & Side Effects)
- 복잡한 상태 로직이나 부수 효과(데이터 페칭, 실시간 구독 등)를 캡슐화하려면 커스텀 훅(`packages/frontend/src/hooks/`)을 사용하세요.
- `useEffect` 블록은 가능한 작고 명확하게 유지하세요. effect 내에서 구독, 감시자 또는 인터벌을 시작하는 경우 반드시 정리 함수(cleanup function)를 반환하여 메모리 누수를 방지하세요.
