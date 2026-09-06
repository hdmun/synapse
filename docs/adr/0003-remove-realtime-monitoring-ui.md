---
status: accepted
---
# Remove Real-time Monitoring UI (Socket.io)

We decided to remove Socket.io and real-time dashboard UI updates from the core architecture, shifting Synapse to a static analysis tool for retrospective debugging and resource auditing. While Chokidar will remain to quietly sync agent logs into the local DB in the background, the UI will not poll or maintain a WebSocket connection to stream live events. This reduces architectural complexity and aligns with the primary use cases: analyzing past sessions' Replay Cores and calculating agent costs, rather than live-watching the agent work.
