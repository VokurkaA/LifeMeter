import React, { useMemo, useState, useCallback } from "react";
import { View, LayoutChangeEvent } from "react-native";
import { LineChart as GiftedLineChart, BarChart as GiftedBarChart, yAxisSides } from "react-native-gifted-charts";
import { Text } from "@/components/Text";
import { ChartDataPoint, useChartData } from "./useChartData";

type BaseChartProps = {
    data: ChartDataPoint[];
    height?: number;
    showAverageLine?: boolean;
    averageValue?: number;
};

function useContainerLayout() {
    const [width, setWidth] = useState<number>(0);
    const onLayout = useCallback((e: LayoutChangeEvent) => {
        if (Math.abs(e.nativeEvent.layout.width - width) > 1) {
            setWidth(e.nativeEvent.layout.width);
        }
    }, [width]);
    return { width, onLayout };
}

function useChartPointer(
    height: number,
    colors: { foreground: string; muted: string; background: string }
) {
    return useMemo(() => ({
        pointerStripUptoDataPoint: false,
        pointerStripColor: colors.muted,
        pointerStripWidth: 2,
        pointerStripHeight: height,
        strokeDashArray: [2, 5],
        pointerColor: colors.foreground,
        radius: 4,
        pointerLabelWidth: 60,
        pointerLabelHeight: 40,
        autoAdjustPointerLabelPosition: true,
        activatePointersOnLongPress: false,
        activatePointersInstantlyOnTouch: true,
        pointerLabelComponent: (items: any[]) => {
            const val = items[0]?.value;
            return (
                <View className="bg-background/25 min-w-16 -right-1/2 -translate-x-1/2 p-2 rounded-xl items-center justify-center">
                    <Text>{typeof val === 'number' ? val.toFixed(1) : '-'}</Text>
                </View>
            );
        },
    }), [height, colors]);
}

type LineChartProps = BaseChartProps & {
    curveType?: "linear" | "curved";
    showDots?: boolean;
};

const BASE_HEIGHT = 110;

export const LineChart = ({
    data,
    height = BASE_HEIGHT,
    curveType = "curved",
    showDots = false,
    showAverageLine,
    averageValue
}: LineChartProps) => {
    const { width, onLayout } = useContainerLayout();
    const { colors, maxValue, minVal, stepValue, noOfSections, averageValue: calcAvg } = useChartData({ data, startAtZero: false });
    const pointerConfig = useChartPointer(height, colors);

    const avgToUse = averageValue ?? calcAvg;
    const chartWidth = width > 40 ? width - 40 : width;

    if (!data.length) return <View onLayout={onLayout} style={{ height }} />;

    return (
        <View onLayout={onLayout}>
            {width > 0 && (
                <GiftedLineChart
                    data={data}
                    height={height}
                    width={chartWidth}
                    adjustToWidth

                    initialSpacing={5}
                    endSpacing={5}

                    backgroundColor={colors.background}
                    color={colors.foreground}
                    thickness={3}
                    curved={curveType === "curved"}

                    yAxisOffset={minVal}
                    maxValue={maxValue}
                    stepValue={stepValue}
                    noOfSections={noOfSections}

                    formatYLabel={(label) => parseFloat(label).toFixed(0)}

                    yAxisSide={yAxisSides.RIGHT}
                    hideRules
                    hideYAxisText={false}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}

                    hideDataPoints={!showDots}
                    dataPointsColor={colors.foreground}
                    dataPointsRadius={4}

                    pointerConfig={pointerConfig}

                    showReferenceLine1={showAverageLine}
                    referenceLine1Position={avgToUse}
                    referenceLine1Config={{
                        color: colors.muted,
                        thickness: 1,
                        dashWidth: 4,
                        dashGap: 4,
                        labelText: "",
                    }}
                />
            )}
        </View>
    );
};

export const BarChart = ({
    data,
    height = BASE_HEIGHT,
    showAverageLine,
    averageValue
}: BaseChartProps) => {
    const { width, onLayout } = useContainerLayout();
    const { colors, maxValue, stepValue, noOfSections, averageValue: calcAvg } = useChartData({ data, startAtZero: true });
    const pointerConfig = useChartPointer(height, colors);

    const avgToUse = averageValue ?? calcAvg;

    const chartWidth = width > 10 ? width - 10 : width;

    const { barWidth, spacing } = useMemo(() => {
        if (!chartWidth || !data.length) return { barWidth: 10, spacing: 10 };
        const availableSpace = chartWidth;
        const itemWidth = availableSpace / data.length;
        return {
            barWidth: Math.floor(itemWidth * 0.6),
            spacing: Math.floor(itemWidth * 0.4),
        };
    }, [chartWidth, data.length]);

    return (
        <View onLayout={onLayout}>
            {width > 0 && (
                <GiftedBarChart
                    data={data}
                    height={height}
                    width={chartWidth}

                    barWidth={barWidth}
                    spacing={spacing}
                    initialSpacing={5}
                    endSpacing={5}
                    frontColor={colors.foreground}

                    hideRules
                    hideYAxisText
                    yAxisThickness={0}
                    xAxisThickness={0}
                    xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}

                    maxValue={maxValue}
                    stepValue={stepValue}
                    noOfSections={noOfSections}

                    formatYLabel={(label) => parseFloat(label).toFixed(0)}

                    pointerConfig={{
                        ...pointerConfig,
                        barTouchable: true
                    }}

                    showReferenceLine1={showAverageLine}
                    referenceLine1Position={avgToUse}
                    referenceLine1Config={{
                        color: colors.muted,
                        thickness: 1,
                        dashWidth: 2,
                        dashGap: 4,
                    }}
                />
            )}
        </View>
    );
};