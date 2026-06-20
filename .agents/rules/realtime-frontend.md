# Real-time Frontend Implementation

## Frontend Implementation
- Initialize the `socket.io-client` connection globally or at the highest relevant component level.
- Handle connection lifecycles robustly:
  - Connect on mount.
  - Disconnect on unmount.
  - Handle `connect_error` or `disconnect` events with appropriate UI feedback.
- When binding socket listeners inside `useEffect`, ALWAYS provide a cleanup function to call `socket.off('eventName')` to prevent memory leaks and duplicate handlers during React's StrictMode double-invocations.
