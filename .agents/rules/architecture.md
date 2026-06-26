---
trigger: model_decision
description: 모노레포 폴더 구조, 경계 규칙 및 패키지 관리 규칙
---

# Architecture & Monorepo Boundaries

## Project Structure
This project is a Bun workspace-based monorepo. Strict boundary rules apply to the packages:
- **`packages/backend`**: Server-side Fastify API and data Ingester logic.
- **`packages/frontend`**: React SPA UI client using Vite.
- **`packages/shared`**: Shared Zod schemas, TypeScript types, paths configuration, and messaging utils.
- **`packages/collector`**: Independent daemon collecting raw data from agents.

## Shared Conventions
1. **SSOT (Single Source of Truth)**: Define all data models (Zod schemas), TypeScript types, and shared config in `packages/shared`.
2. **Pure Functions**: Shared utilities should be pure functions and avoid platform-specific global objects (like `window` or `process`) unless guarded.

## Boundary Rules
1. **Frontend Isolation**: Code in `packages/frontend` **MUST NEVER** import from `packages/backend` or `packages/collector`.
2. **Backend Isolation**: Code in `packages/backend` **MUST NEVER** import from `packages/frontend` or `packages/collector`.
3. **Collector Isolation**: Code in `packages/collector` **MUST NEVER** import from `packages/frontend` or `packages/backend`.
4. **Shared Imports**: Frontend, Backend, and Collector packages should import from `@synapse/shared` to share types and configuration. No direct relative imports across packages are allowed.

## Package Management
- **Tool**: Bun workspace.
- **Scripts**: Run `bun install` at the root. Use `--filter` workspace flags for individual package scripts.

