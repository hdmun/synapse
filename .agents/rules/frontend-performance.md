---
trigger: model_decision
description: 가상 리스트, 메모이제이션, 콜백 함수를 활용한 프론트엔드 성능 최적화 규칙
---

# Frontend React Performance

## Performance & Optimization
- **Large Lists:** Mandatory use of `@tanstack/react-virtual` for any list expected to exceed 50 items (e.g., log outputs, long chat histories) to prevent DOM bloat.
- **Memoization:** Use `useMemo` for expensive synchronous calculations (like data grouping for charts).
- **Callbacks:** Use `useCallback` when passing functions as props to tightly optimized child components (like Virtualized lists or Chart components) to prevent unnecessary re-renders.
