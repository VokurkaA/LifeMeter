"use client";
import { useState, useEffect } from "react";
import { fetchFoods, searchFoodsByName } from "../api";
import { Food } from "../types";

export default function FoodSearchPanel() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadInitial();
  }, []);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      setFoods(await fetchFoods());
    } catch (e: unknown) {
      if (e && typeof e === "object" && "message" in e) {
        setError((e as { message?: string }).message || "Error");
      } else {
        setError("Error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function doSearch() {
    if (!search.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setFoods(await searchFoodsByName(search.trim()));
    } catch (e: unknown) {
      if (e && typeof e === "object" && "message" in e) {
        setError((e as { message?: string }).message || "Error");
      } else {
        setError("Error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">Food Data (from backend)</h3>
      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 text-sm w-full"
            placeholder="Search foods by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={doSearch}
          disabled={loading || !search.trim()}
          className="px-3 py-1 text-sm border rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          Search
        </button>
        <button
          onClick={() => { setSearch(""); void loadInitial(); }}
          disabled={loading}
          className="px-3 py-1 text-sm border rounded"
        >
          Reset
        </button>
      </div>
      {loading && <p className="text-xs text-muted-foreground">Loading foods...</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!loading && !error && (
        <ul className="border rounded divide-y max-h-72 overflow-auto text-sm">
          {foods.length === 0 && (
            <li className="p-2 text-muted-foreground italic">No results</li>
          )}
          {foods.map(f => (
            <li key={f.id} className="p-2 flex flex-col gap-0.5">
              <span className="font-medium">{f.description}</span>
              <span className="text-xs text-muted-foreground">
                id: {f.id} {f.food_category_id !== null && `(category ${f.food_category_id})`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}