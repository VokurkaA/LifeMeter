import {Hono} from "hono";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import {requireAuth} from "@/middleware/requireAuth";
import {pagination} from "@/middleware/pagination";
import {foodService} from "@/services/food.service";

export const userFoodRouter = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

userFoodRouter.use("*", requireAuth());

userFoodRouter.patch('/:id', async (c) => {
    const user = c.get("user")!;
    const mealId = c.req.param("id");
    const body = await c.req.json<{
        name?: string; eaten_at?: string; items?: Array<{
            id?: string;
            food_id: number;
            total_grams: number;
            quantity?: number;
            portion_id?: number | null;
            description?: string | null;
        }>
    }>();
    try {

    } catch (e: any) {

    }
})

userFoodRouter.get('/:id', async (c) => {
    try {
        const user = c.get("user")!;
        const mealId = c.req.param("id");

        const result = await foodService.getUserMealById(user.id, mealId);
        return c.json(result);

    } catch (e: any) {
        const msg = e?.message || "Food entry not found.";
        const status = /not found/i.test(msg) ? 404 : /earlier than/i.test(msg) ? 400 : 500;
        return c.json({error: msg}, status);
    }
});

userFoodRouter.delete('/:id', async (c) => {

})

userFoodRouter.post('/', async (c) => {
    // body:
    // name
    // eaten ? now
    // userFood [] {food_id, total_grams, quantity, portion_id?, description? }
})

userFoodRouter.get('/', pagination(), async (c) => {
    try {
        const user = c.get("user")!;

        const result = await foodService.getAllUserMeals(user.id);
        return c.json(result);

    } catch (e: any) {
        const msg = e?.message || "No food entry not found.";
        const status = /not found/i.test(msg) ? 404 : /earlier than/i.test(msg) ? 400 : 500;
        return c.json({error: msg}, status);
    }
})