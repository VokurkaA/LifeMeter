import { z } from "@hono/zod-openapi";

export const SleepEntrySchema = z.object({
  id: z.string().openapi({ example: "123" }),
  user_id: z.string().openapi({ example: "user_123" }),
  sleep_start: z.string().openapi({ example: "2023-10-01T22:00:00Z" }),
  sleep_end: z.string().nullable().openapi({ example: "2023-10-02T06:00:00Z" }),
  note: z.string().nullable().openapi({ example: "Good night sleep" }),
}).openapi("SleepEntry");

export const StartSleepSchema = z.object({
  startAt: z.string().optional().openapi({ example: "2023-10-01T22:00:00Z" }),
  note: z.string().optional().nullable().openapi({ example: "Feeling tired" }),
}).openapi("StartSleep");

export const EndSleepSchema = z.object({
  endAt: z.string().optional().openapi({ example: "2023-10-02T06:00:00Z" }),
}).openapi("EndSleep");

export const NewSleepEntrySchema = z.object({
  startAt: z.string().openapi({ example: "2023-10-01T22:00:00Z" }),
  endAt: z.string().optional().nullable().openapi({ example: "2023-10-02T06:00:00Z" }),
  note: z.string().optional().nullable().openapi({ example: "Regular sleep" }),
}).openapi("NewSleepEntry");

export const UpdateSleepEntrySchema = z.object({
  startAt: z.string().optional().openapi({ example: "2023-10-01T22:00:00Z" }),
  endAt: z.string().optional().nullable().openapi({ example: "2023-10-02T06:00:00Z" }),
  note: z.string().optional().nullable().openapi({ example: "Updated note" }),
}).openapi("UpdateSleepEntry");
