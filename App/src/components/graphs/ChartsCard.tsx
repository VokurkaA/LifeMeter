import { Card, PressableFeedback, useThemeColor } from "heroui-native"
import { ChevronRight } from "lucide-react-native"
import { View } from "react-native"
import { createContext, useContext, useState } from "react"

type ChartCardContextValue = {
    setAverageValue: (value: number) => void;
};

const ChartCardContext = createContext<ChartCardContextValue | null>(null);

export const useChartCardContext = () => useContext(ChartCardContext);

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
    const [averageFromChild, setAverageFromChild] = useState<number | undefined>(undefined);

    return (
        <ChartCardContext.Provider value={{ setAverageValue: setAverageFromChild }}>
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
                                    {averageFromChild ?? averageValue ?? 0} {averageDescription}
                                </Card.Description>
                            </Card.Footer>
                        )}
                    </View>

                    <Card.Body className="flex items-center justify-center mr-4">
                        {children}
                    </Card.Body>
                </Card>
            </PressableFeedback>
        </ChartCardContext.Provider>
    )
}