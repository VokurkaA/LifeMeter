"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import type { FoodDetail, FullUserMeal, SleepEntry } from "@/types/server";

export default function Home() {
  const [health, setHealth] = useState<string>("checking…");
  const [routes, setRoutes] = useState<Record<string, unknown> | null>(null);
  const [me, setMe] = useState<Record<string, unknown> | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Food
  const [query, setQuery] = useState("");
  const [food, setFood] = useState<FoodDetail[] | null>(null);
  const [foodError, setFoodError] = useState<string | null>(null);

  // Meals
  const [meals, setMeals] = useState<FullUserMeal[] | null>(null);
  const [mealCreate, setMealCreate] = useState<{ food_id: string; grams: string; name: string }>({
    food_id: "",
    grams: "",
    name: "Quick meal",
  });
  const [mealError, setMealError] = useState<string | null>(null);

  // Sleep
  const [sleep, setSleep] = useState<SleepEntry[] | null>(null);
  const [sleepError, setSleepError] = useState<string | null>(null);

  useEffect(() => {
    api
      .health()
      .then((h) => setHealth(`${h.status} @ ${new Date(h.timestamp).toLocaleString()}`))
      .catch(() => setHealth("unreachable"));
    api
      .routes()
      .then(setRoutes)
      .catch(() => setRoutes(null));
  }, []);

  const refreshMe = async () => {
    setAuthError(null);
    try {
      const user = await api.me();
      setMe(user);
    } catch (e) {
      setMe(null);
      setAuthError((e as Error).message || "Not authenticated");
    }
  };

  const signIn = async (formData: FormData) => {
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    setAuthError(null);
    try {
      await api.signInWithEmail(email, password);
      await refreshMe();
    } catch (e) {
      setAuthError((e as Error).message);
    }
  };

  const searchFood = async () => {
    setFoodError(null);
    try {
      const res = await api.searchFoodByName(query, { limit: 10 });
      setFood(res.data);
    } catch (e) {
      setFood(null);
      setFoodError((e as Error).message);
    }
  };

  const loadMeals = async () => {
    setMealError(null);
    try {
      const m = await api.listMeals();
      setMeals(m);
    } catch (e) {
      setMealError((e as Error).message);
      setMeals(null);
    }
  };

  const createMeal = async () => {
    setMealError(null);
    const food_id = Number(mealCreate.food_id);
    const grams = Number(mealCreate.grams);
    if (!Number.isFinite(food_id) || !Number.isFinite(grams)) {
      setMealError("Provide valid food_id and grams");
      return;
    }
    try {
      await api.createMeal({
        name: mealCreate.name || undefined,
        items: [
          {
            food_id,
            total_grams: grams,
          },
        ],
      });
      setMealCreate({ food_id: "", grams: "", name: "Quick meal" });
      await loadMeals();
    } catch (e) {
      setMealError((e as Error).message);
    }
  };

  const loadSleep = async () => {
    setSleepError(null);
    try {
      const s = await api.listSleep();
      setSleep(s);
    } catch (e) {
      setSleepError((e as Error).message);
      setSleep(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">LifeMeter Web UI</h1>

      <Card className="p-4 space-y-2">
        <h2 className="font-medium">API</h2>
        <div className="text-sm text-muted-foreground">Health: {health}</div>
        <div className="text-sm break-words">
          <span className="font-medium">Routes:</span> {routes ? "loaded" : "—"}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="font-medium">Auth</h2>
        <form
          action={async (fd) => {
            await signIn(fd);
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input name="email" placeholder="email@example.com" type="email" required />
          <Input name="password" placeholder="••••••••" type="password" required />
          <Button type="submit">Sign in</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              await api.signOut().catch(() => {});
              setMe(null);
            }}
          >
            Sign out
          </Button>
          <Button type="button" variant="outline" onClick={refreshMe}>
            Who am I?
          </Button>
        </form>
        {authError && <p className="text-sm text-red-600">{authError}</p>}
        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
          {me ? JSON.stringify(me, null, 2) : "Not signed in"}
        </pre>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium">Food search (requires auth)</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={searchFood}>Search</Button>
        </div>
        {foodError && <p className="text-sm text-red-600">{foodError}</p>}
        {food && food.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Brand</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {food.map((f) => (
                  <TableRow key={f.food.id}>
                    <TableCell>{f.food.id}</TableCell>
                    <TableCell>{f.food.description}</TableCell>
                    <TableCell>{f.brandedFood?.brand_name ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium">Meals (requires auth)</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Food ID"
            value={mealCreate.food_id}
            onChange={(e) => setMealCreate((s) => ({ ...s, food_id: e.target.value }))}
          />
          <Input
            placeholder="Grams"
            value={mealCreate.grams}
            onChange={(e) => setMealCreate((s) => ({ ...s, grams: e.target.value }))}
          />
          <Input
            placeholder="Meal name (optional)"
            value={mealCreate.name}
            onChange={(e) => setMealCreate((s) => ({ ...s, name: e.target.value }))}
          />
          <Button onClick={createMeal}>Create meal</Button>
          <Button variant="outline" onClick={loadMeals}>
            Refresh meals
          </Button>
        </div>
        {mealError && <p className="text-sm text-red-600">{mealError}</p>}
        {meals && meals.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meal</TableHead>
                  <TableHead>Eaten at</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meals.map((m) => (
                  <TableRow key={m.userMeal.id}>
                    <TableCell>{m.userMeal.name}</TableCell>
                    <TableCell>{new Date(m.userMeal.eaten_at).toLocaleString()}</TableCell>
                    <TableCell>{m.userFoods.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium">Sleep (requires auth)</h2>
        <div className="flex gap-2">
          <Button onClick={loadSleep}>Load sleep entries</Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await api.startSleep();
                await loadSleep();
              } catch (e) {
                setSleepError((e as Error).message);
              }
            }}
          >
            Start now
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await api.endSleep();
                await loadSleep();
              } catch (e) {
                setSleepError((e as Error).message);
              }
            }}
          >
            End now
          </Button>
        </div>
        {sleepError && <p className="text-sm text-red-600">{sleepError}</p>}
        {sleep && sleep.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sleep.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.sleep_start).toLocaleString()}</TableCell>
                    <TableCell>{s.sleep_end ? new Date(s.sleep_end).toLocaleString() : "—"}</TableCell>
                    <TableCell>{s.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
