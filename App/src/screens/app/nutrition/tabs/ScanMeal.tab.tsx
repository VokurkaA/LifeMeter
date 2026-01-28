import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import CameraScreen from "../components/CameraScreen";
import { Text } from "@/components/Text";
import { foodService } from "@/services/food.service";
import { CreateMealInput, FoodDetail } from "@/types/food.types";
import FoodDetailForm from "../components/FoodDetailForm";
import { Button, useThemeColor, useToast } from "heroui-native";
import { RefreshCcw } from "lucide-react-native";

interface ScanMealProps {
    onSuccess?: () => void;
    createUserMeal: (data: CreateMealInput) => Promise<void>;
}

export default function ScanMeal({ onSuccess, createUserMeal }: ScanMealProps) {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [foodDetail, setFoodDetail] = useState<FoodDetail>();
    const [error, setError] = useState<string>();
    const foregroundColor = useThemeColor('foreground')

    const handleFound = async (foundGtin: string) => {
        setIsScanning(false);
        setIsLoading(true);
        setError(undefined);
        try {
            const foodData = await foodService.getFoodByGtin(foundGtin);
            if (foodData.data && foodData.data.length > 0) {
                const detail = await foodService.getFoodById(foodData.data[0].id);
                setFoodDetail(detail);
            } else {
                const msg = "Food not found for this barcode.";
                setError(msg);
                toast.show({
                    variant: "danger",
                    label: 'Scan failed',
                    description: msg,
                });
            }
        } catch (error) {
            console.error("Error fetching food data:", error);
            const msg = "Failed to fetch food data. Please try again.";
            setError(msg);
            toast.show({
                variant: "danger",
                label: 'Scan failed',
                description: msg,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setIsScanning(true);
        setFoodDetail(undefined);
        setError(undefined);
    };

    const handleSuccess = () => {
        handleReset();
        onSuccess?.();
    };

    if (isScanning) {
        return <CameraScreen onFound={handleFound} />;
    } if (isLoading) {
        return (
            <View className="items-center py-8">
                <ActivityIndicator size="large" />
                <Text className="mt-2">Fetching food details...</Text>
            </View>
        )
    } if (error) {
        return (
            <View className="items-center py-8 gap-4">
                <Text className="text-danger-foreground font-semibold">{error}</Text>
                <Button onPress={handleReset} variant="tertiary" className="flex-row gap-2">
                    <RefreshCcw color={foregroundColor} size={18} />
                    <Text>Try Again</Text>
                </Button>
            </View>
        )
    } if (foodDetail) {
        return (
            <View className="gap-4">
                <FoodDetailForm
                    foodDetail={foodDetail}
                    onSuccess={handleSuccess}
                    createUserMeal={createUserMeal}
                />
                <Button onPress={handleReset} variant="ghost">
                    Scan Another
                </Button>
            </View>
        );
    }
}
