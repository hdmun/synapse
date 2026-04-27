# Frontend React Performance

## Performance & Optimization
- **Large Lists:** Mandatory use of `@tanstack/react-virtual` for any list expected to exceed 50 items (e.g., log outputs, long chat histories) to prevent DOM bloat.
- **Memoization:** Use `useMemo` for expensive synchronous calculations (like data grouping for charts).
- **Callbacks:** Use `useCallback` when passing functions as props to tightly optimized child components (like Virtualized lists or Chart components) to prevent unnecessary re-renders.
