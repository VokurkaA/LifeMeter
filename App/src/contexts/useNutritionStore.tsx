import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { foodService } from '@/services/food.service';
import { useStorage } from '@/lib/storage';
import { useAuth } from './useAuth';
import { onReconnect } from '@/lib/network-state';
import type { CreateMealInput, UpdateMealInput, UserFood, UserMeal } from '@/types/food.types';

export interface NutritionStoreContextType {
  userMeals: { userMeal: UserMeal; userFoods: UserFood[] }[];
  refreshUserMeals: () => Promise<void>;
  createUserMeal: (data: CreateMealInput) => Promise<void>;
  editUserMeal: (id: string, data: UpdateMealInput) => Promise<void>;
  deleteUserMeal: (id: string) => Promise<void>;
  isLoading: boolean;
}

const NutritionStoreContext = createContext<NutritionStoreContextType | undefined>(undefined);

export const NutritionStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userMeals, setUserMeals] = useStorage.array<{ userMeal: UserMeal; userFoods: UserFood[] }>('userMeals');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const normalizedUserMeals = Array.isArray(userMeals) ? userMeals : undefined;

  useEffect(() => {
    return onReconnect(() => setRefreshCount((c) => c + 1));
  }, []);

  useEffect(() => {
    if (userMeals !== undefined && !Array.isArray(userMeals)) {
      setUserMeals(undefined);
    }
  }, [userMeals, setUserMeals]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setUserMeals(undefined);
      setIsLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        if (!normalizedUserMeals) setIsLoading(true);
        const meals = await foodService.getAllUserMeals();
        if (active) setUserMeals(meals);
      } catch (e) {
        console.error('Failed to fetch user meals', e);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [authLoading, user, refreshCount, normalizedUserMeals, setUserMeals]);

  const refreshUserMeals = useCallback(async () => {
    const meals = await foodService.getAllUserMeals();
    setUserMeals(meals);
  }, []);

  const createUserMeal = useCallback(
    async (data: CreateMealInput) => {
      const created = await foodService.addUserMeal(data);
      setUserMeals([
        { userMeal: created.meal, userFoods: created.food },
        ...(normalizedUserMeals ?? []),
      ]);
    },
    [normalizedUserMeals, setUserMeals],
  );

  const editUserMeal = useCallback(
    async (id: string, data: UpdateMealInput) => {
      const updated = await foodService.editUserMeal(id, data);
      const summary = {
        userMeal: updated.userMeal,
        userFoods: updated.userFoods.map((uf) => uf.userFood),
      };
      setUserMeals((normalizedUserMeals ?? []).map((m) => (m.userMeal.id === id ? summary : m)));
    },
    [normalizedUserMeals, setUserMeals],
  );

  const deleteUserMeal = useCallback(
    async (id: string) => {
      await foodService.deleteUserMeal(id);
      setUserMeals((normalizedUserMeals ?? []).filter((m) => m.userMeal.id !== id));
    },
    [normalizedUserMeals, setUserMeals],
  );

  const value = useMemo(() => ({
    userMeals: normalizedUserMeals ?? [],
    refreshUserMeals,
    createUserMeal,
    editUserMeal,
    deleteUserMeal,
    isLoading,
  }), [normalizedUserMeals, refreshUserMeals, createUserMeal, editUserMeal, deleteUserMeal, isLoading]);

  return <NutritionStoreContext.Provider value={value}>{children}</NutritionStoreContext.Provider>;
};

export const useNutritionStore = () => {
  const context = useContext(NutritionStoreContext);
  if (!context) throw new Error('useNutritionStore must be used within NutritionStoreProvider');
  return context;
};
