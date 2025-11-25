import {Hono} from "hono";
import type {AuthSession, AuthUser} from "@/types/auth.types";
import {requireAuth} from "@/middleware/requireAuth";
import {pagination} from "@/middleware/pagination";
import {foodService} from "@/services/food.service";
import {mealBodySchema, mealUpdateSchema} from "@/schemas/user.food.schema";
import type {UserFood} from "@/types/food.type";

export const userFoodRouter = new Hono<{ Variables: { user: AuthUser | null; session: AuthSession | null } }>();

userFoodRouter.use("*", requireAuth());

userFoodRouter.patch('/:id', async (c) => {
    const user = c.get("user")!;
    const mealId = c.req.param("id");
    const rawBody = await c.req.json();

    const parsed = mealUpdateSchema.safeParse(rawBody);

    if (!parsed.success) {
        return c.json({
            error: "Validation failed", issues: parsed.error.issues.map(i => ({
                path: i.path.join("."), message: i.message
            }))
        }, 400);
    }

    try {
        const updatedMeal = await foodService.updateUserMeal(user.id, mealId, parsed.data);
        return c.json(updatedMeal);
    } catch (e: any) {
        const msg = e?.message || "Failed to update meal.";
        const status = /not found/i.test(msg) ? 404 : /validation/i.test(msg) ? 400 : 500;
        return c.json({error: msg}, status);
    }
})

userFoodRouter.get('/:id', async (c) => {
    try {
        const user = c.get("user")!;
        const mealId = c.req.param(decodeURIComponent("id"));

        if (!mealId) {
            return c.json({error: "Meal ID is required."}, 400);
        }

        const result = await foodService.getUserMealById(user.id, mealId);
        return c.json(result);

    } catch (e: any) {
        const msg = e?.message || "Food entry not found.";
        const status = /not found/i.test(msg) ? 404 : /earlier than/i.test(msg) ? 400 : 500;
        return c.json({error: msg}, status);
    }
});

userFoodRouter.delete('/:id', async (c) => {
    try {
        const user = c.get("user")!;
        const mealId = c.req.param(decodeURIComponent("id"));

        if (!mealId) {
            return c.json({error: "Meal ID is required."}, 400);
        }

        await foodService.deleteUserMeal(user.id, mealId);

        return c.body(null, 204);

    } catch (e: any) {
        const msg = e?.message || "Failed to delete meal.";
        const status = /not found/i.test(msg) ? 404 : 500;
        return c.json({error: msg}, status);
    }
})

userFoodRouter.post('/', async (c) => {
    const user = c.get("user")!;
    const rawBody = await c.req.json();

    const parsed = mealBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        return c.json({
            error: "Validation failed", issues: parsed.error.issues.map(i => ({
                path: i.path.join("."), message: i.message
            }))
        }, 400);
    }

    const {name, eaten_at, items} = parsed.data;
    const mealName = name;
    const eatenAt = eaten_at || new Date().toISOString();

    const foods: UserFood[] = items.map(i => ({
        id: "-",
        user_meal_id: "-",
        food_id: i.food_id,
        total_grams: i.total_grams,
        quantity: i.quantity ?? 1,
        portion_id: i.portion_id ?? undefined,
        description: i.description ?? undefined,
    }));

    try {
        const {meal, food} = await foodService.addUserFood(user.id, foods, mealName, eatenAt);

        return c.json({meal, food}, 201);
    } catch (e: any) {
        const msg = e?.message || "Failed to create meal";
        return c.json({error: msg}, /failed/i.test(msg) ? 500 : 400);
    }
});

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