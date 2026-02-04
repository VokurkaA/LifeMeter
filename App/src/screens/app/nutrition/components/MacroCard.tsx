import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';

interface MacroCardProps {
    name: string;
    consumed: number;
    goal: number;
    underlineColor: string;
}

export function MacroCard({ name, consumed, goal, underlineColor }: MacroCardProps) {
    const fillPercentage = useMemo(() => {
        if (goal === 0) return 0;
        return Math.min((consumed / goal) * 100, 100);
    }, [consumed, goal]);

    return (
        <View className="w-full flex-1 items-center justify-center">
            <Text className="text-xl font-bold mb-1">{name}</Text>
            <View className='relative w-full'>
                <View
                    style={{ backgroundColor: underlineColor, opacity: 0.25 }}
                    className="h-1.5 w-full rounded-full"
                />
                <View
                    style={{ backgroundColor: underlineColor, width: `${fillPercentage}%` }}
                    className="h-1.5 rounded-full absolute top-0 left-0"
                />
            </View>
            <Text className='text-center mt-1 font-semibold text-muted'>{consumed.toFixed()} / {goal} g</Text>
        </View>
    );
}