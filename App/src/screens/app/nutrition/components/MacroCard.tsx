import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text, Muted } from '@/components/Text';

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
        <View className="flex-1 items-center">
            <Text className="text-sm font-semibold mb-1.5 uppercase tracking-wider text-muted">{name}</Text>
            <View className='relative w-full h-2 mb-2'>
                <View
                    style={{ backgroundColor: underlineColor, opacity: 0.15 }}
                    className="h-full w-full rounded-full"
                />
                <View
                    style={{ backgroundColor: underlineColor, width: `${fillPercentage}%` }}
                    className="h-full rounded-full absolute top-0 left-0"
                />
            </View>
            <View className="flex-row items-baseline gap-0.5">
                <Text className="text-lg font-bold">{consumed.toFixed()}</Text>
                <Muted className="text-xs font-medium">/ {goal}g</Muted>
            </View>
        </View>
    );
}