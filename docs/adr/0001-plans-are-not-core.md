# Plans and Checkboxes are Not Core Capabilities

In the initial design, the system tracked agent-generated markdown checkboxes (`- [ ]`) to compute a `progress` metric on the `projects` table, storing these in a dedicated `plans` table.

However, we decided that parsing markdown plans is not a universal "Core Capability" that belongs in the central schema. Not all AI coding agents manage tasks via markdown checkboxes, and embedding this logic tightly couples the core analytics to one specific provider's workflow (or a naive heuristic).

**Decision:**
- The `Plan` concept is removed from the core glossary (`CONTEXT.md`).
- The `plans` table and `projects.progress` field will be removed from the core database schema.
- If we want to visualize agent-specific planning data in the future, it must be implemented as a `Source-specific Extension` or `Artifact View` rather than altering the core schema.
