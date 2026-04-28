# AI Agents Context & Rules

This project uses highly modularized rules to provide specialized context to AI agents. 
AI agents must read the appropriate markdown files below based on the exact context of the requested task to ensure consistent and high-quality outputs.

## Core Mandates for Consistent Work Quality
To maintain the integrity and consistency of the codebase, AI agents MUST adhere to the following principles:

1. **Verify Before Action:** Always read existing code, types, and configurations before making changes. Do not guess the structure. Use search (`grep_search`, `glob`) and read (`read_file`) tools to understand the surrounding context.
2. **Follow Existing Patterns:** Strictly adhere to the project's established architectural patterns, naming conventions, and file structures. Do not introduce new libraries or frameworks unless explicitly instructed.
3. **Atomic & Focused Changes:** Keep your modifications strictly related to the requested task. Do not perform unrelated refactoring.
4. **Type Safety & Linters:** Never bypass TypeScript strict mode (e.g., avoid `any`, `@ts-ignore`). Use explicit type guards and proper schema validation (Zod). Address potential linting or type errors.
5. **Test Driven:** Whenever adding features or fixing bugs, verify existing tests or add new tests to ensure the behavioral correctness of the change. Validate changes with `npm run test` or the appropriate testing commands.
6. **No Silent Failures:** If an intended change conflicts with existing rules or breaks the build, stop and inform the user or re-evaluate the strategy. Do not push through breaking changes.

---

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
