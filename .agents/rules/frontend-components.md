---
trigger: model_decision
description: 프론트엔드 React 함수형 컴포넌트, 커스텀 훅 및 useEffect 정리 규칙
---

# Frontend React Components

## Component Paradigms
- Write strictly Functional Components. Class components are banned.
- Ensure components follow the Single Responsibility Principle. If a component exceeds ~150 lines, consider extracting sub-components.

## Hooks & Side Effects
- Custom hooks (in `src/frontend/hooks/`) should be used to encapsulate complex state logic or side effects (data fetching, subscriptions).
- Keep `useEffect` blocks as small as possible. Always return a cleanup function if the effect initiates a subscription, watcher, or interval.
