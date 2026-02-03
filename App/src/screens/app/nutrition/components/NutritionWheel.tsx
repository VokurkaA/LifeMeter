import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useThemeColor } from 'heroui-native';
import { Text, Muted } from '@/components/Text';
import Animated, { useAnimatedProps, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface NutritionWheelProps {
    consumed: number;
    goal: number;
    size?: number;
    strokeWidth?: number;
}

export default function NutritionWheel({ consumed, goal, size = 200, strokeWidth = 15 }: NutritionWheelProps) {
    const primaryColor = useThemeColor('accent');
    const mutedColor = useThemeColor('muted');

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
    
    const animatedProgress = useSharedValue(0);

    React.useEffect(() => {
        animatedProgress.value = withTiming(progress, { duration: 1000 });
    }, [progress]);

    const animatedProps = useAnimatedProps(() => {
        const offset = circumference * (1 - animatedProgress.value);
        return {
            strokeDashoffset: offset,
        };
    });

    return (
        <View className="items-center justify-center">
            <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                        <Circle
                            cx={size / 2}
                            cy={size / 2}   
                            r={radius}
                            stroke={mutedColor}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            opacity={0.2}
                        />
                        <AnimatedCircle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={primaryColor}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            animatedProps={animatedProps}
                        />
                    </G>
                </Svg>
                
                <View className="absolute items-center justify-center">
                    <Text className="text-3xl font-bold">{Math.round(consumed)}</Text>
                    <Muted className="text-sm">/ {Math.round(goal)} kcal</Muted>
                </View>
            </View>
        </View>
    );
}
