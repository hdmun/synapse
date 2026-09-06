# Synapse Monitoring

Synapse is a local-first product for understanding AI coding activity across local software projects. It organizes that activity so a user can inspect what happened in each project, session, and message without leaving their machine.

## Language

**Project**:
A local codebase that Synapse tracks as a single unit of activity and reporting.
_Avoid_: Repo, workspace

**Session**:
A continuous conversation between a human and an AI agent inside a Project.
_Avoid_: Chat, thread

**Message**:
A single turn inside a Session, authored by either the human or the agent.
_Avoid_: Log line, event

**Agent**:
The AI coding assistant responsible for a Session, such as Gemini or Copilot.
_Avoid_: Model, bot

**Tool Call**:
An action an Agent invokes during a Message to inspect or change its environment.
_Avoid_: Command, plugin call

**Thought Trace**:
Reasoning metadata attached to a Message when the Agent exposes it.
_Avoid_: Hidden chain-of-thought, debug log

**Core Capability**:
A Synapse feature that applies consistently across multiple agent sources and belongs in the main product surface.
_Avoid_: Provider-specific feature, Claude-only feature

**Source-specific Extension**:
A feature that depends on one agent provider's (Source's) local files or metadata and is intentionally separated from the Core Capability set. Note: "Source" is used synonymously with "Agent Provider" (e.g., Gemini, Copilot).
_Avoid_: Core feature, generic analytics

**Artifact View**:
A source-neutral surface for inspecting persisted work artifacts (e.g. agent-specific plans, todos, or memory) across different agent providers.
_Avoid_: Claude screen clone, provider-only page

**Global Analytics View**:
A product surface that compares activity across Projects or Sessions at the whole-Synapse level.
_Avoid_: Project detail, session-local panel

**Scoped Drill-down**:
A narrower analytic view attached to one Project or one Session that explains that scope in more detail.
_Avoid_: Global dashboard, cross-project report

**Estimated Cost**:
A source-specific spend estimate calculated only when the underlying agent data exposes enough pricing inputs and usage metadata.
_Avoid_: Final bill, provider-neutral cost

**Read-only Extension**:
A Source-specific Extension that exposes provider data for inspection but does not modify the provider's underlying files or settings.
_Avoid_: Editor, control plane

**Replay Core**:
The source-neutral session detail experience that reconstructs a conversation as an ordered sequence of Messages, Tool Calls, and related metadata.
_Avoid_: Provider-only replay, raw log dump

**Source Enricher**:
Provider-specific logic that adds extra structure to the Replay Core when a source exposes richer metadata.
_Avoid_: Separate replay product, standalone viewer

**Portable Export**:
A product capability that packages Synapse analytics into a shareable snapshot without depending on one provider's private file layout.
_Avoid_: Provider backup, raw database copy

**Preview Import**:
An additive-only import experience that shows what new analytics data could be merged before any write happens.
_Avoid_: Destructive sync, overwrite import

**Facet**:
A Claude-specific session semantics record that summarizes goal, outcome, session type, friction, and brief summary for one Session.
_Avoid_: Core session metadata, source-neutral summary

**Minimum Collector Output Contract**:
The two-tier data contract that every Synapse collector must satisfy so Core analytics can render consistently, with richer source-specific fields attached only when available.
_Avoid_: Best-effort scrape, source-maximal schema

**Portable Export Schema**:
The Synapse-owned export format that preserves source-neutral analytics first and nests provider-specific enrichers separately.
_Avoid_: Claude-native dump, raw provider backup

**Token Taxonomy**:
The cross-source classification Synapse uses to group token data. Must include `base` (standard input/output tokens) and `reasoning` (internal chain-of-thought tokens). If a provider doesn't expose tokens, it is omitted.
_Avoid_: Provider-native token schema, fake precision

## Example dialogue

**Developer**: "I only want the Copilot Sessions for this Project."

**Domain expert**: "Then filter the Sessions by Agent. The Project stays the same; only the Session set changes."

**Developer**: "Can I inspect the Tool Calls and Thought Traces inside one of those Sessions?"

**Domain expert**: "Yes. Each Message can expose Tool Calls, and some Agents also expose Thought Traces."

**Developer**: "What about Claude-only files like todos or memory?"

**Domain expert**: "Those are Source-specific Extensions. They can live in Synapse, but they should not redefine the Core Capability set."

**Developer**: "So should we copy Claude pages exactly?"

**Domain expert**: "No. When possible, Synapse should express them as Artifact Views, with Claude as one provider-specific source."

**Developer**: "Where do costs and tool analytics belong?"

**Domain expert**: "Keep cross-project comparison in a Global Analytics View, then add Scoped Drill-downs on the relevant Project or Session pages."

**Developer**: "Can we compare cost across every agent with one unified number?"

**Domain expert**: "Only when the source exposes enough data. Estimated Cost is source-specific; otherwise Synapse should say the value is unavailable."

**Developer**: "Should Synapse edit Claude memory or todo files directly?"

**Domain expert**: "Not in the first cut. Those extensions should stay read-only so Synapse remains an observer before it becomes a controller."

**Developer**: "Should Claude replay live on a separate page from everything else?"

**Domain expert**: "No. Keep a single Replay Core, then let each provider add Source Enrichers when it has extra context like compaction or thought traces."

**Developer**: "Does export/import belong only to Claude?"

**Domain expert**: "No. Portable Export is a Core Capability. Preview Import can stay additive-only until Synapse is confident about merge semantics."

**Developer**: "Should `Facet` become a core Synapse concept right now?"

**Domain expert**: "Not yet. For now `Facet` is a Claude-specific extension, not a source-neutral Session concept."

**Developer**: "Do all collectors need to emit the same rich schema?"

**Domain expert**: "No. They must satisfy the Minimum Collector Output Contract for Core analytics, then attach optional source-specific enrichers when they can."

**Developer**: "Should Synapse just reuse cc-lens `.ccboard.json`?"

**Domain expert**: "No. Synapse needs its own Portable Export Schema so provider-specific blocks stay optional instead of defining the core format."

**Developer**: "Can we reuse cc-lens feature labels directly?"

**Domain expert**: "Synapse doesn't currently model abstract workflows; we just store the raw tool calls as part of the Message."

**Developer**: "Do we need one universal token schema for every provider?"

**Domain expert**: "No. Synapse uses a Token Taxonomy that specifically extracts `base` and `reasoning` tokens. Everything else is left out or stored as source-specific."
