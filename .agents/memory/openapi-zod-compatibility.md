---
name: OpenAPI and Zod compatibility
description: Compatibility constraint for generated validation schemas in this workspace.
---

Use numeric OpenAPI fields instead of integer fields when targeting the current generated Zod setup, because Orval emits `z.int()` for integers while the installed Zod runtime does not expose that API.

**Why:** Code generation succeeds, but the workspace library typecheck fails on the generated integer validators.

**How to apply:** Preserve integer semantics in validation or application logic where needed, but avoid `type: integer` in the OpenAPI contract until the workspace Zod/Orval versions are aligned.