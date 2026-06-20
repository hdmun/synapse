# Backend Drizzle Schema & Migrations

## Schema Definition
- All schemas must be defined in `src/backend/db/schema.ts`.
- Use relational queries where appropriate. Define relations explicitly using Drizzle's `relations` function.
- Manually define Zod schemas in `src/shared/schema.ts` to match your Drizzle tables for validation, as `drizzle-zod` is not part of the tech stack. Export these for use across both backend and frontend.

## Migrations
- Treat the database schema as immutable in production.
- Any change to `schema.ts` MUST be accompanied by generating a migration using Drizzle Kit.
- Run `drizzle-kit generate` to create the SQL migration file.
- Verify the generated migration SQL before applying it.
