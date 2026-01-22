import {request} from '@/lib/net';
import type {CreateFoodInput, CreateMealInput, Food, FoodDetail, FullUserMeal, UpdateFoodInput, UpdateMealInput, UserFood, UserMeal} from "@/types/food.types";
import type {PaginationResult} from "@/types/types";

class FoodService {
  private baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api';

  async getAllFood(page?: number): Promise<{ data: Food[], pagination: PaginationResult }> {
    const url = this.baseUrl + "/food" + (page ? `?page=${encodeURIComponent(String(page))}` : '');
    return request(url, { method: 'GET' });
  }

  async getFoodByName(searchText: string, page?: number): Promise<{ data: Food[], pagination: PaginationResult }> {
    const params = new URLSearchParams({ name: searchText });
    if (page) params.set('page', String(page));
    const url = `${this.baseUrl}/food/search?${params.toString()}`;
    return request(url, { method: 'GET' });
  }

  async getFoodByGtin(gtin: string): Promise<{ data: Food[], pagination: PaginationResult }> {
    const url = `${this.baseUrl}/food/search?gtin=${encodeURIComponent(gtin)}`;
    return request(url, { method: 'GET' });
  }

  async getFoodById(id: number): Promise<FoodDetail> {
    const url = `${this.baseUrl}/food/${encodeURIComponent(String(id))}`;
    return request(url, { method: 'GET' });
  }

  async addFood(data: CreateFoodInput): Promise<FoodDetail> {
    const url = this.baseUrl + "/food";
    return request(url, { method: 'POST', body: JSON.stringify(data) });
  }

  async editFood(id: number, data: UpdateFoodInput): Promise<FoodDetail> {
    const url = `${this.baseUrl}/food/${encodeURIComponent(String(id))}`;
    return request(url, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async getAllUserMeals(): Promise<{ userMeal: UserMeal; userFoods: UserFood[] }[]> {
    const url = this.baseUrl + "/user/food";
    return request(url, { method: 'GET' });
  }

  async getUserMealById(id: string): Promise<FullUserMeal> {
    const url = `${this.baseUrl}/user/food/${encodeURIComponent(id)}`;
    return request(url, { method: 'GET' });
  }

  async addUserMeal(data: CreateMealInput): Promise<{ meal: UserMeal; food: UserFood[] }> {
    const url = this.baseUrl + "/user/food";
    return request(url, { method: 'POST', body: JSON.stringify(data) });
  }

  async editUserMeal(id: string, data: UpdateMealInput): Promise<FullUserMeal> {
    const url = `${this.baseUrl}/user/food/${encodeURIComponent(id)}`;
    return request(url, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deleteUserMeal(id: string): Promise<void> {
    const url = `${this.baseUrl}/user/food/${encodeURIComponent(id)}`;
    await request(url, { method: 'DELETE' });
  }
}

export const foodService = new FoodService();
