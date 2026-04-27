# AI Agents Context & Rules

This project uses highly modularized rules to provide specialized context to AI agents. 
AI agents must read the appropriate markdown files below based on the exact context of the requested task.

## Architecture & Foundational Rules
- **[Architecture & Boundaries](.gemini/rules/architecture.md):** Monorepo structure, folder isolation, and import rules.
- **[TypeScript Standards](.gemini/rules/typescript.md):** Strict mode, banning `any`, and Zod integration.
- **[Project Workflow & Security](.gemini/rules/project-workflow.md):** Git commits, environment variables, and build analysis.

## Backend Rules
- **[Fastify Routing & Validation](.gemini/rules/backend-fastify-routing.md):** Fastify routing and Zod validation schemas.
- **[Fastify Plugins & Errors](.gemini/rules/backend-fastify-plugins.md):** Fastify plugins and global error handling.
- **[Drizzle Schema & Migrations](.gemini/rules/backend-drizzle-schema.md):** Drizzle ORM schemas, relations, and migrations.
- **[Drizzle Queries](.gemini/rules/backend-drizzle-queries.md):** Drizzle Query Builder API and conventions.
- **[Backend Services](.gemini/rules/backend-services.md):** Background services, file watching (Chokidar), and sync logic.

## Frontend Rules
- **[React Components](.gemini/rules/frontend-components.md):** Functional components, hooks, and side effects.
- **[React Performance](.gemini/rules/frontend-performance.md):** Virtualization, memoization, and callback optimization.
- **[UI & Styling](.gemini/rules/frontend-styling.md):** UI icons (Lucide) and data visualization (Recharts).
- **[Frontend State](.gemini/rules/frontend-state.md):** Zustand modular stores, atomic selectors, and action definitions.

## Real-time Communication (Socket.io)
- **[Real-time Contracts](.gemini/rules/realtime-contracts.md):** Shared event definitions and TypeScript typing.
- **[Real-time Backend](.gemini/rules/realtime-backend.md):** Backend namespace/room handling and broadcast logic.
- **[Real-time Frontend](.gemini/rules/realtime-frontend.md):** Frontend connection lifecycle and event listeners.

## Testing Strategy
- **[Frontend Testing](.gemini/rules/testing-frontend.md):** Vitest, React Testing Library, and UI mocking.
- **[Backend Testing](.gemini/rules/testing-backend.md):** Bun test, Fastify inject, and database test environments.
