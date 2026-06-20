---
trigger: model_decision
description: Vitest 및 React Testing Library를 사용한 프론트엔드 UI 및 상태 목 테스트 규칙
---

# Frontend Testing Strategy

## Core Principles
- **Behavior over Implementation:** Test what the code does, not how it does it. Refactoring internal logic shouldn't break tests if the input/output remains the same.
- **Co-location:** Test files must reside next to the files they test (e.g., `MessageViewer.tsx` -> `MessageViewer.test.tsx`).

## Frontend (Vitest & RTL)
- Use `vitest` for running tests.
- Use `@testing-library/react` for UI testing.
- **Queries:** Strictly prefer accessibility queries (`getByRole`, `getByText`, `getByLabelText`) over `getByTestId` to ensure the app is usable.
- **Interactions:** Use `@testing-library/user-event` to simulate realistic DOM events instead of `fireEvent`.
- **Mocking:** Mock `socket.io-client` and Zustand stores when testing isolated UI components to prevent side effects.
