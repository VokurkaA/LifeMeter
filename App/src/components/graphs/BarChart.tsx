import { Button, Card, PressableFeedback, useThemeColor } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { useMemo } from "react";
import { View } from "react-native";
import { BarChart as BaseBarChart } from 'react-native-gifted-charts';
type BarChartProps = {
    title?: string;
    description?: string;
    averageDescription?: string;
    showAverage?: boolean;
    data: {
        value: number;
        label: string;
    }[];
    openDetails?: () => void;
};
export function BarChartCard({
    title,
    description,
    showAverage = false,
    averageDescription,
    data,
    openDetails
}: BarChartProps) {
    const mutedColor = useThemeColor('muted');
    const foregroundColor = useThemeColor('foreground');
    const backgroundColor = useThemeColor('surface');
    const { barData, averageValue } = useMemo(() => {
        if (!data.length) return { barData: [], averageValue: 0 };
        const sum = data.reduce((s, i) => s + i.value, 0);
        const avg = parseFloat((sum / data.length).toFixed(1));
        const bars = data.map(item => ({
            value: item.value,
            label: item.label,
            frontColor: foregroundColor,
        }));
        return { barData: bars, averageValue: avg };
    }, [data, foregroundColor]);
    if (!data.length) {
        return (
            <Card>
                <Card.Body>
                    <Card.Description className="text-center">No data available</Card.Description>
                </Card.Body>
            </Card>
        );
    }
    const cardContent = (
        <Card className="flex flex-row justify-between">
            <View className="flex flex-col justify-between">
                {(title || description) && (
                    <Card.Header>
                        <Card.Title className="text-2xl">{title}</Card.Title>
                        {description && (
                            <Card.Description className="font-normal">{description}</Card.Description>
                        )}
                    </Card.Header>
                )}
                {showAverage && (
                    <Card.Footer>
                        <Card.Description className="text-foreground font-semibold text-base">
                            Average
                        </Card.Description>
                        <Card.Description className="font-normal">
                            {averageValue} {averageDescription}
                        </Card.Description>
                    </Card.Footer>
                )}
            </View>
            <Card.Body className="relative py-4 px-2 shrink">
            {openDetails && (
                <View className="absolute top-0 right-0 z-50">
                    <ChevronRight size={28} color={foregroundColor} />
                </View>
            )}
                <BaseBarChart
                    data={barData}
                    backgroundColor={backgroundColor}
                    rulesColor="transparent"
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
            </Card.Body>
        </Card>
    );
    if (openDetails) {
        return <PressableFeedback onPress={openDetails}>{cardContent}</PressableFeedback>;
    }
    return cardContent;
}