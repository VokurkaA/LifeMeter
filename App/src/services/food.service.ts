import {request} from '@/lib/net';
import type {Food, FoodDetail} from "@/types/food.types";
import type {PaginationResult} from "@/types";

class FoodService {
  private baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '') + '/api/food';

  async getAllFood(page?: number): Promise<{ data: Food[], pagination: PaginationResult }> {
    const url = this.baseUrl + (page ? `?page=${encodeURIComponent(String(page))}` : '');
    return request(url, { method: 'GET' });
  }

  async getFoodByName(searchText: string, page?: number): Promise<{ data: Food[], pagination: PaginationResult }> {
    const params = new URLSearchParams({ name: searchText });
    if (page) params.set('page', String(page));
    const url = `${this.baseUrl}/search?${params.toString()}`;
    return request(url, { method: 'GET' });
  }

  async getFoodByGtin(gtin: string): Promise<{ data: Food[], pagination: PaginationResult }> {
    const url = `${this.baseUrl}/search?gtin=${encodeURIComponent(gtin)}`;
    return request(url, { method: 'GET' });
  }

  async getFoodById(id: number): Promise<FoodDetail> {
    const url = `${this.baseUrl}/${encodeURIComponent(String(id))}`;
    return request(url, { method: 'GET' });
  }
}

export const foodService = new FoodService();
