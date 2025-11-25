# LifeMeter Server

Hono + Bun based API server providing authentication (Better Auth) and resources for food metadata, user meals, and sleep tracking.

## Tech Stack
- **Runtime:** Bun
- **Framework:** Hono
- **Auth:** better-auth (+ plugins: admin, lastLoginMethod, multiSession, emailHarmony, phoneHarmony, openAPI in development)
- **DB:** PostgreSQL (`pg` driver)
- **Validation:** Zod

## Environment Variables
| Name | Required | Description |
|------|----------|-------------|
| `PORT` | yes | Port to run the Bun server |
| `BETTER_AUTH_SECRET` | yes | Secret for Better Auth |
| `BASE_URL` | no | Overrides auto-generated base URL (defaults to http://localhost:PORT) |
| `USE_CORS` | no | Enable CORS if set to `true` |
| `CORS_ORIGINS` | no | Comma separated list of allowed origins (fallback defaults inside code) |
| `DB_USER` | yes | Database user |
| `DB_PASSWORD` | yes | Database password |
| `DB_HOST` | no | Defaults to `localhost` |
| `DB_PORT` | no | Defaults to `5432` |
| `DB_NAME` | yes | Database name |
| `APP_ENV` | no | If `development` enables openAPI plugin |

## Installation & Running
```bash
# install deps (bun figures out package.json)
bun install

# development (hot reload)
PORT=3000 BETTER_AUTH_SECRET=changeme DB_USER=... DB_PASSWORD=... DB_NAME=... bun run dev

# production
PORT=3000 BETTER_AUTH_SECRET=changeme DB_USER=... DB_PASSWORD=... DB_NAME=... bun run start
```

## Authentication
All routes under `/api/user/*`, `/api/food/*`, and nested user resource routes require an authenticated session. Session is resolved in `src/server.ts` and injected as `c.get("user")` and `c.get("session")`.

Unauthorized requests return `401 {"error":"Unauthorized"}`. Admin-only routes (if added) should wrap with `requireAdmin()`.

## Pagination
Some list endpoints support pagination via `?page=` query and a fixed `limit` (see `pagination.config.ts`). Response includes a `pagination` object: `{ page, prevPage, nextPage, totalPages, totalRecords }`.

## Error Conventions
- Validation errors: `400 { error, issues? }`
- Not found: `404 { error }`
- Forbidden: `403 { error }`
- Server errors: `500 { error }`

## API Overview
Base path: `/api`

### Root
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/` | no | Health status |
| GET | `/api/routes` | no | Lists structured endpoint map |

### Auth (Better Auth passthrough)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/auth/*` | no | Handled by better-auth handler |

### Food (Public Food Metadata)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/food` | yes | Paginated list of food items |
| GET | `/api/food/search?name=term` | yes | Search by name (ILIKE) |
| GET | `/api/food/search?gtin=code` | yes | Lookup by GTIN/UPC |
| GET | `/api/food/:id` | yes | Food detail with nutrients & portions |

### User (Profile & Nested Resources)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user` | yes | Returns authenticated user object |

### User Meals
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user/food` | yes | List user meals with embedded foods |
| POST | `/api/user/food` | yes | Create a meal with food items |
| GET | `/api/user/food/:id` | yes | Get a specific meal with food details |
| PATCH | `/api/user/food/:id` | yes | Replace meal items / update name/eaten_at |
| DELETE | `/api/user/food/:id` | yes | Delete a meal |

### User Sleep
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/user/sleep/start` | yes | Start a new sleep entry (open) |
| POST | `/api/user/sleep/end` | yes | End latest open sleep entry |
| POST | `/api/user/sleep/new` | yes | Create entry with explicit start/end |
| GET | `/api/user/sleep` | yes | List sleep entries |
| GET | `/api/user/sleep/:id` | yes | Get a sleep entry |
| PATCH | `/api/user/sleep/:id` | yes | Modify a sleep entry |
| DELETE | `/api/user/sleep/:id` | yes | Delete a sleep entry |

## Data Shapes (Selected)
### Food Detail
Returned by `/api/food/:id` and included in user meal details.
```jsonc
{
  "food": { "id": 1, "description": "Apple" },
  "category": { /* may be null */ },
  "brandedFood": { /* may be null */ },
  "portions": [ { "id": 10, "gram_weight": 150 } ],
  "nutrients": [ { "name": "Energy", "amount": 52, "unit": "kcal" } ]
}
```

### User Meal
```jsonc
{
  "userMeal": { "id": "uuid", "eaten_at": "ISO", "name": "Lunch" },
  "userFoods": [
    {
      "userFood": { "id": "uuid", "food_id": 123, "total_grams": 200 },
      "foodDetail": { /* Food Detail */ }
    }
  ]
}
```

## Validation (Meals)
Zod schemas in `schemas/user.food.schema.ts` enforce payload structure for meal creation and updates.

## Extensibility Suggestions
- Add rate limiting middleware.
- Add OpenAPI generation (already toggled in development via plugin) and expose docs route.
- Implement ETag / caching for food list & search.
- Add indexing / materialized views for nutrient-heavy queries.

## License
Proprietary / Internal (update if needed)
