import {BackHandler, View} from "react-native";
import {H1, H2, H3} from "@/components/Text";
import {useCallback, useEffect, useState} from "react";
import {Button} from "heroui-native";
import Animated, {SharedValue, useAnimatedStyle, useDerivedValue, withTiming,} from "react-native-reanimated";
import BasicInfo, {type BasicInfoData} from './basicInfo';
import BodyInfo, {type BodyInfoData} from "./bodyInfo";
import LifestyleInfo, {LifestyleData} from "./lifestyleInfo";
import Objectives, {ObjectiveData} from "./objectives";
import {useExitConfirmBackHandler} from "@/navigation/back-handler";
import { useUserStore } from "@/contexts/useUserStore";
import {
    convertHeightToCm,
    convertWeightToGrams,
    normalizeSexToProfile,
    toDateOnlyString,
    toTimeString,
} from "@/lib/calorieTargets";

export default function Onboarding() {
    const {updateProfile, updateGoals, logWeight, logHeight, lengthUnits, weightUnits}= useUserStore();
    const [nextEnabled, setNextEnabled] = useState(false);
    const [onNext, setOnNext] = useState<null | (() => void)>(null);
    const registerOnNext = useCallback((nextHandler: null | (() => void)) => {
        setOnNext(() => nextHandler);
    }, []);

    const [step, setStep] = useState(0);
    const totalSteps = 4;

    const defaultSubheadings = [
        "Let's get you started",                // BasicInfo
        "Help us understand your body",         // BodyInfo
        "Tell us about your daily activity",    // LifestyleInfo
        "Set your goals",                       // Objectives
    ];

    useExitConfirmBackHandler(step === 0);

    const [basicInfo, setBasicInfo] = useState<BasicInfoData | undefined>();
    const [bodyInfo, setBodyInfo] = useState<BodyInfoData | undefined>();
    const [lifestyleInfo, setLifestyleInfo] = useState<LifestyleData | undefined>();
    const [objectives, setObjectives] = useState<ObjectiveData | undefined>();

    const fillComponent = [<BasicInfo
        key="basic"
        initialData={basicInfo}
        onSubmit={setBasicInfo}
        setNextEnabled={setNextEnabled}
        registerOnNext={registerOnNext}
    />, <BodyInfo
        key="body"
        initialData={bodyInfo}
        onSubmit={setBodyInfo}
        setNextEnabled={setNextEnabled}
        registerOnNext={registerOnNext}
        defaultHeightUnit={basicInfo?.lengthUnit}
        defaultWeightUnit={basicInfo?.weightUnit}
    />, <LifestyleInfo
        key="life"
        initialData={lifestyleInfo}
        onSubmit={setLifestyleInfo}
        setNextEnabled={setNextEnabled}
        registerOnNext={registerOnNext}
    />, <Objectives
        key="obj"
        onSubmit={setObjectives}
        setNextEnabled={setNextEnabled}
        registerOnNext={registerOnNext}
        initialData={objectives}
        basicInfoData={basicInfo!}
        bodyInfoData={bodyInfo!}
        lifeStyleData={lifestyleInfo!}
    />];

    const handleNext = useCallback(() => {
        if (onNext) onNext();
        if (step === totalSteps - 1) {
            updateProfile({
                dateOfBirth: toDateOnlyString(basicInfo?.birthDate),
                sex: normalizeSexToProfile(basicInfo?.sex),
                currentActivityFactor: (Number(lifestyleInfo?.activityLevel.minFactor) + Number(lifestyleInfo?.activityLevel.maxFactor)) / 2,
                currentBmrCalories: objectives?.dailyCalorieTarget,
                defaultWeightUnitId: weightUnits.find((u) => u.name === basicInfo?.weightUnit)?.id,
                defaultLengthUnitId: lengthUnits.find((u) => u.name === basicInfo?.lengthUnit)?.id,
                finishedOnboarding: true,
            });

            updateGoals({
                dailyStepsGoal: objectives?.goalSteps,
                bedtimeGoal: toTimeString(objectives?.goalBedtime), 
                wakeupGoal: toTimeString(objectives?.goalWakeUpTime),
                dailyProteinGoalGrams: objectives?.dailyProteinGoalGrams,
                dailyFatGoalGrams: objectives?.dailyFatGoalGrams,
                dailyCarbsGoalGrams: objectives?.dailyCarbsGoalGrams,
                targetWeightGrams: convertWeightToGrams(objectives?.goalWeight, objectives?.goalWeightUnit),
                targetWeightDate: toDateOnlyString(objectives?.targetDate),
            });

            logWeight({
                measuredAt: new Date().toISOString(),
                weightGrams: convertWeightToGrams(bodyInfo?.weight, basicInfo?.weightUnit)!,
                bodyFatPercentage: bodyInfo?.bodyFatPercentage ?? null,
                leanTissuePercentage: bodyInfo?.leanTissuePercentage ?? null,
                waterPercentage: bodyInfo?.waterPercentage ?? null,
                boneMassPercentage: bodyInfo?.boneMassPercentage ?? null,
            });

            logHeight({
                measuredAt: new Date().toISOString(),
                heightCm: convertHeightToCm(bodyInfo?.height, basicInfo?.lengthUnit)!,
            });
        }
        setStep((s) => {
            return Math.min(totalSteps - 1, s + 1);
        });

        setNextEnabled(false);
        setOnNext(null);
    }, [onNext, step, basicInfo, bodyInfo, lifestyleInfo, objectives]);

    const handleBack = useCallback(() => {
        setStep((s) => Math.max(0, s - 1));
        setNextEnabled(false);
        setOnNext(null);
    }, []);

    useEffect(() => {
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            if (step > 0) {
                handleBack();
                return true;
            }
            return false;
        });

        return () => sub.remove();
    }, [step, handleBack]);

    return (<View className="items-center flex-1 px-4">
        <ProgressBar step={step} totalSteps={totalSteps}/>
        <H2 className="mt-8">Almost there</H2>
        <H3 className="text-2xl">{defaultSubheadings[step]}</H3>

        <View className="flex-1 w-full">
            {fillComponent[step]}
        </View>

        <View className="flex flex-row gap-2 my-4">
            {step > 0 && (
                <Button
                    variant="tertiary"
                    onPress={handleBack}
                    className="flex-1"
                >
                    <Button.Label>Back</Button.Label>
                </Button>
            )}

            <Button
                variant="primary"
                onPress={handleNext}
                isDisabled={!nextEnabled}
                className="flex-1"
            >
                <Button.Label>{step === totalSteps - 1 ? "Finish" : "Next"}</Button.Label>
            </Button>
        </View>
    </View>);
}

const ProgressBar = ({step, totalSteps}: { step: number; totalSteps: number; }) => {
    const progress = useDerivedValue(() => withTiming(step, {duration: 200}), [step],);

    return (<View className="flex-row w-full gap-1 mt-4">
        {Array.from({length: totalSteps}).map((_, index) => (<Segment
            key={index}
            index={index}
            totalSteps={totalSteps}
            progress={progress}
            step={step}
        />))}
    </View>);
};

const Segment = ({index, totalSteps, progress, step}: {
    index: number; totalSteps: number; progress: SharedValue<number>; step: number;
}) => {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${Math.max(0, Math.min(1, progress.value - index)) * 100}%`,
        };
    });

    const containerRadiusClass = (() => {
        const val: string[] = [];
        if (index === 0) val.push("rounded-l-full");
        if (index === totalSteps - 1) val.push("rounded-r-full");
        return val.join(" ");
    })();

    const fillRadiusClass = (() => {
        const val: string[] = [];
        if (index === 0) val.push("rounded-l-full");
        if (index === step - 1) val.push("rounded-r-full"); else if (index === totalSteps - 1) val.push("rounded-r-full");
        return val.join(" ");
    })();

    return (<View className={`flex-1 h-2 overflow-hidden bg-default ${containerRadiusClass}`}>
        <Animated.View
            className={`h-full bg-foreground ${fillRadiusClass}`}
            style={animatedStyle}
        />
    </View>);
};
