# TypeScript & Type Safety

## Strict Mode
- TypeScript must be compiled with `strict: true`.
- Implicit `any` is forbidden.
- Explicit `any` is strictly prohibited. If a type is unknown at development time, use the `unknown` type and employ Type Guards or Zod to narrow the type before usage.

## Zod as the Source of Truth
- For any data crossing a boundary (API requests/responses, WebSockets, Database reads/writes), define a **Zod schema first**.
- Place shared Zod schemas in `src/shared/schema.ts`.
- Extract TypeScript types using `z.infer<typeof SchemaName>`. Do not manually write interfaces that duplicate Zod schema definitions.

## Nullability & Optionals
- Prefer explicit `null` over `undefined` when representing the intentional absence of an object or value (especially in database schemas).
- Use TypeScript's `?` operator for genuinely optional properties in requests or configurations.
