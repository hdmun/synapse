# Real-time Backend Implementation

## Backend Implementation
- Group connections into logical `namespaces` or `rooms` (e.g., a room per project ID) to ensure messages are only broadcast to relevant clients.
- Ensure state mutations (e.g., saving a message to the DB) complete successfully *before* broadcasting the real-time event to clients.
