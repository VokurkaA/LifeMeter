import React, { useEffect, useState, useMemo } from "react";
import { View } from "react-native";
import { ChartCard } from "@/components/graphs/ChartsCard";
import { BarChart } from "@/components/graphs/Chart";
import { ChartDataPoint } from "@/components/graphs/useChartData";
import { getSteps, StepSample } from "@/lib/health/index";
import { useStorage } from "@/lib/storage";
import { useUserStore } from "@/contexts/useUserStore";

export const StepsHomeChart = () => {
  const [enableSync] = useStorage.boolean("enable-sync");
  const { userGoals } = useUserStore();
  const [steps, setSteps] = useState<StepSample[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enableSync) return;

    const fetchSteps = async () => {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const result = await getSteps({ startDate, endDate });
      if (result.ok) {
        setSteps(result.data);
      }
      setIsLoading(false);
    };

    fetchSteps();
  }, [enableSync]);

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    return days.map((d) => {
      const daySteps = steps.find(
        (s) =>
          s.startDate.getFullYear() === d.getFullYear() &&
          s.startDate.getMonth() === d.getMonth() &&
          s.startDate.getDate() === d.getDate()
      );

      return {
        value: daySteps?.count || 0,
        label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      } as ChartDataPoint;
    });
  }, [steps]);

  const totalSteps = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.value, 0);
  }, [chartData]);

  const avgSteps = Math.round(totalSteps / 7);

  if (!enableSync) return null;

  return (
    <ChartCard
      title="Steps"
      description="Last 7 days"
      averageValue={avgSteps.toLocaleString()}
      averageLabel="Daily Avg"
    >
      <BarChart 
        data={chartData} 
        height={80} 
        showAverageLine={!!userGoals?.dailyStepsGoal}
        averageValue={userGoals?.dailyStepsGoal || undefined}
      />
    </ChartCard>
  );
};
