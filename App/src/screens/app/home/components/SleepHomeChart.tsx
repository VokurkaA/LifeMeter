import React, { useMemo } from "react";
import { useSleepStore } from "@/contexts/useSleepStore";
import { ChartCard } from "@/components/graphs/ChartsCard";
import { LineChart } from "@/components/graphs/Chart";
import { ChartDataPoint } from "@/components/graphs/useChartData";

export const SleepHomeChart = ({ onPress }: { onPress?: () => void }) => {
  const { sleepSessions } = useSleepStore();

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    const dayMap = new Map<string, number>();

    sleepSessions.forEach((session) => {
      if (!session.endAt) return;
      const start = new Date(session.startAt);
      const end = new Date(session.endAt);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (durationHours <= 0) return;

      const key = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
      dayMap.set(key, (dayMap.get(key) ?? 0) + durationHours);
    });

    return days.map((d) => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        value: parseFloat((dayMap.get(key) ?? 0).toFixed(1)),
        label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      } as ChartDataPoint;
    });
  }, [sleepSessions]);

  const avgHours = useMemo(() => {
    const sum = chartData.reduce((acc, d) => acc + d.value, 0);
    const countWithData = chartData.filter((d) => d.value > 0).length;
    return countWithData > 0 ? (sum / 7).toFixed(1) : "0.0";
  }, [chartData]);

  return (
    <ChartCard
      title="Sleep"
      description="Hours - Last 7 days"
      averageValue={`${avgHours} h`}
      averageLabel="Daily Avg"
      onPress={onPress}
    >
      <LineChart 
        data={chartData} 
        height={80} 
        curveType="curved" 
      />
    </ChartCard>
  );
};
