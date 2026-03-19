

# Build REST API Endpoints

## Overview
Create a single Supabase Edge Function (`api-v1`) that serves as a REST API gateway, matching the endpoints shown on the API documentation page. External consumers authenticate via API keys stored in a new `api_keys` table.

## Endpoints to implement

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/locations | List locations (paginated) |
| POST | /api/v1/locations | Create a location |
| GET | /api/v1/drop-points | List drop points (filterable by location_id) |
| POST | /api/v1/work-orders | Create a work order |
| GET | /api/v1/employees | List employees |

## Database Changes

### New table: `api_keys`
- `id` (uuid, PK)
- `organization_id` (uuid, FK → organizations)
- `key_hash` (text, unique) — SHA-256 hash of the API key
- `key_prefix` (text) — first 8 chars for display (e.g., `ta_live_ab...`)
- `name` (text) — user-given label
- `scopes` (text[]) — e.g., `['locations:read', 'work-orders:write']`
- `is_active` (boolean, default true)
- `last_used_at` (timestamptz)
- `expires_at` (timestamptz, nullable)
- `created_at`, `updated_at`

RLS: org members with admin/project_manager roles can manage their org's keys.

## Edge Function: `api-v1`

Single function that:
1. Parses the path from a query param or request path suffix
2. Validates the `Authorization: Bearer <api_key>` header by hashing and looking up in `api_keys`
3. Scopes all queries to the key's `organization_id`
4. Routes to the correct handler based on method + path
5. Returns paginated JSON responses in the format shown on the API docs page:
```json
{
  "data": [...],
  "meta": { "total": 42, "page": 1, "per_page": 25 }
}
```

### Authentication flow
- Hash incoming bearer token with SHA-256
- Look up `key_hash` in `api_keys` table using service role client
- Verify `is_active = true` and not expired
- Extract `organization_id` and `scopes` for authorization
- Update `last_used_at`

### Endpoint handlers
- **GET locations**: Select from `locations` where `organization_id` matches, support `?page=` and `?per_page=` params
- **POST locations**: Insert into `locations` with org_id, validate required fields (name, address)
- **GET drop-points**: Select from `drop_points` where `organization_id` matches, support `?location_id=` filter
- **POST work-orders**: Insert into `work_orders` with org_id, validate required fields (title)
- **GET employees**: Select from `employees` where `organization_id` matches

## Frontend Changes

### API Keys Management UI (update `APIKeysManager.tsx`)
- Add ability to generate, view (prefix only), and revoke API keys
- Show scopes, last used, and expiration
- Generate key client-side, send hash to DB, show full key once

### API Page (`APIPage.tsx`)
- Update the Quick Start code example to use the real Supabase function URL
- Update "Get API Key" button to link to Settings

## Config
```toml
[functions.api-v1]
verify_jwt = false
```

## Files to create/modify
1. **Create** migration for `api_keys` table + RLS policies
2. **Create** `supabase/functions/api-v1/index.ts` — the REST API gateway
3. **Update** `supabase/config.toml` — add function config
4. **Update** `src/components/APIKeysManager.tsx` — full key management UI
5. **Update** `src/pages/APIPage.tsx` — real endpoint URLs

