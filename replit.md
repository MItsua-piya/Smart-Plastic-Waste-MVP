# Plastic Loop

Plastic Loop helps communities track plastic deposits, centre capacity, pickup routing, driver progress, and hotspot reports in one operations hub.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required secret: `MONGODB_URI` — MongoDB connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: MongoDB + Mongoose
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/plastic-loop` — React dashboard with role-aware navigation and workflow pages
- `artifacts/plastic-loop/src/pages/admin.tsx` — administrator analytics, hotspot decisions, cleanup actions, users, fleet, and rewards
- `artifacts/plastic-loop/src/pages/rewards.tsx` — citizen credit balance and redemption
- `artifacts/api-server/src/lib/mongo.ts` — Mongoose models, MongoDB connection, and idempotent seed data
- `artifacts/api-server/src/routes/plastic-loop.ts` — persistent workflow API handlers
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/api-client-react/src/generated` — generated React Query client and schemas

## Architecture decisions

- The MVP uses the shared Express API and generated OpenAPI client so frontend requests stay contract-driven.
- Authentication uses bcrypt password hashing and signed JWT role claims; protected API handlers enforce the role from the token instead of trusting UI state.
- The API uses Mongoose models for all domain entities and transaction records; startup seeding only runs when each MongoDB collection is empty.
- Pickup requests are created when a centre crosses its configured capacity threshold, and route generation greedily respects vehicle capacity.

## Product

- Overview dashboard with collection totals, material mix, weekly rhythm, and recent activity
- Deposit recording with automatic credits and threshold-triggered pickup creation
- Centre capacity monitoring, pickup queue, route planning, and driver stop status updates
- Hotspot reporting with severity and status tracking
- Administrator control centre for analytics, verification, cleanup assignment, platform users, fleet, and reward configuration
- Citizen credit balance and reward redemption

## User preferences

No additional preferences recorded.

## Gotchas

- API timestamps must be ISO-formatted because the frontend formats them as dates and times.
- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Demo accounts use the password `plasticloop`; change the seeded credentials before production use.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
