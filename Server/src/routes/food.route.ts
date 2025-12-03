import { Hono } from "hono";
import { requireAuth } from "@/middleware/requireAuth.js";
import { getPagination, makePaginationResult, pagination, type PaginationProps, } from "@/middleware/pagination.js";
import { foodService } from "@/services/food.service";
import type { AuthSession, AuthUser } from "@/types/auth.types";
import {logger} from "@/services/logger.service";

export const foodRouter = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

foodRouter.use("*", requireAuth());

foodRouter.get("/search", pagination(), async (c) => {
    const paginationProps: PaginationProps = getPagination(c);
    const rawName = c.req.query("name");
    const gtin = c.req.query("gtin");

    if ((!rawName || rawName.trim() === "") && !gtin) {
        return c.json({error: "Either 'name' or 'gtin' query parameter is required"}, 400);
    }
    if (rawName && gtin) {
        return c.json({error: "Provide either 'name' or 'gtin', not both"}, 400);
    }

    if (rawName) {
        try {
            const decoded = decodeURIComponent(rawName);
            const {rows, total} = await foodService.getFoodByName(decoded, paginationProps);
            return c.json({data: rows, pagination: makePaginationResult(total, c)});
        } catch (e: any) {
            logger.error(`Failed to search food by name: ${rawName}`, e);
            return c.json({error: "Internal server error"}, 500);
        }
    }

    if (!gtin) {
        return c.json({error: "gtin is required"}, 400);
    }

    try {
        const data = await foodService.getFoodByGtin(gtin);
        return c.json({data});
    } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("Food not found")) {
            return c.json({error: e.message}, 404);
        }
        logger.error(`Failed to search food by GTIN: ${gtin}`, e);
        return c.json({error: "Internal server error"}, 500);
    }
});

foodRouter.get("/", pagination(), async (c) => {
    try {
        const paginationProps: PaginationProps = getPagination(c);
        const {rows, total} = await foodService.getAllFood(paginationProps);
        return c.json({data: rows, pagination: makePaginationResult(total, c)});
    } catch (e: any) {
        logger.error("Failed to fetch all foods", e);
        return c.json({error: "Internal server error"}, 500);
    }
});

foodRouter.get("/:id", async (c) => {
    const idParam = c.req.param("id");
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
        return c.json({error: "Invalid id. Must be a positive integer."}, 400);
    }
    try {
        const data = await foodService.getFoodById(id);
        return c.json(data);
    } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("Food not found")) {
            return c.json({error: e.message}, 404);
        }
        logger.error(`Failed to get food by ID: ${id}`, e);
        return c.json({error: "Internal server error"}, 500);
    }
});