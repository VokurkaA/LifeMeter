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
