# Frontend React Components

## Component Paradigms
- Write strictly Functional Components. Class components are banned.
- Ensure components follow the Single Responsibility Principle. If a component exceeds ~150 lines, consider extracting sub-components.

## Hooks & Side Effects
- Custom hooks (in `src/frontend/hooks/`) should be used to encapsulate complex state logic or side effects (data fetching, subscriptions).
- Keep `useEffect` blocks as small as possible. Always return a cleanup function if the effect initiates a subscription, watcher, or interval.
