---
trigger: model_decision
description: Vitest 및 React Testing Library를 사용한 프론트엔드 UI 및 상태 목 테스트 규칙
---

# 프론트엔드 테스트 전략 규칙 (Frontend Testing Strategy)

## 핵심 원칙 (Core Principles)
- **구현보다 동작 중심 검증 (Behavior over Implementation)**: 코드가 '어떻게' 수행하는지가 아니라 '무엇을' 하는지 테스트하세요. 입출력이 동일하다면 내부 로직을 리팩터링해도 테스트가 깨지지 않아야 합니다.
- **동일 위치 배치 (Co-location)**: 테스트 파일은 테스트 대상 파일 바로 옆에 함께 위치해야 합니다(예: `MessageViewer.tsx` -> `MessageViewer.test.tsx`).

## 프론트엔드 테스트 - Vitest & RTL
- 테스트 러너로 `vitest`를 사용하세요.
- UI 컴포넌트 테스트에는 `@testing-library/react`를 사용하세요.
- **쿼리 우선순위 (Queries)**: 접근성 및 실제 사용성을 보장하기 위해 `getByTestId`보다 웹 접근성 기반 쿼리(`getByRole`, `getByText`, `getByLabelText`)를 우선 사용하세요.
- **사용자 인터랙션 (Interactions)**: 단순 `fireEvent` 대신 실제 사용자의 브라우저 인터랙션을 보다 사실적으로 시뮬레이션하는 `@testing-library/user-event`를 사용하세요.
- **목킹 (Mocking)**: 격리된 UI 컴포넌트를 테스트할 때는 예기치 않은 부수 효과를 방지하기 위해 `socket.io-client`와 Zustand 스토어를 적절히 목(mock) 처리하세요.
