import {Hono} from "hono";
import {requireAuth} from "@/middleware/requireAuth.js";
import {getPagination, makePaginationResult, pagination,} from "@/middleware/pagination.js";
import {foodService} from "@/services/food.service";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import type {PaginationProps} from "@/types/pagination.types";

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
        const decoded = decodeURIComponent(rawName);
        const {rows, total} = await foodService.getFoodByName(decoded, paginationProps);
        return c.json({data: rows, pagination: makePaginationResult(total, c)});
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
        return c.json({error: "Internal server error"}, 500);
    }
});

foodRouter.get("/", pagination(), async (c) => {
    const paginationProps: PaginationProps = getPagination(c);
    const {rows, total} = await foodService.getAllFood(paginationProps);
    return c.json({data: rows, pagination: makePaginationResult(total, c)});
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
        return c.json({error: "Internal server error"}, 500);
    }
});