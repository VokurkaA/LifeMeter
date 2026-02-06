import React from 'react';
import { Card } from 'heroui-native';
import NutritionWheel from './NutritionWheel';
import { MacroCard } from './MacroCard';
import { View } from 'react-native';

interface MacroOverviewProps {
    nutrients: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    goals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export function MacroOverview({ nutrients, goals }: MacroOverviewProps) {
    return (
        <Card className="flex flex-col gap-4">
            <Card.Header>
                <Card.Title className="text-center text-2xl">Nutrients</Card.Title>
            </Card.Header>

            <Card.Body className="items-center">
                <NutritionWheel
                    consumed={nutrients.calories}
                    goal={goals.calories}
                    size={240}
                    strokeWidth={15}
                />
            </Card.Body>

            <Card.Footer className="flex flex-row justify-center gap-8">
                <MacroCard
                    name="Protein"
                    consumed={nutrients.protein}
                    goal={goals.protein}
                    underlineColor="#F43F5E"
                />
                <MacroCard
                    name="Carbs"
                    consumed={nutrients.carbs}
                    goal={goals.carbs}
                    underlineColor="#0EA5E9"
                />
                <MacroCard
                    name="Fat"
                    consumed={nutrients.fat}
                    goal={goals.fat}
                    underlineColor="#EAB308"
                />
            </Card.Footer>
        </Card>
    );
}
