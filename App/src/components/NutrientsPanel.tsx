import {View} from "react-native";
import {Text} from '@/components/ui/Text';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "./ui/Card";

export default function NutrientsPanel() {
    return (<View>
            <Card>
                <CardHeader className="flex items-center">
                    <CardTitle>Nutrients</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col items-center">
                    <View className="relative">
                        <View className="w-64 rounded-full aspect-square bg-muted"/>
                        <View className="absolute w-64 rounded-full aspect-square bg-accent"/>
                    </View>
                </CardContent>
                <CardFooter className="flex flex-row justify-around">
                    <NutrientBar nutrientName="Protein" currentValue={84} goalValue={114}/>
                    <NutrientBar nutrientName="Carbs" currentValue={320} goalValue={460}/>
                    <NutrientBar nutrientName="Fat" currentValue={48} goalValue={56}/>
                </CardFooter>
            </Card>
        </View>)
}
const NutrientBar = ({nutrientName, currentValue, goalValue}: {
    nutrientName: string,
    currentValue: number,
    goalValue: number
}) => {
    const percentage = Math.min(currentValue / goalValue * 100, 100);
    return (<View className="items-center">
            <Text className="mb-2 font-medium">{nutrientName}</Text>

            <View className="relative w-24 h-2 mb-2">
                <View className="absolute top-0 left-0 w-full h-full rounded-sm bg-muted"/>
                <View
                    className={`absolute top-0 left-0 h-full rounded-sm bg-accent`}
                    style={{width: `${percentage}%`}}
                />
            </View>

            <Text className="text-sm text-secondary-foreground">
                {currentValue} / {goalValue} g
            </Text>
        </View>)
}