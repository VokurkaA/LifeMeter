import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { ChartCard } from '@/components/graphs/ChartsCard';
import { BarChart } from '@/components/graphs/Chart';
import { ChartDataPoint } from '@/components/graphs/useChartData';

export default function TrainingCharts() {
  const { userWorkouts } = useWorkoutStore();

  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const workoutCounts = last7Days.map((date) => {
      const count = userWorkouts.filter((w) => {
        const wDate = new Date(w.startDate);
        wDate.setHours(0, 0, 0, 0);
        return wDate.getTime() === date.getTime();
      }).length;

      return {
        value: count,
        label: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      } as ChartDataPoint;
    });

    return workoutCounts;
  }, [userWorkouts]);

  const totalThisWeek = weeklyData.reduce((acc, d) => acc + d.value, 0);

  return (
    <View className="gap-2 mb-6">
      <Text className="text-xl font-bold px-1">Analytics</Text>
      <ChartCard
        title="Workouts"
        description="Last 7 days"
        averageLabel="Total"
        averageValue={totalThisWeek}
      >
        <BarChart data={weeklyData} height={80} />
      </ChartCard>
    </View>
  );
}
