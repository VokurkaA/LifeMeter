import { Button, Card, PressableFeedback, useThemeColor } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { useMemo } from "react";
import { View } from "react-native";
import { LineChart as BaseLineChart } from 'react-native-gifted-charts';

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
    curveType?: 'linear' | 'curved';
    showDots?: boolean;
};

function LineChartCard({
    title,
    description,
    showAverage = false,
    averageDescription,
    data,
    openDetails,
    curveType = 'linear',
    showDots = true,
}: BarChartProps) {
    const mutedColor = useThemeColor('muted');
    const foregroundColor = useThemeColor('foreground');
    const backgroundColor = useThemeColor('surface');

    const { lineData, averageValue } = useMemo(() => {
        if (!data.length) return { lineData: [], averageValue: 0 };

        const sum = data.reduce((s, i) => s + i.value, 0);
        const avg = parseFloat((sum / data.length).toFixed(1));

        const lines = data.map(item => ({
            value: item.value,
            label: item.label,
            dataPointColor: foregroundColor,
        }));

        return { lineData: lines, averageValue: avg };
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
            {openDetails && (
                    <View className="absolute top-4 right-4 z-50">
                        <ChevronRight size={28} color={foregroundColor} />
                    </View>
                )}
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

            <Card.Body className="flex items-center mr-4">
                <BaseLineChart
                    data={lineData}
                    backgroundColor={backgroundColor}
                    rulesColor="transparent"
                    color={foregroundColor}
                    thickness={2}
                    hideYAxisText
                    hideRules
                    yAxisThickness={0}
                    xAxisThickness={0}
                    xAxisLabelTextStyle={{
                        color: mutedColor,
                        fontSize: 10,
                    }}
                    height={100}
                    width={180}
                    curved={curveType === 'curved'}
                    hideDataPoints={!showDots}
                    showReferenceLine1={showAverage}
                    referenceLine1Position={averageValue}
                    referenceLine1Config={{
                        color: mutedColor,
                        thickness: 1,
                        dashWidth: 2,
                        dashGap: 4,
                        labelText: '',
                    }}
                    spacing={22.5}
                    initialSpacing={10}
                    endSpacing={0}
                />
            </Card.Body>
        </Card>
    );

    if (openDetails) {
        return <PressableFeedback onPress={openDetails}>{cardContent}</PressableFeedback>;
    }

    return cardContent;
}