# Remove Feature Adoption Taxonomy

The `Feature Adoption Taxonomy` was originally included in the domain vocabulary to abstract agent-specific tools (e.g., `@workspace`, `read_file`) into generic workflows (e.g., `CODE_READ`, `CODE_WRITE`).

However, attempting to map these proved ambiguous because the "workflow" intention is often context-dependent and heavily intertwined (a single action might both read and write). More importantly, there was no concrete use case driving this abstraction, and the term caused confusion regarding where the mapping should occur.

**Decision:**
- We are removing `Feature Adoption Taxonomy` from the Core Terminology.
- The `features` column is removed from the `messages` schema.
- Synapse will rely strictly on the raw `toolCalls` array as a Source-specific Artifact, rather than trying to classify abstract workflows upfront.
