# LifeMeter Server

Hono + Bun based API server providing authentication (Better Auth) and resources for food metadata, user meals, sleep tracking, workout logging, and user profile/goals.

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
| `POSTGRES_USER` | yes | Database user |
| `POSTGRES_PASSWORD` | yes | Database password |
| `POSTGRES_HOST` | no | Defaults to `localhost` |
| `POSTGRES_PORT` | no | Defaults to `5432` |
| `POSTGRES_DB` | yes | Database name |
| `APP_ENV` | no | If `development` enables openAPI plugin |

## Installation & Running
```bash
# install deps (bun figures out package.json)
bun install

# development (hot reload)
PORT=3000 BETTER_AUTH_SECRET=changeme POSTGRES_USER=... POSTGRES_PASSWORD=... POSTGRES_DB=... bun run dev

# production
PORT=3000 BETTER_AUTH_SECRET=changeme POSTGRES_USER=... POSTGRES_PASSWORD=... POSTGRES_DB=... bun run start
```

### Docker Compose
A `docker-compose.yml` is provided that starts a PostgreSQL 17 database (`db`) and the API server (`api`) together.

```bash
# copy and fill in your secrets
cp .env.example .env

docker compose up --build
```

The `api` service reads environment variables from `.env` and exposes port `3000`. The `db` service uses a named volume (`pgdata`) for persistence and exposes port `5432`.

## Authentication
Better Auth handles session management via email+password. Every incoming request passes through a global middleware in `src/server.ts` that calls `auth.api.getSession()` and injects the result as `c.get("user")` and `c.get("session")` (both `null` for unauthenticated requests).

**Protected routes** apply `requireAuth()` at the router level:
- All `/api/food/*` routes
- All `/api/user/*` routes (including nested sleep, meals, workouts, profile)

**Public routes** (no session required):
- `/api/auth/*` — proxied directly to the better-auth handler
- `/api/workout/*` — reference data (exercises, weight options, set styles/types)
- `GET /api/` and `GET /api/routes`

**Response codes:**
- Unauthenticated: `401 { "error": "Unauthorized" }`
- Authenticated but insufficient role: `403 { "error": "Forbidden" }` (enforced by `requireAdmin()` middleware — checks `user.role` includes `"admin"`)

## Pagination
Some list endpoints support pagination via `?page=` query. The page size is fixed at **100** records (`pagination.config.ts`). Response includes a `pagination` object: `{ page, prevPage, nextPage, totalPages, totalRecords }`.

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
| GET | `/api/food/search?name=term` | yes | Full-text search by name (prefix-aware, ranked) |
| GET | `/api/food/search?gtin=code` | yes | Lookup by GTIN/UPC |
| GET | `/api/food/:id` | yes | Food detail with nutrients & portions |

### Workout Reference Data
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/workout/exercises` | no | List all exercises |
| GET | `/api/workout/weight-options` | no | List weight options |
| GET | `/api/workout/set-styles` | no | List set styles |
| GET | `/api/workout/set-types` | no | List set types |

### User (Profile & Nested Resources)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user` | yes | Returns authenticated user object |

### User Meals
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user/food` | yes | List user meals with raw food item rows (no food detail) |
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

### User Workouts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user/workout` | yes | List user workouts (paginated) |
| POST | `/api/user/workout` | yes | Create a workout with exercises |
| GET | `/api/user/workout/:id` | yes | Get a specific workout |
| PATCH | `/api/user/workout/:id` | yes | Update a workout |
| DELETE | `/api/user/workout/:id` | yes | Delete a workout |

### User Workout Templates
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user/workout/template` | yes | List workout templates (paginated) |
| POST | `/api/user/workout/template` | yes | Create a workout template |
| GET | `/api/user/workout/template/:id` | yes | Get a specific template |
| PATCH | `/api/user/workout/template/:id` | yes | Update a template |
| DELETE | `/api/user/workout/template/:id` | yes | Delete a template |

### User Profile & Goals (`/api/user/data`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user/data/reference/activity-levels` | yes | List activity level options |
| GET | `/api/user/data/reference/length-units` | yes | List length unit options |
| GET | `/api/user/data/reference/weight-units` | yes | List weight unit options |
| GET | `/api/user/data/profile` | yes | Get user profile |
| PUT | `/api/user/data/profile` | yes | Create or update user profile |
| GET | `/api/user/data/goals` | yes | Get user goals |
| PUT | `/api/user/data/goals` | yes | Create or update user goals |
| POST | `/api/user/data/log/weight` | yes | Log a weight measurement |
| GET | `/api/user/data/log/weight/latest` | yes | Get latest weight log |
| POST | `/api/user/data/log/height` | yes | Log a height measurement |

## Data Shapes

### Paginated List Response
List endpoints that support pagination wrap their results:
```jsonc
{
  "rows": [ /* ... resource objects ... */ ],
  "total": 42,
  "pagination": { "page": 1, "prevPage": null, "nextPage": 2, "totalPages": 5, "totalRecords": 42 }
}
```

### Food Detail
Returned by `/api/food/:id` and embedded inside user meal details.
```jsonc
{
  "food": { "id": 1, "branded_food_id": 10, "food_category_id": 3, "description": "Apple" },
  "category": { "id": 3, "name": "Fruits" },       // null if uncategorised
  "brandedFood": {                                  // null for generic foods
    "id": 10, "brand_owner": "Acme", "brand_name": "Acme",
    "subbrand_name": "Organic", "gtin_upc": "012345678901",
    "ingredients": "..."
  },
  "portions": [
    { "id": 10, "food_id": 1, "gram_weight": 150, "portion_amount": 1, "portion_unit": "cup", "modifier": "sliced" }
  ],
  "nutrients": [
    { "food_id": 1, "name": "Energy", "unit": "kcal", "nutrient_nbr": 208, "amount": 52 }
  ]
}
```

### User Meal
Returned by `/api/user/food/:id`. List endpoint (`GET /api/user/food`) returns `{ userMeal, userFoods }` objects where `userFoods` contains raw `UserFood` rows (no embedded food detail).
```jsonc
{
  "userMeal": { "id": "uuid", "user_id": "uuid", "eaten_at": "ISO", "name": "Lunch" },
  "userFoods": [
    {
      "userFood": {
        "id": "uuid", "user_meal_id": "uuid", "food_id": 123,
        "total_grams": 200, "quantity": 1, "portion_id": 10, "description": "sliced"
      },
      "foodDetail": { /* Food Detail */ }
    }
  ]
}
```

### Sleep Entry
Returned by all `/api/user/sleep` endpoints.
```jsonc
{ "id": "uuid", "user_id": "uuid", "sleep_start": "ISO", "sleep_end": "ISO|null", "note": "string|null" }
```

### User Workout
Returned by all `/api/user/workout` endpoints (excluding templates).
```jsonc
{
  "workout": {
    "id": "uuid", "user_id": "uuid", "workout_template_id": "uuid|null",
    "start_date": "ISO", "end_date": "ISO|null", "label": ["string"],"notes": "string|null"
  },
  "sets": [
    {
      "id": "uuid", "workout_id": "uuid", "exercise_id": "uuid", "seq_number": 1,
      "weight": 100, "weight_unit_id": 1, "repetitions": 10,
      "rir": 2, "rest_time": "01:30", "notes": "string|null",
      "style_id": "uuid|null", "set_type_id": "uuid|null"
    }
  ]
}
```

### Workout Template
Returned by all `/api/user/workout/template` endpoints.
```jsonc
{
  "workoutTemplate": {
    "id": "uuid", "user_id": "uuid", "name": "PPL Push",
    "description": "string|null", "label": ["string"],"created_at": "ISO", "updated_at": "ISO"
  },
  "sets": [
    {
      "id": "uuid", "workout_template_id": "uuid", "exercise_id": "uuid", "seq_number": 1,
      "repetitions": 10, "rir": 2, "rest_time": "01:30",
      "notes": "string|null", "style_id": "uuid|null", "set_type_id": "uuid|null"
    }
  ]
}
```

### User Profile
Returned by `GET /PUT /api/user/data/profile`.
```jsonc
{
  "user_id": "uuid", "date_of_birth": "ISO|null", "sex": "M|F|null",
  "current_activity_factor": 1.55, "current_bmr_calories": 1800,
  "default_weight_unit_id": 1, "default_length_unit_id": 1,
  "finished_onboarding": true
}
```

### User Goals
Returned by `GET /PUT /api/user/data/goals`.
```jsonc
{
  "user_id": "uuid",
  "daily_steps_goal": 10000, "bedtime_goal": "23:00:00", "wakeup_goal": "07:00:00",
  "daily_protein_goal_grams": 150, "daily_fat_goal_grams": 70, "daily_carbs_goal_grams": 250,
  "target_weight_grams": 80000, "target_weight_date": "ISO|null"
}
```

### Weight Log Entry
Returned by `POST /api/user/data/log/weight` and `GET /api/user/data/log/weight/latest`.
```jsonc
{
  "id": "uuid", "user_id": "uuid", "measured_at": "ISO",
  "weight_grams": 75000, "body_fat_percentage": 18.5,
  "lean_tissue_percentage": null, "water_percentage": null, "bone_mass_percentage": null
}
```

### Height Log Entry
Returned by `POST /api/user/data/log/height`.
```jsonc
{ "id": "uuid", "user_id": "uuid", "measured_at": "ISO", "height_cm": 178 }
```

## Validation
Zod schemas in the `schemas/` directory enforce payload structure:
- `schemas/user.food.schema.ts` — meal creation and updates
- `schemas/user.workout.schema.ts` — workout and template creation/updates
- `schemas/user.profile.schema.ts` — profile, goals, and measurement logs