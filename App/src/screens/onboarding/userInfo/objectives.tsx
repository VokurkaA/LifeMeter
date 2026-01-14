import WeightSelect from "@/components/WeightSelect";
import {useEffect, useMemo, useState} from "react";
import {ScrollView, View} from "react-native";
import {BasicInfoData} from "./basicInfo";
import {BodyInfoData} from "./bodyInfo";
import {LifestyleData} from "./lifestyleInfo";
import DateTimePicker from "@/components/DateTimePicker";
import {Divider, TextField, useThemeColor} from "heroui-native";
import {X} from "lucide-react-native";
import MacroSlider from "@/components/MacroSlider";
import mifflinStJeor from "@/lib/bmr";
import { formatDate, formatTime } from "@/lib/dateTime";

export interface ObjectiveData {
    goalWeight?: number;
    goalWeightUnit?: BasicInfoData["weightUnit"];
    targetDate?: Date | undefined;
    calculatedBmr?: number;
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
    basicInfoData: BasicInfoData;
    bodyInfoData: BodyInfoData;
    lifeStyleData: LifestyleData;
}

export default function Objectives({
                                       onSubmit,
                                       setNextEnabled,
                                       registerOnNext,
                                       initialData,
                                       basicInfoData,
                                       bodyInfoData,
                                       lifeStyleData
                                   }: ObjectivesProps) {
    const mutedColor = useThemeColor("muted");
    const placeholderColor = useThemeColor("field-placeholder");

    const [goalWeight, setGoalWeight] = useState<ObjectiveData["goalWeight"] | undefined>(initialData?.goalWeight);
    const [weightUnit, setWeightUnit] = useState<BasicInfoData["weightUnit"]>(basicInfoData.weightUnit);
    const [targetDate, setTargetDate] = useState<ObjectiveData["targetDate"] | undefined>(initialData?.targetDate);

    const [goalSteps, setGoalSteps] = useState<ObjectiveData["goalSteps"] | undefined>(initialData?.goalSteps);

    const [goalBedtime, setGoalBedtime] = useState<ObjectiveData["goalBedtime"] | undefined>(initialData?.goalBedtime);
    const [goalWakeUpTime, setGoalWakeUpTime] = useState<ObjectiveData["goalWakeUpTime"] | undefined>(initialData?.goalWakeUpTime);

    const [proteinPercentage, setProteinPercentage] = useState(() => {
        switch (lifeStyleData.activityLevel.id) {
            case 1:
                return 20;
            case 2:
                return 25;
            case 3:
                return 30;
            case 4:
                return 35;
            case 5:
                return 40;
            default:
                return 30;
        }
    });

    const [fatPercentage, setFatPercentage] = useState(25);
    const [carbsPercentage, setCarbsPercentage] = useState(100 - proteinPercentage - 25);

    const weightKg = useMemo(() => {
        switch (bodyInfoData.weightUnit) {
            case 'lbs':
                return bodyInfoData.weight * 0.453592;
            case 'st':
                return bodyInfoData.weight * 6.35029;
            default:
                return bodyInfoData.weight;
        }
    }, [bodyInfoData.weight, basicInfoData.weightUnit]);
    const heightCm = useMemo(() => {
        switch (bodyInfoData.heightUnit) {
            case 'ft':
                return bodyInfoData.height * 30.48;
            default:
                return bodyInfoData.height;
        }
    }, [bodyInfoData.height, basicInfoData.lengthUnit]);
    const tdee = useMemo(() => {
        const bmr = mifflinStJeor(basicInfoData.sex, weightKg, heightCm, new Date().getFullYear() - basicInfoData.birthDate.getFullYear());
        const min = Number(lifeStyleData.activityLevel.minFactor);
        const max = Number(lifeStyleData.activityLevel.maxFactor);
        const factor = (min + max) / 2;

        if (!Number.isFinite(bmr) || !Number.isFinite(factor)) return NaN;
        return Math.round(bmr * factor);
    }, [basicInfoData.sex, bodyInfoData.weight, bodyInfoData.height, basicInfoData.birthDate, lifeStyleData.activityLevel]);

    const dailyCaloriesToReachGoal = useMemo(() => {
        if (!goalWeight || !targetDate) return tdee;

        let goalWeightKg = goalWeight;
        switch (weightUnit) {
            case 'lbs':
                goalWeightKg = goalWeight * 0.453592;
                break;
            case 'st':
                goalWeightKg = goalWeight * 6.35029;
                break;
        }

        let currentWeightKg = bodyInfoData.weight;
        switch (basicInfoData.weightUnit) {
            case 'lbs':
                currentWeightKg = bodyInfoData.weight * 0.453592;
                break;
            case 'st':
                currentWeightKg = bodyInfoData.weight * 6.35029;
                break;
        }

        const today = new Date();
        const days = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

        const weightChangeKg = goalWeightKg - currentWeightKg;
        const totalCaloriesChange = weightChangeKg * 7700;
        const dailyCalorieChange = totalCaloriesChange / days;

        const age = today.getFullYear() - basicInfoData.birthDate.getFullYear();
        const bmr = mifflinStJeor(basicInfoData.sex, currentWeightKg, basicInfoData.lengthUnit === 'ft' ? bodyInfoData.height * 30.48 : bodyInfoData.height, age);

        const min = Number(lifeStyleData.activityLevel.minFactor);
        const max = Number(lifeStyleData.activityLevel.maxFactor);
        const activityFactor = (min + max) / 2;

        const calculatedTdee = bmr * activityFactor;

        return Math.round(calculatedTdee + dailyCalorieChange);
    }, [goalWeight, targetDate, tdee, bodyInfoData.weight, basicInfoData.weightUnit, basicInfoData.sex, basicInfoData.lengthUnit, bodyInfoData.height, basicInfoData.birthDate, lifeStyleData.activityLevel]);

    const isValid = (((goalWeight !== undefined && targetDate !== undefined && dailyCaloriesToReachGoal < 20000 && dailyCaloriesToReachGoal > 0) || (goalWeight === undefined && targetDate === undefined))) && ((goalSteps === undefined || (goalSteps > 0 && goalSteps < 50000)));

    useEffect(() => {
        setNextEnabled(isValid);

        if (!isValid) {
            registerOnNext(null);
            return;
        }

        registerOnNext(() => {
            onSubmit({
                goalWeight,
                targetDate,
                calculatedBmr: dailyCaloriesToReachGoal,
                goalSteps,
                goalBedtime,
                goalWakeUpTime,
                dailyProteinGoalGrams: Math.round(dailyCaloriesToReachGoal * (proteinPercentage / 100) / 4),
                dailyFatGoalGrams: Math.round(dailyCaloriesToReachGoal * (fatPercentage / 100) / 9),
                dailyCarbsGoalGrams: Math.round(dailyCaloriesToReachGoal * (carbsPercentage / 100) / 4),
            })
        });

        return () => registerOnNext(null);
    }, [isValid, setNextEnabled, registerOnNext]);
    
    return (<ScrollView
        className="flex-1"
        contentContainerClassName="flex flex-col gap-4"
    >
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
        <Divider/>
        <MacroSlider
            tdee={dailyCaloriesToReachGoal}
            proteinPercentage={proteinPercentage}
            setProteinPercentage={setProteinPercentage}
            fatPercentage={fatPercentage}
            setFatPercentage={setFatPercentage}
            carbsPercentage={carbsPercentage}
            setCarbsPercentage={setCarbsPercentage}
        />
        <Divider/>
        <View>
            {/* TODO: Replace with heroui-native Slider when available */}
            <TextField>
                <TextField.Label>Goal steps</TextField.Label>
                <TextField.Input
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
        <Divider/>
        <View className="gap-4">
            <DateTimePicker
                label="Bedtime Time Goal"
                placeholder="Select your goal bedtime"
                value={goalBedtime}
                onValueChange={setGoalBedtime}
                mode="time"
                formatValue={formatTime}
                rightIcon={goalBedtime && <X color={mutedColor} size={18}/>}
                rightIconOnPress={() => setGoalBedtime(undefined)}
            />
            <DateTimePicker
                label="Wake-up Time Goal"
                placeholder="Select your goal wake-up time"
                value={goalWakeUpTime}
                onValueChange={setGoalWakeUpTime}
                mode="time"
                formatValue={formatTime}
                rightIcon={goalWakeUpTime && <X color={mutedColor} size={18}/>}
                rightIconOnPress={() => setGoalWakeUpTime(undefined)}
            />
        </View>
    </ScrollView>)
}