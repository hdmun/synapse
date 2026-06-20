# Real-time Event Contracts

## Event Contracts
- All Socket.io event names and payload structures MUST be defined in `src/shared/types.ts` or `src/shared/schema.ts`.
- Use TypeScript interfaces for `ServerToClientEvents` and `ClientToServerEvents` to strictly type the socket instances on both the backend and frontend. Avoid "magic strings" for event names.
