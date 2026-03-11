import { PressableFeedback, useThemeColor, Card } from "heroui-native";
import { ChevronRight } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/Text";

type ChartCardProps = {
    title?: string;
    description?: string;
    averageValue?: number | string;
    averageLabel?: string;
    children: React.ReactNode;
    onPress?: () => void;
};

export const ChartCard = ({
    title,
    description,
    onPress,
    averageValue,
    averageLabel = "Average",
    children
}: ChartCardProps) => {
    const foregroundColor = useThemeColor("foreground");

    return (
        <PressableFeedback onPress={onPress} isDisabled={!onPress}>
            <Card className="flex flex-row">
                {onPress && (
                    <View className="absolute top-4 right-4 z-50">
                        <ChevronRight size={28} color={foregroundColor} />
                    </View>
                )}

                <View className="flex flex-col justify-between">
                    {(title || description) && (
                        <Card.Header>
                            {title && <Card.Title className="text-2xl">{title}</Card.Title>}
                            {description && <Card.Description className="text-sm">{description}</Card.Description>}
                        </Card.Header>
                    )}

                    {averageValue !== undefined && (
                        <Card.Footer>
                            <Card.Title className="text-base">{averageLabel}</Card.Title>
                            <Card.Description >{String(averageValue)}</Card.Description>
                        </Card.Footer>
                    )}
                </View>

                <Card.Body className="flex-1 px-4">
                    {children}
                </Card.Body>
            </Card>
        </PressableFeedback>
    );
};