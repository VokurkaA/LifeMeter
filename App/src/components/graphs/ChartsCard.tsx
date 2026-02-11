import { Card, PressableFeedback, useThemeColor } from "heroui-native"
import { ChevronRight } from "lucide-react-native"
import { View } from "react-native"

type ChartCardProps = {
    title?: string;
    description?: string;
    averageDescription?: string;
    showAverage?: boolean;
    averageValue?: number;
    children: React.ReactNode;
    openDetails?: () => void;
};

export const ChartCard = ({
    title,
    description,
    openDetails,
    showAverage,
    averageDescription,
    averageValue,
    children
}: ChartCardProps) => {
    const foregroundColor = useThemeColor("foreground");

    return (
        <PressableFeedback onPress={openDetails} isDisabled={!openDetails}>
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
                                {averageValue ?? 0} {averageDescription}
                            </Card.Description>
                        </Card.Footer>
                    )}
                </View>

                <Card.Body className="flex items-center justify-center mr-4">
                    {children}
                </Card.Body>
            </Card>
        </PressableFeedback>
    )
}