import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { requireAuth } from "@/middleware/requireAuth.js";
import {
  getPagination,
  makePaginationResult,
  pagination,
} from "@/middleware/pagination.js";
import { foodService } from "@/services/food.service";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import { createLogger } from "@/services/logger.service";
import type { PaginationProps } from "@/types/pagination.types";
import { foodSchema, foodDetailSchema } from "@/schemas/food.schema";
import { paginationQuerySchema, createPaginatedResponseSchema } from "@/schemas/pagination.schema";

export const foodRouter = new OpenAPIHono<{
  Variables: { user: AuthUser | null; session: AuthSession | null };
}>();

const log = createLogger("Food Route");

foodRouter.use("*", requireAuth());
foodRouter.use("*", pagination());

const searchFoodRoute = createRoute({
  method: "get",
  path: "/search",
  summary: "Search for food by name or GTIN",
  request: {
    query: z.object({
      name: z.string().optional().openapi({ example: "Apple" }),
      gtin: z.string().optional().openapi({ example: "0123456789012" }),
    }).merge(paginationQuerySchema)
    .refine(data => (data.name || data.gtin) && !(data.name && data.gtin), {
      message: "Provide either 'name' or 'gtin', not both",
      path: ["name"]
    }),
  },
  responses: {
    200: { 
      description: "Search results",
      content: {
        "application/json": {
          schema: z.union([createPaginatedResponseSchema(foodSchema), foodDetailSchema])
        }
      }
    },
    400: { description: "Invalid parameters" },
    404: { description: "Food not found" },
    500: { description: "Internal server error" },
  },
});

const getAllFoodRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get all food items with pagination",
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: { 
      description: "List of food items",
      content: {
        "application/json": {
          schema: createPaginatedResponseSchema(foodSchema)
        }
      }
    },
    500: { description: "Internal server error" },
  },
});

const getFoodByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  summary: "Get food item by ID",
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().openapi({ example: 1 }),
    }),
  },
  responses: {
    200: { 
      description: "Food item details",
      content: {
        "application/json": {
          schema: foodDetailSchema
        }
      }
    },
    400: { description: "Invalid ID" },
    404: { description: "Food not found" },
    500: { description: "Internal server error" },
  },
});

foodRouter.openapi(searchFoodRoute, async (c) => {
  const paginationProps: PaginationProps = getPagination(c);
  const { name: rawName, gtin } = c.req.valid("query");

  if (rawName) {
    try {
      const { rows, total } = await foodService.getFoodByName(rawName, paginationProps);
      return c.json({ rows, total, pagination: makePaginationResult(total, c) }, 200);
    } catch (e: any) {
      log.error(`Failed to search food by name: ${rawName}`, { error: e });
      return c.json({ error: "Internal server error" }, 500);
    }
  }

  try {
    const data = await foodService.getFoodByGtin(gtin!);
    return c.json(data, 200);
  } catch (e: any) {
    if (e.message?.includes("Food not found")) return c.json({ error: e.message }, 404);
    log.error(`Failed to search food by GTIN: ${gtin}`, { error: e });
    return c.json({ error: "Internal server error" }, 500);
  }
});

foodRouter.openapi(getAllFoodRoute, async (c) => {
  try {
    const paginationProps: PaginationProps = getPagination(c);
    const { rows, total } = await foodService.getAllFood(paginationProps);
    return c.json({ rows, total, pagination: makePaginationResult(total, c) }, 200);
  } catch (e: any) {
    log.error("Failed to fetch all foods", { error: e });
    return c.json({ error: "Internal server error" }, 500);
  }
});

foodRouter.openapi(getFoodByIdRoute, async (c) => {
  const { id } = c.req.valid("param");
  try {
    const data = await foodService.getFoodById(id);
    return c.json(data, 200);
  } catch (e: any) {
    if (e.message?.includes("Food not found")) return c.json({ error: e.message }, 404);
    log.error(`Failed to get food by ID: ${id}`, { error: e });
    return c.json({ error: "Internal server error" }, 500);
  }
});
