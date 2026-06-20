# Architecture & Monorepo Boundaries

## Project Structure
This project uses a logical monorepo structure. Strict boundary rules apply:
- **`src/backend`**: Server-side code only. Node/Bun APIs and database logic.
- **`src/frontend`**: Client-side code only. React, Browser APIs, UI assets.
- **`src/shared`**: Universal code. Types, Zod schemas, constants, and shared utility functions.

## Shared Conventions
1. **SSOT (Single Source of Truth)**: Define all data models (Zod schemas) and TypeScript types in `src/shared`.
2. **Pure Functions**: Shared utilities should be pure functions and avoid platform-specific global objects (like `window` or `process`) unless guarded.

## Boundary Rules
1. **Frontend Isolation**: Code in `src/frontend` **MUST NEVER** import from `src/backend`.
2. **Backend Isolation**: Code in `src/backend` **MUST NEVER** import from `src/frontend`.
3. **Shared Imports**: Both backend and frontend should freely import from `src/shared`.

## Package Management
- **Tool**: Bun (`bun install`, `bun run`).
- **Scripts**: Refer to `package.json` for defined concurrently scripts (e.g., `dev`, `test`).
