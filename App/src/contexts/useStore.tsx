import React from 'react';
import { StoreContextType } from '@/types/types';
import { useSleepStore, SleepStoreProvider } from './useSleepStore';
import { useNutritionStore, NutritionStoreProvider } from './useNutritionStore';
import { useWorkoutStore, WorkoutStoreProvider } from './useWorkoutStore';
import { useUserStore, UserStoreProvider } from './useUserStore';

/**
 * StoreProvider is now a wrapper for domain-specific providers.
 * This pattern prevents global re-renders when only one domain's state changes.
 */
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserStoreProvider>
      <SleepStoreProvider>
        <WorkoutStoreProvider>
          <NutritionStoreProvider>
            {children}
          </NutritionStoreProvider>
        </WorkoutStoreProvider>
      </SleepStoreProvider>
    </UserStoreProvider>
  );
};

/**
 * useStore is a facade hook that combines all granular stores.
 * NOTE: Using this hook will still cause re-renders if ANY of the stores change.
 * For better performance, use useSleepStore(), useNutritionStore(), etc. directly.
 */
export const useStore = (): StoreContextType => {
  const sleep = useSleepStore();
  const nutrition = useNutritionStore();
  const workout = useWorkoutStore();
  const user = useUserStore();

  return {
    ...sleep,
    ...nutrition,
    ...workout,
    ...user,
    // Note: isLoading is combined from all stores for backward compatibility
    isLoading: sleep.isLoading || nutrition.isLoading || workout.isLoading || user.isLoading,
  };
};
