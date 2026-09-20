---
name: API smoke test harness
description: Constraints for running Plastic Loop API smoke tests safely in this workspace.
---

The API smoke tests bundle TypeScript workspace packages with esbuild instead of relying on a runtime TypeScript loader, and they must always select a unique MongoDB database name before importing the app.

**Why:** The workspace API schema package is TypeScript-only at runtime, and using an existing database name during tests could mutate demo data.

**How to apply:** Keep test-only logger transports synchronous, prefer `MONGODB_TEST_URI` for a separate server, and use the test runner's generated database override plus cleanup.