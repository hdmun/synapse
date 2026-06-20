# Backend Drizzle Queries

## Querying
- Always use Drizzle's Query Builder API (`db.select().from(...)`, `db.query.tableName.findMany(...)`).
- Do not write raw SQL strings using template literals unless absolutely necessary for advanced features unsupported by Drizzle. This prevents SQL injection and maintains type safety.
