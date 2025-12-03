import {pool} from "@/config/db.config.js";
import type {Food, FoodDetail, FullUserFood, FullUserMeal, UserFood, UserMeal,} from "@/types/food.type";
import {mealUpdateSchema} from "@/schemas/user.food.schema";
import type {PaginationProps} from "@/types/pagination.types";

export interface PaginatedFoodResult {
    rows: Food[];
    total: number;
}

interface CountRow {
    total: string;
}

class FoodService {
    async getAllFood(paginationProps: PaginationProps): Promise<PaginatedFoodResult> {
        const {limit, offset} = paginationProps;
        const countQuery = `SELECT COUNT(id)::text AS total
                            FROM food`;
        const dataQuery = `
            SELECT id, branded_food_id, food_category_id, description
            FROM food
            ORDER BY id
            LIMIT $1 OFFSET $2
        `;
        const [countResult, dataResult] = await Promise.all([pool.query<CountRow>(countQuery), pool.query<Food>(dataQuery, [limit, offset])]);
        return {rows: dataResult.rows, total: this.parseTotal(countResult.rows[0]?.total)};
    }

    async getFoodByName(name: string, paginationProps: PaginationProps): Promise<PaginatedFoodResult> {
        const trimmed = name.trim();
        if (!trimmed) return {rows: [], total: 0};

        const searchTerm = `%${trimmed}%`;
        const countQuery = `SELECT COUNT(id)::text AS total
                            FROM food
                            WHERE description ILIKE $1`;
        const dataQuery = `
            SELECT id, branded_food_id, food_category_id, description
            FROM food
            WHERE description ILIKE $1
            ORDER BY id
            LIMIT $2 OFFSET $3
        `;

        const [countResult, dataResult] = await Promise.all([pool.query<CountRow>(countQuery, [searchTerm]), pool.query<Food>(dataQuery, [searchTerm, paginationProps.limit, paginationProps.offset])]);

        return {rows: dataResult.rows, total: this.parseTotal(countResult.rows[0]?.total)};
    }

    async getFoodById(id: number): Promise<FoodDetail> {
        if (!id || !Number.isInteger(id)) throw new Error("Invalid foodId");

        const rows = await this.getFoodDetails([id]);
        if (rows.length === 0) throw new Error("Food not found");

        return rows[0];
    }

    async getFoodByGtin(gtin: string): Promise<FoodDetail> {
        const query = `
            SELECT f.id
            FROM food f
                     JOIN branded_food bf ON f.branded_food_id = bf.id
            WHERE bf.gtin_upc = $1
        `;
        const res = await pool.query<{ id: number }>(query, [gtin]);
        if (res.rows.length === 0) throw new Error("Food not found");

        return this.getFoodById(res.rows[0].id);
    }

    async getUserMealById(userId: string, userMealId: string): Promise<FullUserMeal> {
        const mealQuery = `
            SELECT id, user_id, eaten_at, name
            FROM user_meal
            WHERE user_id = $1
              AND id = $2
        `;
        const foodQuery = `
            SELECT id, user_meal_id, food_id, total_grams, quantity, portion_id, description
            FROM user_food
            WHERE user_meal_id = $1
        `;
        const [mealResult, foodResult] = await Promise.all([pool.query<UserMeal>(mealQuery, [userId, userMealId]), pool.query<UserFood>(foodQuery, [userMealId])]);
        if (mealResult.rows.length === 0) throw new Error("Meal not found");

        const foodIds = [...new Set(foodResult.rows.map(uf => uf.food_id))];
        if (foodIds.length === 0) return {userMeal: mealResult.rows[0], userFoods: []};

        const foodDetails: FoodDetail[] = await this.getFoodDetails(foodIds);

        const foodMap = new Map<number, FoodDetail>();
        foodDetails.forEach(detail => foodMap.set(detail.food.id, detail));

        const fullUserFoods: FullUserFood[] = foodResult.rows.map(uf => {
            const detail = foodMap.get(uf.food_id);
            if (!detail) throw new Error(`Data integrity error: Food ${uf.food_id} missing`);
            return {userFood: uf, foodDetail: detail};
        });

        return {userMeal: mealResult.rows[0], userFoods: fullUserFoods};
    }

    async getAllUserMeals(userId: string): Promise<{ userMeal: UserMeal; userFoods: UserFood[] }[]> {
        const query = `
            SELECT to_jsonb(um.*)                as "userMeal",
                   COALESCE(f.data, '[]'::jsonb) as "userFoods"
            FROM user_meal um
                     LEFT JOIN LATERAL (
                SELECT jsonb_agg(uf.* ORDER BY uf.id) as data
                FROM user_food uf
                WHERE uf.user_meal_id = um.id
                ) f ON true
            WHERE um.user_id = $1
            ORDER BY um.eaten_at DESC
        `;

        const result = await pool.query<{ userMeal: UserMeal; userFoods: UserFood[] }>(query, [userId]);
        return result.rows;
    }

    async addUserFood(userId: string, userFoods: UserFood[], mealName: string | undefined, eatenAt: string) {
        const mealQuery = `
            INSERT INTO user_meal (user_id, eaten_at, name)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, eaten_at, name
        `
        const mealQueryResult = await pool.query<UserMeal>(mealQuery, [userId, eatenAt, mealName]);
        const meal = mealQueryResult.rows[0];
        if (!meal.id) throw new Error("Failed to initialize user meal.");

        const values: (string | number | null)[] = [];
        const valuePlaceholders: string[] = [];
        let paramIndex = 1;

        for (const food of userFoods) {
            const placeholders = [
                `$${paramIndex++}`, // user_meal_id
                `$${paramIndex++}`, // food_id
                `$${paramIndex++}`, // total_grams
                `$${paramIndex++}`, // quantity
                `$${paramIndex++}`, // portion_id
                `$${paramIndex++}`  // description
            ];
            valuePlaceholders.push(`(${placeholders.join(', ')})`);

            values.push(meal.id, food.food_id, food.total_grams, food.quantity, food.portion_id ?? null, food.description ?? null);
        }

        const foodQuery = `INSERT INTO user_food (user_meal_id, food_id, total_grams, quantity, portion_id, description) VALUES ${valuePlaceholders.join(', ')} 
                           RETURNING id, user_meal_id, food_id, total_grams, quantity, portion_id, description`;
        const foods = await pool.query<UserFood>(foodQuery, values);
        return {meal, food: foods.rows};
    }

    async deleteUserMeal(userId: string, mealId: string): Promise<void> {
        const deleteQuery = `
            DELETE
            FROM user_meal
            WHERE id = $1
              AND user_id = $2
        `;
        const result = await pool.query(deleteQuery, [mealId, userId]);
        if (result.rowCount === 0) {
            throw new Error("Meal not found");
        }
    }

    async updateUserMeal(userId: string, mealId: string, data: {
        name?: string; eaten_at?: string; items?: Array<{
            food_id: number;
            total_grams: number;
            quantity?: number;
            portion_id?: number | null;
            description?: string | null;
        }>;
    }): Promise<FullUserMeal> {
        const existsQuery = `
            SELECT id
            FROM user_meal
            WHERE id = $1
              AND user_id = $2
        `;
        const exists = await pool.query<{ id: string }>(existsQuery, [mealId, userId]);
        if (exists.rows.length === 0) throw new Error("Meal not found");

        const parsed = mealUpdateSchema.safeParse(data);
        if (!parsed.success) {
            const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
            throw new Error(`Validation failed: ${msg}`);
        }
        const updateData = parsed.data;

        if (updateData.name !== undefined || updateData.eaten_at !== undefined) {
            const updateMealQuery = `
                UPDATE user_meal
                SET name     = COALESCE($3, name),
                    eaten_at = COALESCE($4, eaten_at)
                WHERE id = $1
                  AND user_id = $2
                RETURNING id, user_id, eaten_at, name
            `;
            await pool.query<UserMeal>(updateMealQuery, [mealId, userId, updateData.name ?? null, updateData.eaten_at ?? null]);
        }

        if (updateData.items !== undefined) {
            await pool.query(`
                DELETE
                FROM user_food
                WHERE user_meal_id = $1
            `, [mealId]);

            if (updateData.items.length > 0) {
                const values: (string | number | null)[] = [];
                const placeholders: string[] = [];
                let p = 1;

                for (const item of updateData.items) {
                    placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
                    values.push(mealId, item.food_id, item.total_grams, item.quantity ?? 1, item.portion_id ?? null, item.description ?? null);
                }

                const insertQuery = `
                    INSERT INTO user_food (user_meal_id, food_id, total_grams, quantity, portion_id, description) VALUES
                        ${placeholders.join(", ")}
                `;
                await pool.query(insertQuery, values);
            }
        }

        return this.getUserMealById(userId, mealId);
    }

    private async getFoodDetails(foodIds: number[]): Promise<FoodDetail[]> {
        const query = `
            SELECT json_build_object(
                           'food', to_jsonb(f.*),
                           'category', CASE WHEN fc.id IS NOT NULL THEN to_jsonb(fc.*) ELSE 'null'::jsonb END,
                           'brandedFood', CASE WHEN bf.id IS NOT NULL THEN to_jsonb(bf.*) ELSE 'null'::jsonb END,
                           'portions', COALESCE(portions_agg.data, '[]'::jsonb),
                           'nutrients', COALESCE(nutrients_agg.data, '[]'::jsonb)
                   ) as detail
            FROM food f
                     LEFT JOIN food_category fc ON f.food_category_id = fc.id
                     LEFT JOIN branded_food bf ON f.branded_food_id = bf.id
                     LEFT JOIN LATERAL (
                SELECT jsonb_agg(p.* ORDER BY p.id) as data
                FROM portion p
                WHERE p.food_id = f.id
                ) portions_agg ON true
                     LEFT JOIN LATERAL (
                SELECT jsonb_agg(json_build_object(
                                         'food_id', nv.food_id,
                                         'name', n.name,
                                         'unit', n.unit,
                                         'nutrient_nbr', n.nutrient_nbr,
                                         'amount', nv.amount
                                 ) ORDER BY n.nutrient_nbr) as data
                FROM nutrient_value nv
                         JOIN nutrient n ON nv.nutrient_id = n.id
                WHERE nv.food_id = f.id
                ) nutrients_agg ON true
            WHERE f.id = ANY ($1::int[])
        `;

        const result = await pool.query<{ detail: FoodDetail }>(query, [foodIds]);
        return result.rows.map(r => r.detail);
    }

    private parseTotal(value?: string): number {
        const num = parseInt(value ?? "0", 10);
        return Number.isNaN(num) || num < 0 ? 0 : num;
    }
}

export const foodService = new FoodService();