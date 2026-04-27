# Frontend State Management (Zustand)

## Modular Stores
- Do not create a single giant Zustand store.
- Split stores by domain or feature (e.g., `useAuthStore`, `useProjectStore`, `useLogStore`). Place them in `src/frontend/store/`.

## Defining Actions
- State mutations (actions) MUST be defined alongside the state within the Zustand store itself.
- Components should only call these actions; they should not mutate the store state directly using generic `set()` calls from within the component body.

## Selectors (Critical)
- **Never** extract the entire state object in a component (`const state = useStore()`). This causes the component to re-render on *any* state change.
- **Always** use atomic selectors to extract exactly what the component needs:
  ```ts
  // Good
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  ```
- Use `useShallow` from `zustand/react/shallow` if you need to select multiple properties at once as an object.
