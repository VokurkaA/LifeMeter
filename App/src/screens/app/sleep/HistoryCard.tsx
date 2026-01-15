import { Card, PressableFeedback, useThemeColor } from "heroui-native";
import { ChevronRight } from "lucide-react-native";

interface HistoryCardProps {
    onPress: () => void;
    totalCount: number;
    className?: string;
}

export const HistoryCard = ({ onPress, totalCount, className }: HistoryCardProps) => {
    const mutedColor = useThemeColor('muted');
    const foregroundColor = useThemeColor('foreground');

    return (
        <PressableFeedback onPress={onPress} className={className}>
            <Card className="gap-2">
                <Card.Body className="flex-row justify-between items-center">
                    <Card.Title>View all entries</Card.Title>
                    <ChevronRight size={20} color={mutedColor} />
                </Card.Body>
            </Card>
        </PressableFeedback>
    );
}
