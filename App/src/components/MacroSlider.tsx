import { Description, Label, Slider, useThemeColor } from "heroui-native";
import { View } from "react-native";
import { Muted, Text } from "@/components/Text";

interface MacroSliderProps {
    tdee: number;
    proteinPercentage: number;
    setProteinPercentage: (val: number) => void;
    fatPercentage: number;
    setFatPercentage: (val: number) => void;
    carbsPercentage: number;
    setCarbsPercentage: (val: number) => void;
}

interface MacroSliderItemProps {
    label: string;
    percentage: number;
    onChange: (val: number) => void;
    divisor: number;
    tdee: number;
}

function MacroSliderItem({
    label,
    percentage,
    onChange,
    divisor,
    tdee,
}: MacroSliderItemProps) {
    const getGrams = (percent: number, divisor: number) => {
        if (!tdee) return "0.0";
        return ((percent * tdee) / 100 / divisor).toFixed(1);
    };

    return (
        <View>
            <View>
                <Label>{label}</Label>
                <View className="flex flex-row justify-between">
                    <Label>{getGrams(percentage, divisor)}g</Label>
                    <Description className="text-right">
                        {(tdee * percentage / 100).toFixed(0)} kcal ({percentage}%)
                    </Description>
                </View>
            </View>
            <Slider
                value={percentage}
                onChange={(val) => onChange(val as number)}
                minValue={0}
                maxValue={100}
                step={1}
                className="w-full"
            >
                <Slider.Track>
                    <Slider.Fill className="bg-accent" />
                    <Slider.Thumb className="bg-foreground" />
                </Slider.Track>
            </Slider>
        </View>
    );
}

export default function MacroSlider({
    tdee,
    proteinPercentage,
    setProteinPercentage,
    fatPercentage,
    setFatPercentage,
    carbsPercentage,
    setCarbsPercentage
}: MacroSliderProps) {

    const distributeChange = (newVal: number, oldVal: number, otherVal1: number, otherVal2: number): [number, number] => {
        const delta = newVal - oldVal;
        const split = delta / 2;

        let newOther1 = otherVal1 - split;
        let newOther2 = otherVal2 - split;

        if (newOther1 < 0) {
            newOther2 += newOther1;
            newOther1 = 0;
        } else if (newOther2 < 0) {
            newOther1 += newOther2;
            newOther2 = 0;
        }

        newOther1 = Math.round(newOther1);
        newOther2 = 100 - newVal - newOther1;

        if (newOther2 < 0) {
            newOther2 = 0;
            newOther1 = 100 - newVal;
        }

        return [newOther1, newOther2];
    };

    const onProteinChange = (val: number) => {
        const [newFat, newCarbs] = distributeChange(val, proteinPercentage, fatPercentage, carbsPercentage);
        setProteinPercentage(val);
        setFatPercentage(newFat);
        setCarbsPercentage(newCarbs);
    };

    const onFatChange = (val: number) => {
        const [newProtein, newCarbs] = distributeChange(val, fatPercentage, proteinPercentage, carbsPercentage);
        setFatPercentage(val);
        setProteinPercentage(newProtein);
        setCarbsPercentage(newCarbs);
    };

    const onCarbsChange = (val: number) => {
        const [newProtein, newFat] = distributeChange(val, carbsPercentage, proteinPercentage, fatPercentage);
        setCarbsPercentage(val);
        setProteinPercentage(newProtein);
        setFatPercentage(newFat);
    };

    return (
        <View className="gap-4">
            <MacroSliderItem
                label="Protein"
                percentage={proteinPercentage}
                onChange={onProteinChange}
                divisor={4}
                tdee={tdee}
            />
            <MacroSliderItem
                label="Fats"
                percentage={fatPercentage}
                onChange={onFatChange}
                divisor={9}
                tdee={tdee}
            />
            <MacroSliderItem
                label="Carbohydrates"
                percentage={carbsPercentage}
                onChange={onCarbsChange}
                divisor={4}
                tdee={tdee}
            />
        </View>
    );
}