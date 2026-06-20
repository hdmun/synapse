# Backend Services & Background Processes

## File Watching (Chokidar)
- **Library**: Use `chokidar` for robust cross-platform file system watching.
- **Pattern**: Implement a `Watcher` class that encapsulates the `FSWatcher` instance.
- **Debouncing**: Always implement debouncing (e.g., 300ms) for file system events to avoid redundant processing during rapid file writes.

## Data Synchronization (Syncer)
- **Separation of Concerns**: 
  - `Watcher` should only handle file system events and trigger syncs.
  - `Syncer` should handle the logic of reading, parsing, and persisting data to the database.
- **Resilience**: Use `try-catch` blocks for all file read and database operations to prevent the service from crashing on malformed files.
- **Initial Scan**: Services should perform an initial scan of the target directory upon startup to ensure the database is up-to-date with existing files. Use `Bun.Glob` for efficient scanning in the Bun environment.

## Concurrency & Performance
- **Atomic Operations**: Use Drizzle's `onConflictDoUpdate` or `onConflictDoNothing` to ensure idempotent synchronization.
- **Resource Management**: Properly close watchers and database connections when the service is stopped or the process terminates.
