import React from 'react';
import { View } from 'react-native';
import { Card, useThemeColor } from 'heroui-native';
import { Text, Muted } from '@/components/Text';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface MacroProgressProps {
    nutrition: {
        protein: number;
        carbs: number;
        fat: number;
    };
    goals: {
        protein: number;
        carbs: number;
        fat: number;
        calories?: number;
    };
}

export default function MacroProgress({ nutrition, goals }: MacroProgressProps) {
    return (
        <View className="flex-row gap-2 justify-between">
            <MacroCard
                label="Protein"
                current={nutrition.protein}
                max={goals.protein}
                color="accent"
            />
            <MacroCard
                label="Carbs"
                current={nutrition.carbs}
                max={goals.carbs}
                color="foreground" 
            />
            <MacroCard
                label="Fats"
                current={nutrition.fat}
                max={goals.fat}
                color="danger" 
            />
        </View>
    );
}

interface MacroCardProps {
    label: string;
    current: number;
    max: number;
    color?: 'accent' | 'foreground' | 'danger' | 'muted'; 
}

function MacroCard({ label, current, max, color = 'accent' }: MacroCardProps) {
    const themeColor = useThemeColor(color); 
    const mutedColor = useThemeColor('muted');
    
    const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    
    const width = useSharedValue(0);

    React.useEffect(() => {
        width.value = withTiming(percentage, { duration: 1000 });
    }, [percentage]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${width.value}%`,
        };
    });

    return (
        <Card className="flex-1 p-3">
            <Text className="font-semibold text-sm mb-1">{label}</Text>
            
            <View className="flex-row items-baseline gap-0.5 mb-2">
                <Text className="text-lg font-bold">{Math.round(current)}</Text>
                <Muted className="text-xs">/ {Math.round(max)}g</Muted>
            </View>

            <View className="h-2 w-full bg-muted/20 rounded-full overflow-hidden relative">
                <View style={{ backgroundColor: mutedColor, opacity: 0.2 }} className="absolute inset-0" />
                <Animated.View 
                    style={[
                        { height: '100%', borderRadius: 9999, backgroundColor: themeColor },
                        animatedStyle
                    ]} 
                />
            </View>
        </Card>
    );
}
