# Synapse Project Handoff

## Context
A `/grilling` and `/domain-modeling` session was just completed to clarify the purpose and direction of the "Synapse" project (a local dashboard for monitoring AI coding agent activity).

The user explicitly requested to focus the next session on executing the **작업 계획** (Work Plan) formulated during this session. The fresh agent should immediately proceed with Phase 1 of the implementation plan.

## Decisions Made
- **Core Architecture Shift**: Real-time Socket.io UI updates are being removed. The project transitions to a static retrospective analysis tool (background data collection via Chokidar remains).
- **Core Use Cases**: 
  1. **Retrospective Debugging**: Replay Core-centric UI (Timeline of Messages, Tool Calls, Thought Traces) instead of simple file diffs.
  2. **Resource Auditing**: Precise token/cost tracking for natively supported agents (e.g. Gemini). No "fake precision" or merged total costs for unsupported agents.

## Relevant Artifacts and Documents
Please refer to the following files instead of duplicating their contents:
- **Implementation Plan (Your Next Steps)**: [implementation_plan.md](file:///C:/Users/hdmun/.gemini/antigravity-cli/brain/21bcff80-ae87-49d2-969c-321b6d022237/implementation_plan.md)
- **ADR Document (Socket.io Removal)**: [0003-remove-realtime-monitoring-ui.md](file:///C:/Users/hdmun/repo/synapse/docs/adr/0003-remove-realtime-monitoring-ui.md)
- **Domain Model**: [CONTEXT.md](file:///C:/Users/hdmun/repo/synapse/CONTEXT.md)

## Suggested Skills
- `tdd`: Use test-driven development to ensure the safe removal of Socket.io dependencies and the restructuring of the backend/frontend without breaking existing DB insertion logic.
- `code-review`: Run a code review after Phase 1 to ensure the refactoring changes adhere to the project's strict architecture guidelines (found in `.agents/rules/`).
