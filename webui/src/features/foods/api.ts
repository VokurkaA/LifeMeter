import { env } from "@/config/env";
import { Food } from "./types";

export async function fetchFoods(page = 1): Promise<Food[]> {
  const res = await fetch(`${env.API_BASE}/api/food?page=${page}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load foods");
  return json.data || [];
}

export async function searchFoodsByName(name: string, page = 1): Promise<Food[]> {
  const url = `${env.API_BASE}/api/food/search?name=${encodeURIComponent(name)}&page=${page}`;
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Search failed");
  return Array.isArray(json.data) ? json.data : [];
}