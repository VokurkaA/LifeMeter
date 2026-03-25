import React, { useEffect, useState, useMemo } from "react";
import { View } from "react-native";
import { ChartCard } from "@/components/graphs/ChartsCard";
import { LineChart } from "@/components/graphs/Chart";
import { ChartDataPoint } from "@/components/graphs/useChartData";
import { useAuth } from "@/contexts/useAuth";
import { getWeight, WeightSample } from "@/lib/health/index";
import { getHealthSyncEnabledStorageKey } from "@/lib/healthSyncStorage";
import { useStorage } from "@/lib/storage";
import { useUserStore } from "@/contexts/useUserStore";

export const WeightHomeChart = () => {
  const { user } = useAuth();
  const [enableSync] = useStorage.boolean(
    getHealthSyncEnabledStorageKey(user?.id ?? null),
  );
  const { userGoals } = useUserStore();
  const [weights, setWeights] = useState<WeightSample[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enableSync) return;

    const fetchWeights = async () => {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29); // 30 days
      startDate.setHours(0, 0, 0, 0);

      const result = await getWeight({ startDate, endDate });
      if (result.ok) {
        setWeights(result.data);
      }
      setIsLoading(false);
    };

    fetchWeights();
  }, [enableSync]);

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      return d;
    });

    const sortedWeights = [...weights].sort((a, b) => a.date.getTime() - b.date.getTime());

    return days.map((d, idx) => {
      const dayWeight = sortedWeights.find(
        (w) =>
          w.date.getFullYear() === d.getFullYear() &&
          w.date.getMonth() === d.getMonth() &&
          w.date.getDate() === d.getDate()
      );

      let value = dayWeight?.kg || 0;
      
      // Simple interpolation for better line chart look if data is missing
      if (value === 0 && idx > 0) {
        // This is a very basic fallback, LineChart in this project 
        // seems to handle gaps by itself if we pass nulls, but let's check Chart.tsx again
        // Actually Chart.tsx doesn't seem to handle nulls specially, 
        // so we just provide what we have.
      }

      const showLabel = idx === 0 || idx === 14 || idx === 29;

      return {
        value: value,
        label: showLabel ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
      } as ChartDataPoint;
    }).filter(d => d.value > 0); // Only show days with data for weight to avoid line dropping to 0
  }, [weights]);

  const latestWeight = useMemo(() => {
    if (weights.length === 0) return "--";
    const sorted = [...weights].sort((a, b) => b.date.getTime() - a.date.getTime());
    return sorted[0].kg.toFixed(1);
  }, [weights]);

  if (!enableSync || chartData.length < 2) return null;

  const targetWeightKg = userGoals?.targetWeightGrams ? userGoals.targetWeightGrams / 1000 : undefined;

  return (
    <ChartCard
      title="Weight"
      description="Last 30 days"
      averageValue={`${latestWeight} kg`}
      averageLabel="Latest"
    >
      <LineChart 
        data={chartData} 
        height={80} 
        showAverageLine={!!targetWeightKg}
        averageValue={targetWeightKg}
        showDots
      />
    </ChartCard>
  );
};
