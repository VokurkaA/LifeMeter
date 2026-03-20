import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import {
  getPagination,
  makePaginationResult,
  pagination,
} from "@/middleware/pagination";
import { foodService } from "@/services/food.service";
import { mealBodySchema, mealUpdateSchema, fullMealResponseSchema, simpleMealResponseSchema } from "@/schemas/user.food.schema";
import type { UserFood } from "@/types/food.type";
import { createLogger } from "@/services/logger.service";
import type { PaginationProps } from "@/types/pagination.types";
import { paginationQuerySchema, createPaginatedResponseSchema } from "@/schemas/pagination.schema";

export const userFoodRouter = new OpenAPIHono<{
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
    pagination: PaginationProps;
  };
}>();

const log = createLogger("User Food Route");

userFoodRouter.use("*", pagination());

const ErrorSchema = z.object({
  error: z.string(),
});

const updateMealRoute = createRoute({
  method: "patch",
  path: "/{id}",
  summary: "Update a user meal",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: mealUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Meal updated",
      content: {
        "application/json": {
          schema: fullMealResponseSchema,
        },
      },
    },
    400: {
      description: "Validation failed",
      content: { "application/json": { schema: ErrorSchema } }
    },
    404: {
      description: "Meal not found",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const getMealByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  summary: "Get a user meal by ID",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: {
      description: "Meal details",
      content: {
        "application/json": {
          schema: fullMealResponseSchema,
        },
      },
    },
    404: {
      description: "Meal not found",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const deleteMealRoute = createRoute({
  method: "delete",
  path: "/{id}",
  summary: "Delete a user meal",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    204: {
      description: "Meal deleted",
    },
    404: {
      description: "Meal not found",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const createMealRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create a new user meal",
  request: {
    body: {
      content: {
        "application/json": {
          schema: mealBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Meal created",
      content: {
        "application/json": {
          schema: simpleMealResponseSchema
        }
      }
    },
    400: {
      description: "Validation failed",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

const getAllMealsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get all user meals with pagination",
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: {
      description: "List of meals",
      content: {
        "application/json": {
          schema: createPaginatedResponseSchema(simpleMealResponseSchema),
        },
      },
    },
    404: {
      description: "No meals found",
      content: { "application/json": { schema: ErrorSchema } }
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorSchema } }
    }
  },
});

userFoodRouter.openapi(updateMealRoute, async (c) => {
  const user = c.get("user")!;
  const { id: mealId } = c.req.valid("param");
  const data = c.req.valid("json");

  try {
    const updatedMeal = await foodService.updateUserMeal(user.id, mealId, data);
    return c.json(updatedMeal, 200);
  } catch (e: any) {
    const msg = e?.message || "Failed to update meal.";
    const status = /not found/i.test(msg) ? 404 : /validation/i.test(msg) ? 400 : 500;
    if (status === 500) log.error(`Error updating meal ${mealId} for user ${user.id}`, { error: e });
    return c.json({ error: msg }, status as any);
  }
});

userFoodRouter.openapi(getMealByIdRoute, async (c) => {
  try {
    const user = c.get("user")!;
    const { id: mealId } = c.req.valid("param");
    const result = await foodService.getUserMealById(user.id, mealId);
    return c.json(result, 200);
  } catch (e: any) {
    const msg = e?.message || "Food entry not found.";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error("Error fetching user meal", { error: e });
    return c.json({ error: msg }, status as any);
  }
});

userFoodRouter.openapi(deleteMealRoute, async (c) => {
  try {
    const user = c.get("user")!;
    const { id: mealId } = c.req.valid("param");
    await foodService.deleteUserMeal(user.id, mealId);
    return c.body(null, 204);
  } catch (e: any) {
    const msg = e?.message || "Failed to delete meal.";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error(`Error deleting meal`, { error: e });
    return c.json({ error: msg }, status as any);
  }
});

userFoodRouter.openapi(createMealRoute, async (c) => {
  const user = c.get("user")!;
  const { name, eaten_at, items } = c.req.valid("json");

  const foods: UserFood[] = items.map((i) => ({
    id: "-",
    user_meal_id: "-",
    food_id: i.food_id,
    total_grams: i.total_grams,
    quantity: i.quantity ?? 1,
    portion_id: i.portion_id ?? undefined,
    description: i.description ?? undefined,
  }));

  try {
    const { meal, food } = await foodService.addUserFood(user.id, foods, name, eaten_at);
    return c.json({ userMeal: meal, userFoods: food }, 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create meal";
    const isValidationError = !/failed/i.test(msg);
    if (!isValidationError) log.error("Error creating user meal", { error: e });
    return c.json({ error: msg }, (isValidationError ? 400 : 500) as any);
  }
});

userFoodRouter.openapi(getAllMealsRoute, async (c) => {
  try {
    const user = c.get("user")!;
    const paginationProps = getPagination(c);
    const { rows, total } = await foodService.getAllUserMeals(user.id, paginationProps);
    return c.json({ rows, total, pagination: makePaginationResult(total, c) }, 200);
  } catch (e: any) {
    const msg = e?.message || "No food entry found.";
    const status = /not found/i.test(msg) ? 404 : 500;
    if (status === 500) log.error("Error fetching all user meals", { error: e });
    return c.json({ error: msg }, status as any);
  }
});
