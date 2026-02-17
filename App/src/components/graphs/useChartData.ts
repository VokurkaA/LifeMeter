import { useThemeColor } from "heroui-native";
import { useMemo } from "react";

export type ChartDataPoint = {
  value: number;
  label: string;
  frontColor?: string;
  dataPointText?: string;
};

type ChartConfig = {
  data: ChartDataPoint[];
  startAtZero?: boolean;
};
const roundUpTo5 = (num: number) => Math.ceil(num / 5) * 5;
const roundDownToNice = (num: number) => {
  if (Math.abs(num) < 10) return Math.floor(num / 2) * 2;
  return Math.floor(num / 10) * 10;
};

export function useChartData({ data, startAtZero = false }: ChartConfig) {
  const mutedColor = useThemeColor("muted");
  const foregroundColor = useThemeColor("foreground");
  const backgroundColor = useThemeColor("surface");

  const stats = useMemo(() => {
    if (!data.length) {
      return {
        averageValue: 0,
        maxValue: 100,
        minVal: 0,
        stepValue: 50,
        noOfSections: 2,
      };
    }

    const values = data.map((d) => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / data.length;

    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);

    const effectiveMin = startAtZero ? 0 : rawMin;
    let range = rawMax - effectiveMin;
    if (range === 0) range = rawMax || 10;

    const padding = range * 0.2;
    const targetMin = startAtZero ? 0 : effectiveMin - padding;
    const targetMax = rawMax + padding;
    let axisMin = startAtZero ? 0 : roundDownToNice(targetMin);
    const noOfSections = 2;
    const rawStep = (targetMax - axisMin) / noOfSections;
    let stepValue = roundUpTo5(rawStep);
    if (stepValue <= 0) stepValue = 1;
    const axisMax = axisMin + noOfSections * stepValue;
    return {
      averageValue: parseFloat(avg.toFixed(1)),
      maxValue: axisMax,
      minVal: axisMin,
      stepValue: stepValue,
      noOfSections: noOfSections,
    };
  }, [data, startAtZero]);

  return {
    colors: {
      muted: mutedColor,
      foreground: foregroundColor,
      background: backgroundColor,
    },
    ...stats,
  };
}
