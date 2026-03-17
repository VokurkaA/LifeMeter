import { z } from "@hono/zod-openapi";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().optional().openapi({ example: 1, description: "Page number" }),
  limit: z.coerce.number().optional().openapi({ example: 10, description: "Number of items per page" }),
});

export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  rows: z.array(itemSchema),
  total: z.number().openapi({ example: 100 }),
  pagination: z.object({
    page: z.number().openapi({ example: 1 }),
    prevPage: z.number().nullable().openapi({ example: null }),
    nextPage: z.number().nullable().openapi({ example: 2 }),
    totalPages: z.number().openapi({ example: 10 }),
    totalRecords: z.number().openapi({ example: 100 }),
  })
});
