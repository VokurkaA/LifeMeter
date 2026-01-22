import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import CameraScreen from "./CameraScreen";
import { Text } from "@/components/Text";
import { useStore } from "@/contexts/useStore";
import { foodService } from "@/services/food.service";
import { Food } from "@/types/food.types";

export default function ScanMeal() {
    const [gtin, setGtin] = useState<string>();
    const [food, setFood] = useState<Food>();

    const handleFound = async (foundGtin: string) => {
        setGtin(foundGtin);
        try {
            const foodData = (await foodService.getFoodByGtin(foundGtin));
            setFood(foodData.data[0]);
        } catch (error) {
            console.error("Error fetching food data:", error);
            return;
        }
        // console.log(foodData)
        // setFood(foodData.data);
    };

    if (!gtin) {
        return <CameraScreen onFound={handleFound} />;
    }
    return (
        <View>
            <Text>Scanned GTIN: {gtin}</Text>
            {food && <Text>{JSON.stringify(food)}</Text>}
        </View>
    );
}