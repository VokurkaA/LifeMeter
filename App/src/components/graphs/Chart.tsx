import { useThemeColor } from "heroui-native";
import { ChartCard } from "./ChartsCard";
import { LineChart as BaseLineChart } from "react-native-gifted-charts";
import { BarChart as BaseBarChart } from "react-native-gifted-charts";
import { useMemo } from "react";
import { View } from "react-native";
import { Muted, Text } from "@/components/Text";
type ChartData = {
    value: number;
    label: string;
};

type ChartProps = {
    title?: string;
    description?: string;
    averageDescription?: string;
    showAverage?: boolean;
    data: ChartData[];
    openDetails?: () => void;
    curveType?: "linear" | "curved";
    showDots?: boolean;
};

function useCharts(data: ChartData[]) {
    const mutedColor = useThemeColor("muted");
    const foregroundColor = useThemeColor("foreground");
    const backgroundColor = useThemeColor("surface");

    const { averageValue, maxValue } = useMemo(() => {
        if (!data.length) return { averageValue: 0, maxValue: 100 };

        const values = data.map(d => d.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const max = Math.max(...values);

        const calculatedMax = Math.ceil((max * 1.2) / 10) * 10;

        return {
            averageValue: parseFloat((sum / data.length).toFixed(1)),
            maxValue: calculatedMax
        };
    }, [data]);

    return { mutedColor, foregroundColor, backgroundColor, averageValue, maxValue };
}

export const LineChart = ({
    title,
    description,
    averageDescription,
    showAverage,
    data,
    openDetails,
    curveType,
    showDots
}: ChartProps) => {
    const { mutedColor, foregroundColor, backgroundColor, averageValue, maxValue } = useCharts(data);

    return (
        <ChartCard
            title={title}
            description={description}
            averageDescription={averageDescription}
            showAverage={showAverage}
            averageValue={averageValue}
            openDetails={openDetails}
        >
            <BaseLineChart
                data={data}
                backgroundColor={backgroundColor}
                rulesColor="transparent"
                color={foregroundColor}
                disableScroll
                thickness={2}
                hideYAxisText
                hideRules
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{ color: mutedColor, fontSize: 10 }}
                height={100}
                adjustToWidth
                maxValue={maxValue}
                curved={curveType === "curved"}
                hideDataPoints={!showDots}
                dataPointsColor={foregroundColor}
                showReferenceLine1={showAverage}
                referenceLine1Position={averageValue}
                referenceLine1Config={{
                    color: mutedColor,
                    thickness: 1,
                    dashWidth: 2,
                    dashGap: 4,
                    labelText: "",
                }}
                spacing={22.5}
                initialSpacing={10}
                endSpacing={0}
            />
        </ChartCard>
    );
};

export const BarChart = ({
    title,
    description,
    averageDescription,
    showAverage,
    data,
    openDetails
}: ChartProps) => {
    const { mutedColor, foregroundColor, backgroundColor, averageValue, maxValue } = useCharts(data);

    return (
        <ChartCard
            title={title}
            description={description}
            averageDescription={averageDescription}
            showAverage={showAverage}
            averageValue={averageValue}
            openDetails={openDetails}
        >
            <BaseBarChart
                data={data}
                backgroundColor={backgroundColor}
                frontColor={foregroundColor}
                rulesColor="transparent"
                disableScroll
                barWidth={12}
                spacing={10}
                hideYAxisText
                hideRules
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{
                    color: mutedColor,
                    fontSize: 10,
                }}
                height={100}
                maxValue={maxValue}
                noOfSections={3}
                showReferenceLine1={showAverage}
                referenceLine1Position={averageValue}
                referenceLine1Config={{
                    color: mutedColor,
                    thickness: 1,
                    dashWidth: 2,
                    dashGap: 4,
                }}
            />
        </ChartCard>
    );
};