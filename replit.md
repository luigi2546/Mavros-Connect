# Mavros Connect

A production-ready SaaS platform for Starlink operators and ISPs to sell hotspot internet access via vouchers, packages, and a branded captive portal.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/mavros-connect run dev` — run the frontend (port 24176, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, TanStack Query
- API: Express 5 with pino logging
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs, jsonwebtoken) — `lib/api-server/src/lib/auth.ts`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth OpenAPI spec; run codegen after changes
- `lib/api-client-react/src/generated/` — generated hooks and Zod schemas (DO NOT edit by hand)
- `lib/db/src/schema/` — Drizzle schema files (one per entity)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, tenants, locations, users, routers, packages, vouchers, payments, sessions, dashboard, portal)
- `artifacts/api-server/src/middlewares/authenticate.ts` — JWT bearer auth middleware
- `artifacts/mavros-connect/src/` — React frontend (pages, contexts, components)
- `artifacts/mavros-connect/src/contexts/AuthContext.tsx` — JWT auth context

## Architecture decisions

- **Multi-tenant by design** — every DB table has `tenantId`; all queries are scoped to `req.user.tenantId` from the JWT payload.
- **Enum columns use different names than TS fields** — Drizzle maps e.g. `status` → `location_status` column. Raw SQL must use the column name (`location_status`, `router_status`, `package_status`, `voucher_status`, `payment_status`, `session_status`). Drizzle queries use the TS field name (`status`).
- **JWT auth** — access token (15m) + refresh token (7d). Stored in localStorage under keys `mavros_access_token` / `mavros_user`. `setAuthTokenGetter` wires up bearer auth on every API call.
- **MikroTik integration is simulated** — `POST /api/routers/:id/test` returns random online/offline. Replace with `routeros-client` for production.
- **Captive portal** — public routes under `/api/portal/:tenantSlug/` (no auth required) for customer-facing hotspot access.

## Product

- **Operator dashboard** — revenue analytics, session monitoring, router status, voucher management
- **Package management** — create tiered internet packages (hourly, daily, weekly, monthly) with speed/data caps
- **Voucher system** — generate individual or bulk vouchers (up to 1000 at once), 8-char alphanumeric codes
- **Payments** — supports MoMo, Paystack, cash; webhook handlers for Paystack events
- **Captive portal** — branded public portal at `/portal/:tenantSlug` for end-user voucher redemption
- **Multi-location** — manage multiple hotspot locations with per-location router assignments

## Demo credentials

- **Login:** `admin@accrawifi.com` / `admin123`
- **Tenant slug:** `accra-wifi-hub`
- **Portal URL:** `/portal/accra-wifi-hub`
- **Demo vouchers:** `DEMO1234`, `FAST5678`, `WIFI9012`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before editing frontend pages.
- DB enum column names differ from Drizzle field names — see Architecture decisions above.
- Payment method enum values: `paystack`, `momo`, `cash`, `other` (not `card`).
- Do NOT import from `@workspace/api-client-react/src/custom-fetch` directly — `setAuthTokenGetter` and all exports are available via `@workspace/api-client-react`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
