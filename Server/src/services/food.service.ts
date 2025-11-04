import { pool } from "@/config/db.config.js";
import type { PaginationProps } from "@/middleware/pagination.js";
import type { BrandedFood, CompleteNutrient, Food, FoodCategory, FoodDetail, Portion } from "@/types/food.type";

/**
 * Result shape for paginated food lists.
 */
export interface PaginatedFoodResult {
    rows: Food[];
    total: number;
}

interface CountRow {
    total: string;
}

/**
 * Service handling food related database operations.
 */
class FoodService {
    /**
     * Return paginated list of all food items.
     * @param paginationProps Pagination settings (limit, offset)
     * @returns Promise with rows and total count
     */
    async getAllFood(paginationProps: PaginationProps): Promise<PaginatedFoodResult> {
        const {limit, offset} = paginationProps;
        const countQuery = `
            SELECT COUNT(id)::text AS total
            FROM food
        `;
        const dataQuery = `
            SELECT id, branded_food_id, food_category_id, description
            FROM food
            ORDER BY id
            LIMIT $1 OFFSET $2
        `;
        const [countResult, dataResult] = await Promise.all([pool.query<CountRow>(countQuery), pool.query<Food>(dataQuery, [limit, offset])]);
        const total = this.parseTotal(countResult.rows[0]?.total);
        return {rows: dataResult.rows, total};
    }

    /**
     * Fetch a single food with associated (optional) category, branded info, portions and nutrients.
     * Throws if food not found.
     * @param id Positive integer food ID
     * @returns Detailed food record
     */
    async getFoodById(id: number): Promise<FoodDetail> {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Invalid id");
        }

        const queries = {
            food: `
                SELECT id, food_category_id, description
                FROM food
                WHERE id = $1
            `, category: `
                SELECT fc.id, name
                FROM food_category fc
                         JOIN food f ON f.food_category_id = fc.id
                WHERE f.id = $1
            `, brandedFood: `
                SELECT bf.id,
                       bf.brand_owner,
                       bf.brand_name,
                       bf.subbrand_name,
                       bf.gtin_upc,
                       bf.ingredients
                FROM branded_food bf
                         JOIN food f ON f.branded_food_id = bf.id
                WHERE f.id = $1
            `, portions: `
                SELECT id, food_id, gram_weight, portion_amount, portion_unit, modifier
                FROM portion
                WHERE food_id = $1
                ORDER BY id
            `, nutrients: `
                SELECT n.name, n.unit, n.nutrient_nbr, nv.amount
                FROM nutrient_value nv
                         JOIN nutrient n ON nv.nutrient_id = n.id
                WHERE nv.food_id = $1
                ORDER BY n.nutrient_nbr
            `
        } as const;

        const [foodResult, categoryResult, brandedFoodResult, portionsResult, nutrientsResult] = await Promise.all([pool.query<Food>(queries.food, [id]), pool.query<FoodCategory>(queries.category, [id]), pool.query<BrandedFood>(queries.brandedFood, [id]), pool.query<Portion>(queries.portions, [id]), pool.query<CompleteNutrient>(queries.nutrients, [id])]);

        const food = foodResult.rows[0];
        if (!food) throw new Error("Food not found");

        return {
            food,
            category: categoryResult.rows[0] ?? null,
            brandedFood: brandedFoodResult.rows[0] ?? null,
            portions: portionsResult.rows,
            nutrients: nutrientsResult.rows
        };
    }

    /**
     * Search foods by (partial, case-insensitive) description with pagination.
     * Returns empty list if the provided name trims to empty.
     * @param name Raw search string
     * @param paginationProps Pagination settings
     * @returns Paginated result
     */
    async getFoodByName(name: string, paginationProps: PaginationProps): Promise<PaginatedFoodResult> {
        const trimmed = name.trim();
        if (!trimmed) return {rows: [], total: 0};

        const searchTerm = `%${trimmed}%`;
        const countQuery = `
            SELECT COUNT(id)::text AS total
            FROM food
            WHERE description ILIKE $1
        `;
        const dataQuery = `
            SELECT id, branded_food_id, food_category_id, description
            FROM food
            WHERE description ILIKE $1
            ORDER BY id
            LIMIT $2 OFFSET $3
        `;

        const [countResult, dataResult] = await Promise.all([pool.query<CountRow>(countQuery, [searchTerm]), pool.query<Food>(dataQuery, [searchTerm, paginationProps.limit, paginationProps.offset])]);

        const total = this.parseTotal(countResult.rows[0]?.total);
        return {rows: dataResult.rows, total};
    }

    /**
     * Find food by its GTIN (from branded_food table). Returns full detail.
     * Throws if not found.
     * @param gtin GTIN / UPC code (exact match)
     * @returns Detailed food record
     */
    async getFoodByGtin(gtin: string): Promise<FoodDetail> {
        const dataQuery = `
            SELECT f.id
            FROM food f
                     JOIN branded_food bf ON f.branded_food_id = bf.id
            WHERE bf.gtin_upc = $1
        `;
        const row = (await pool.query<{ id: number }>(dataQuery, [gtin])).rows[0];
        if (!row) throw new Error("Food not found");
        return this.getFoodById(row.id);
    }

    /**
     * Safe parse of COUNT(*) text result to number.
     * @param value Text count
     * @returns Parsed integer (>=0)
     */
    private parseTotal(value?: string): number {
        const num = parseInt(value ?? "0", 10);
        return Number.isNaN(num) || num < 0 ? 0 : num;
    }
}

export const foodService = new FoodService();