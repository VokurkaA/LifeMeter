export interface FoodSearchResult extends Food {
  brand_owner?: string;
  brand_name?: string;
  category_name?: string;
}

export interface Food {
  id: number;
  branded_food_id: number | null;
  food_category_id: number | null;
  description: string;
}

export interface FoodCategory {
  id: number;
  name: string;
}

export interface BrandedFood {
  id: number;
  brand_owner?: string;
  brand_name?: string;
  subbrand_name?: string;
  gtin_upc?: string;
  ingredients?: string;
}

export interface Nutrient {
  id: number;
  name: string;
  unit: string;
  nutrient_nbr?: number;
}

export interface NutrientValue {
  id: number;
  food_id: number;
  nutrient_id: number;
  amount?: number;
}

export interface Portion {
  id: number;
  food_id: number;
  gram_weight: number;
  portion_amount?: number;
  portion_unit?: string;
  modifier?: string;
}

export interface CompleteNutrient {
  food_id: number;
  name: string;
  unit: string;
  nutrient_nbr: number;
  amount: number;
}

export interface FoodDetail {
  food: Food;
  category: FoodCategory | null;
  brandedFood: BrandedFood | null;
  portions: Portion[];
  nutrients: CompleteNutrient[];
}

export type UserMeal = {
  id: string;
  user_id: string;
  eaten_at: string;
  name: string;
};

export type UserFood = {
  id: string;
  user_meal_id: string;
  food_id: number;
  total_grams: number;
  quantity: number;
  portion_id?: number;
  description?: string;
};

export type FullUserFood = {
  userFood: UserFood;
  foodDetail: FoodDetail;
};

export type FullUserMeal = {
  userMeal: UserMeal;
  userFoods: FullUserFood[];
};

export type MealItemInput = {
  food_id: number;
  total_grams: number;
  quantity?: number;
  portion_id?: number | null;
  description?: string | null;
};

export type CreateMealInput = {
  name: string;
  eaten_at?: string;
  items: MealItemInput[];
};

export type UpdateMealInput = {
  name?: string;
  eaten_at?: string;
  items?: MealItemInput[];
};
