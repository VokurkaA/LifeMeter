import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Card, useThemeColor, Tabs } from 'heroui-native';
import { Text, Muted } from '@/components/Text';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { ChartCard } from '@/components/graphs/ChartsCard';
import { LineChart } from '@/components/graphs/Chart';
import { ChartDataPoint } from '@/components/graphs/useChartData';
import { Combobox } from '@/components/Combobox';
import { Exercise, WorkoutSet } from '@/types/workout.types';

type Metric = 'weight' | 'oneRM' | 'volume';

export default function ExerciseProgressCard() {
  const { exercises, userWorkouts } = useWorkoutStore();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>();
  const [metric, setMetric] = useState<Metric>('weight');
  
  const accentColor = useThemeColor('accent');
  const successColor = useThemeColor('success');
  const dangerColor = useThemeColor('danger');
  const foregroundColor = useThemeColor('foreground');

  const calculate1RM = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    if (reps === 0) return 0;
    return weight / (1.0278 - 0.0278 * reps);
  };

  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    const exerciseSets: { date: Date; weight: number; oneRM: number; volume: number }[] = [];
    userWorkouts.forEach(workout => {
        const date = new Date(workout.startDate);
        const relevantSets = workout.sets.filter(s => s.exerciseId === selectedExercise.id && s.weight && s.repetitions);
        
        if (relevantSets.length > 0) {
            const dailyMaxWeight = Math.max(...relevantSets.map(s => s.weight || 0));
            const dailyMax1RM = Math.max(...relevantSets.map(s => calculate1RM(s.weight || 0, s.repetitions || 0)));
            const dailyVolume = relevantSets.reduce((acc, s) => acc + (s.weight || 0) * (s.repetitions || 0), 0);

            exerciseSets.push({ 
                date, 
                weight: dailyMaxWeight,
                oneRM: dailyMax1RM,
                volume: dailyVolume
            });
        }
    });

    if (exerciseSets.length === 0) return [];

    const dateGroups: Record<string, number> = {};
    exerciseSets.forEach(({ date, weight, oneRM, volume }) => {
        const dateStr = date.toDateString();
        const value = metric === 'weight' ? weight : metric === 'oneRM' ? oneRM : volume;
        if (!dateGroups[dateStr] || value > dateGroups[dateStr]) {
            dateGroups[dateStr] = value;
        }
    });

    const data = Object.entries(dateGroups)
        .map(([dateStr, value]) => ({
            value: Math.round(value * 10) / 10,
            label: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            date: new Date(dateStr)
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(({ value, label }) => ({ value, label } as ChartDataPoint));

    if (data.length > 0 && data.length < 7) {
      const padding = Array.from({ length: 7 - data.length }, () => ({
        value: 0,
        label: '',
      } as ChartDataPoint));
      return [...padding, ...data];
    }

    return data;
  }, [selectedExercise, userWorkouts, metric]);

  const stats = useMemo(() => {
    const realValues = chartData.map(d => d.value).filter(v => v > 0);
    if (realValues.length === 0) return null;

    const max = Math.max(...realValues);
    const latest = realValues[realValues.length - 1];
    const first = realValues[0];
    const diff = latest - first;

    return {
        max,
        latest,
        diff: Math.round(diff * 10) / 10,
        isPositive: diff >= 0
    };
  }, [chartData]);

  return (
    <View className="gap-2 mb-6">
      <View className="flex-row justify-between items-center px-1">
        <Text className="text-xl font-bold">Exercise Progress</Text>
      </View>
      
      <Card className="p-4 mb-2">
        <Combobox
          options={exercises}
          value={selectedExercise}
          onChange={setSelectedExercise}
          getOptionValue={(e) => e.id}
          getOptionLabel={(e) => `${e.variant} ${e.type}`}
          placeholder="Select an exercise..."
          dialogTitle="Select Exercise"
          filterOption={(e, q) => {
            const lower = q.toLowerCase();
            return (
              e.variant.toLowerCase().includes(lower) ||
              e.type.toLowerCase().includes(lower)
            );
          }}
        />
      </Card>

      {selectedExercise && chartData.length > 0 ? (
        <ChartCard
          title={selectedExercise.variant + " " + selectedExercise.type}
          description={`${metric === 'weight' ? 'Max Weight' : metric === 'oneRM' ? 'Est. 1RM' : 'Total Volume'} over time`}
          averageLabel={metric === 'weight' ? "Personal Best" : metric === 'oneRM' ? "Max Est. 1RM" : "Max Volume"}
          averageValue={stats?.max + " kg"}
        >
            <LineChart data={chartData} height={150} showDots curveType="curved" />

          <View className="mt-4 mb-2">
            <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
              <Tabs.List className="bg-surface border border-border">
                <Tabs.Trigger value="weight" className="flex-1">
                  <Tabs.Label>Weight</Tabs.Label>
                </Tabs.Trigger>
                <Tabs.Trigger value="oneRM" className="flex-1">
                  <Tabs.Label>1RM</Tabs.Label>
                </Tabs.Trigger>
                <Tabs.Trigger value="volume" className="flex-1">
                  <Tabs.Label>Volume</Tabs.Label>
                </Tabs.Trigger>
                <Tabs.Indicator />
              </Tabs.List>
            </Tabs>
          </View>
          
          <View className="flex-row gap-6 mt-4 border-t border-border/50 pt-4">
            <View>
              <Muted className="text-xs uppercase font-bold">Latest</Muted>
              <Text className="text-lg font-bold">{stats?.latest} kg</Text>
            </View>
            <View>
              <Muted className="text-xs uppercase font-bold">Progression</Muted>
              <Text 
                className="text-lg font-bold"
                style={{ color: stats?.isPositive ? successColor : dangerColor }}
              >
                {stats?.isPositive ? '+' : ''}{stats?.diff} kg
              </Text>
            </View>
          </View>
        </ChartCard>
      ) : selectedExercise ? (
        <Card className="p-8 items-center justify-center bg-surface/30 border-dashed border border-border">
          <Muted>No sufficient data found for this exercise</Muted>
        </Card>
      ) : (
        <Card className="p-8 items-center justify-center bg-surface/30 border-dashed border border-border">
          <Muted>Select an exercise to see progress</Muted>
        </Card>
      )}
    </View>
  );
}
