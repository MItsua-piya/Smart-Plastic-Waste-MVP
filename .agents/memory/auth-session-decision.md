---
name: Auth session decision
description: Authentication approach used for the current Plastic Loop MVP.
---

Use signed JWT sessions with bcrypt password hashing for the requested role-based web flow. The API, not the UI role label, is the source of truth for permissions.

**Why:** The specification explicitly requires JWT role claims and bcrypt, and client-side role switching alone would allow the interface to misrepresent access.

**How to apply:** Keep role selection out of authenticated navigation; derive the workspace from the signed-in user and enforce allowed roles in each protected route.