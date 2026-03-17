import { z } from "@hono/zod-openapi";

export const userSchema = z.object({
  id: z.string().openapi({ example: "user_123" }),
  email: z.string().email().openapi({ example: "user@example.com" }),
  emailVerified: z.boolean().openapi({ example: true }),
  name: z.string().openapi({ example: "John Doe" }),
  createdAt: z.string().datetime().openapi({ example: "2023-10-01T12:00:00Z" }),
  updatedAt: z.string().datetime().openapi({ example: "2023-10-01T12:00:00Z" }),
  image: z.string().nullable().optional().openapi({ example: "https://example.com/image.png" }),
  role: z.string().nullable().optional().openapi({ example: "user" }),
  banned: z.boolean().nullable().optional().openapi({ example: false }),
  banReason: z.string().nullable().optional().openapi({ example: null }),
  banExpires: z.string().nullable().optional().openapi({ example: null }),
}).openapi("User");
