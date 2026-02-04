import React, { useMemo } from 'react';
import { View } from 'react-native';
import { BottomSheet, Card, PressableFeedback, useThemeColor } from 'heroui-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Text } from '@/components/Text';
import { NutrientTotal } from '../hooks/useDailyNutrition';
import { ChevronRight } from 'lucide-react-native';

interface MicronutrientsSheetProps {
    micros: Record<number, NutrientTotal>;
}

export default function MicronutrientsSheet({ micros }: MicronutrientsSheetProps) {
    const foregroundColor = useThemeColor('foreground');
    const nutrientList = useMemo(() => {
        return Object.values(micros).sort((a, b) => a.name.localeCompare(b.name)).filter(n => n.amount > 0);
    }, [micros]);

    return (
        <BottomSheet>
            <BottomSheet.Trigger asChild>
                <PressableFeedback>
                    <Card>
                        <Card.Header className='flex flex-row-reverse justify-between items-center'>
                            <ChevronRight size={20} color={foregroundColor} />
                            <Card.Title>All Micronutrients</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Card.Description>Vitamins, minerals, and other nutrients</Card.Description>
                        </Card.Body>
                    </Card>
                </PressableFeedback>
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content
                    enablePanDownToClose
                    index={1}
                    snapPoints={['60%', '90%']}
                    contentContainerClassName="h-full flex-1"
                >
                    <BottomSheet.Title className="mb-4">Daily Micronutrients</BottomSheet.Title>
                    <BottomSheetFlatList
                        showVerticalScrollIndicator={false}
                        className="flex-1"
                        data={nutrientList}
                        keyExtractor={(item: NutrientTotal) => item.id.toString()}
                        renderItem={({ item }: { item: NutrientTotal }) => (
                            <View className="flex-row justify-between items-center py-3">
                                <Text className='text-muted'>{item.name}</Text>
                                <Text>{formatAmount(item.amount)} {item.unit}</Text>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text className="text-center mt-8 text-muted">No micronutrient data available for today.</Text>
                        }
                    />
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}

function formatAmount(amount: number): string {
    if (amount < 1) return amount.toFixed(2);
    if (amount < 10) return amount.toFixed(1);
    return Math.round(amount).toString();
}