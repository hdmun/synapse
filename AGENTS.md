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


