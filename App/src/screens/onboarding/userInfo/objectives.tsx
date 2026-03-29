import WeightSelect from "@/components/WeightSelect";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { BasicInfoData } from "./basicInfo";
import { BodyInfoData } from "./bodyInfo";
import { LifestyleData } from "./lifestyleInfo";
import DateTimePicker from "@/components/DateTimePicker";
import { Separator, TextField, Input, Label, useThemeColor } from "heroui-native";
import { X } from "lucide-react-native";
import MacroSlider from "@/components/MacroSlider";
import {
    calculateDailyCalorieTarget,
    calculateMacroGoals,
    deriveMacroPercentages,
} from "@/lib/calorieTargets";
import { formatDate, formatTime } from "@/lib/dateTime";

export interface ObjectiveData {
    goalWeight?: number;
    goalWeightUnit?: BasicInfoData["weightUnit"];
    targetDate?: Date | undefined;
    dailyCalorieTarget?: number;
    goalSteps?: number;
    goalBedtime?: Date | undefined;
    goalWakeUpTime?: Date | undefined;
    dailyProteinGoalGrams?: number;
    dailyCarbsGoalGrams?: number;
    dailyFatGoalGrams?: number;
}

interface ObjectivesProps {
    onSubmit: (data: ObjectiveData) => void;
    setNextEnabled: (enabled: boolean) => void;
    registerOnNext: (onNext: null | (() => void)) => void;
    initialData?: ObjectiveData;
    basicInfoData?: Partial<BasicInfoData>;
    bodyInfoData?: Partial<BodyInfoData>;
    lifeStyleData?: Partial<LifestyleData>;
    onDraftChange?: (data: Partial<ObjectiveData>) => void;
    scrollable?: boolean;
}

export default function Objectives({
    onSubmit,
    setNextEnabled,
    registerOnNext,
    initialData,
    basicInfoData,
    bodyInfoData,
    lifeStyleData,
    onDraftChange,
    scrollable = true,
}: ObjectivesProps) {
    const mutedColor = useThemeColor("muted");
    const placeholderColor = useThemeColor("field-placeholder");

    const [goalWeight, setGoalWeight] = useState<ObjectiveData["goalWeight"] | undefined>(initialData?.goalWeight);
    const [weightUnit, setWeightUnit] = useState<BasicInfoData["weightUnit"]>(
        initialData?.goalWeightUnit ?? basicInfoData?.weightUnit ?? "kg"
    );
    const [targetDate, setTargetDate] = useState<ObjectiveData["targetDate"] | undefined>(initialData?.targetDate);

    const [goalSteps, setGoalSteps] = useState<ObjectiveData["goalSteps"] | undefined>(initialData?.goalSteps);

    const [goalBedtime, setGoalBedtime] = useState<ObjectiveData["goalBedtime"] | undefined>(initialData?.goalBedtime);
    const [goalWakeUpTime, setGoalWakeUpTime] = useState<ObjectiveData["goalWakeUpTime"] | undefined>(initialData?.goalWakeUpTime);

    const initialCalculation = calculateDailyCalorieTarget({
        sex: basicInfoData?.sex,
        birthDate: basicInfoData?.birthDate,
        weight: bodyInfoData?.weight,
        weightUnit: bodyInfoData?.weightUnit,
        height: bodyInfoData?.height,
        heightUnit: bodyInfoData?.heightUnit,
        activityFactor: (() => {
            const min = Number(lifeStyleData?.activityLevel?.minFactor);
            const max = Number(lifeStyleData?.activityLevel?.maxFactor);
            if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
            return (min + max) / 2;
        })(),
        goalWeight: initialData?.goalWeight,
        goalWeightUnit: initialData?.goalWeightUnit ?? basicInfoData?.weightUnit,
        targetDate: initialData?.targetDate,
    });

    const initialMacroPercentages = deriveMacroPercentages({
        activityLevelId: lifeStyleData?.activityLevel?.id,
        dailyCalorieTarget: initialData?.dailyCalorieTarget ?? initialCalculation.dailyCalorieTarget,
        dailyProteinGoalGrams: initialData?.dailyProteinGoalGrams,
        dailyFatGoalGrams: initialData?.dailyFatGoalGrams,
        dailyCarbsGoalGrams: initialData?.dailyCarbsGoalGrams,
    });

    const [proteinPercentage, setProteinPercentage] = useState(initialMacroPercentages.proteinPercentage);

    const [fatPercentage, setFatPercentage] = useState(initialMacroPercentages.fatPercentage);
    const [carbsPercentage, setCarbsPercentage] = useState(initialMacroPercentages.carbsPercentage);

    const activityFactor = useMemo(() => {
        const min = Number(lifeStyleData?.activityLevel?.minFactor);
        const max = Number(lifeStyleData?.activityLevel?.maxFactor);
        if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
        return (min + max) / 2;
    }, [lifeStyleData?.activityLevel?.maxFactor, lifeStyleData?.activityLevel?.minFactor]);

    const calorieTargets = useMemo(() => calculateDailyCalorieTarget({
        sex: basicInfoData?.sex,
        birthDate: basicInfoData?.birthDate,
        weight: bodyInfoData?.weight,
        weightUnit: bodyInfoData?.weightUnit,
        height: bodyInfoData?.height,
        heightUnit: bodyInfoData?.heightUnit,
        activityFactor,
        goalWeight,
        goalWeightUnit: weightUnit,
        targetDate,
    }), [
        activityFactor,
        basicInfoData?.birthDate,
        basicInfoData?.sex,
        bodyInfoData?.height,
        bodyInfoData?.heightUnit,
        bodyInfoData?.weight,
        bodyInfoData?.weightUnit,
        goalWeight,
        targetDate,
        weightUnit,
    ]);

    const dailyCalorieTarget = calorieTargets.dailyCalorieTarget;
    const macroGoals = useMemo(() => calculateMacroGoals(dailyCalorieTarget, {
        proteinPercentage,
        fatPercentage,
        carbsPercentage,
    }), [dailyCalorieTarget, proteinPercentage, fatPercentage, carbsPercentage]);

    const isGoalPairValid =
        (goalWeight !== undefined && targetDate !== undefined) ||
        (goalWeight === undefined && targetDate === undefined);
    const hasValidCalorieTarget =
        dailyCalorieTarget !== null &&
        Number.isFinite(dailyCalorieTarget) &&
        dailyCalorieTarget > 0 &&
        dailyCalorieTarget < 20000;
    const isStepGoalValid = goalSteps === undefined || (goalSteps > 0 && goalSteps < 50000);
    const isValid = isGoalPairValid && isStepGoalValid && hasValidCalorieTarget;

    const draft = useMemo<ObjectiveData>(() => ({
        goalWeight,
        goalWeightUnit: weightUnit,
        targetDate,
        dailyCalorieTarget: dailyCalorieTarget ?? undefined,
        goalSteps,
        goalBedtime,
        goalWakeUpTime,
        dailyProteinGoalGrams: macroGoals.dailyProteinGoalGrams,
        dailyFatGoalGrams: macroGoals.dailyFatGoalGrams,
        dailyCarbsGoalGrams: macroGoals.dailyCarbsGoalGrams,
    }), [
        dailyCalorieTarget,
        goalBedtime,
        goalSteps,
        goalWakeUpTime,
        goalWeight,
        macroGoals.dailyCarbsGoalGrams,
        macroGoals.dailyFatGoalGrams,
        macroGoals.dailyProteinGoalGrams,
        targetDate,
        weightUnit,
    ]);

    useEffect(() => {
        onDraftChange?.(draft);
        setNextEnabled(isValid);

        if (!isValid) {
            registerOnNext(null);
            return;
        }

        registerOnNext(() => {
            onSubmit(draft);
        });

        return () => registerOnNext(null);
    }, [draft, isValid, onDraftChange, onSubmit, registerOnNext, setNextEnabled]);

    const content = (<>
        <View>
            <WeightSelect
                weight={goalWeight}
                setWeight={(val) => {
                    setGoalWeight(val);
                    if (!val) setTargetDate(undefined);
                }}
                weightUnit={weightUnit}
                setWeightUnit={setWeightUnit}
                label="Add your goal weight"
                required={false}
            />
            <DateTimePicker
                label='Goal date'
                placeholder='Reach weight by'
                value={targetDate}
                onValueChange={setTargetDate}
                minimumDate={new Date()}
                maximumDate={new Date(new Date().getFullYear() + 2, new Date().getMonth(), new Date().getDate())}
                mode='date'
                display='spinner'
                formatValue={formatDate}
                isDisabled={goalWeight === undefined}
            />
        </View>
        <Separator />
        <MacroSlider
            tdee={dailyCalorieTarget ?? 0}
            proteinPercentage={proteinPercentage}
            setProteinPercentage={setProteinPercentage}
            fatPercentage={fatPercentage}
            setFatPercentage={setFatPercentage}
            carbsPercentage={carbsPercentage}
            setCarbsPercentage={setCarbsPercentage}
            isDisabled={!hasValidCalorieTarget}
        />
        <Separator />
        <View>
            <TextField>
                <Label>Goal steps</Label>
                <Input
                    value={goalSteps ? String(goalSteps) : undefined}
                    onChangeText={(text => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        const parsed = parseInt(cleaned, 10);
                        if (isNaN(parsed)) {
                            setGoalSteps(undefined);
                        } else {
                            setGoalSteps(parsed);
                        }
                    })}
                    keyboardType="number-pad"
                    placeholderTextColor={placeholderColor}
                    placeholder="Add a step goal"
                    numberOfLines={1}
                />
            </TextField>
        </View>
        <Separator />
        <View className="gap-4">
            <DateTimePicker
                label="Bedtime Time Goal"
                placeholder="Select your goal bedtime"
                value={goalBedtime}
                onValueChange={setGoalBedtime}
                mode="time"
                formatValue={formatTime}
                rightIcon={goalBedtime && <X color={mutedColor} size={18} />}
                rightIconOnPress={() => setGoalBedtime(undefined)}
            />
            <DateTimePicker
                label="Wake-up Time Goal"
                placeholder="Select your goal wake-up time"
                value={goalWakeUpTime}
                onValueChange={setGoalWakeUpTime}
                mode="time"
                formatValue={formatTime}
                rightIcon={goalWakeUpTime && <X color={mutedColor} size={18} />}
                rightIconOnPress={() => setGoalWakeUpTime(undefined)}
            />
        </View>
    </>);

    if (!scrollable) {
        return <View className="gap-4">{content}</View>;
    }

    return (
        <ScrollView
            className="flex-1"
            contentContainerClassName="flex flex-col gap-4"
        >
            {content}
        </ScrollView>
    )
}
