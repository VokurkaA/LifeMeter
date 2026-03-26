import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, Card, useThemeColor } from "heroui-native";
import { ChevronLeft } from "lucide-react-native";
import MainLayout from "@/layouts/Main.layout";
import { H2, Text } from "@/components/Text";
import { AppStackParamList } from "@/types/types";
import BasicInfo, { BasicInfoData } from "@/screens/onboarding/userInfo/basicInfo";
import BodyInfo, { BodyInfoData } from "@/screens/onboarding/userInfo/bodyInfo";
import LifestyleInfo, { LifestyleData } from "@/screens/onboarding/userInfo/lifestyleInfo";
import Objectives, { ObjectiveData } from "@/screens/onboarding/userInfo/objectives";
import { useUserStore } from "@/contexts/useUserStore";
import { toast } from "@/lib/toast";
import { timeToDate } from "@/lib/dateTime";
import type { ActivityLevel } from "@/types/user.profile.types";
import {
    convertCmToHeight,
    convertGramsToWeight,
    convertHeightToCm,
    convertWeightToGrams,
    getPreferredUnit,
    normalizeSexFromProfile,
    normalizeSexToProfile,
    parseDateOnly,
    toDateOnlyString,
    toTimeString,
    type LengthUnitName,
    type WeightUnitName,
} from "@/lib/calorieTargets";

type Props = NativeStackScreenProps<AppStackParamList, "UserSettings">;
type SaveAction = null | (() => void);
type SectionKey = "basic" | "body" | "lifestyle" | "objectives";

function toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Something went wrong.";
}

function roundNumber(value?: number) {
    if (value == null || !Number.isFinite(value)) return null;
    return Math.round(value * 1000) / 1000;
}

function serializeBasicData(data?: Partial<BasicInfoData>) {
    return JSON.stringify({
        preferredUnit: data?.preferredUnit ?? null,
        lengthUnit: data?.lengthUnit ?? null,
        weightUnit: data?.weightUnit ?? null,
        sex: data?.sex ?? null,
        birthDate: toDateOnlyString(data?.birthDate) ?? null,
    });
}

function serializeBodyData(data?: Partial<BodyInfoData>) {
    return JSON.stringify({
        height: roundNumber(data?.height),
        heightUnit: data?.heightUnit ?? null,
        weight: roundNumber(data?.weight),
        weightUnit: data?.weightUnit ?? null,
        bodyFatPercentage: roundNumber(data?.bodyFatPercentage),
        leanTissuePercentage: roundNumber(data?.leanTissuePercentage),
        waterPercentage: roundNumber(data?.waterPercentage),
        boneMassPercentage: roundNumber(data?.boneMassPercentage),
    });
}

function serializeLifestyleData(data?: Partial<LifestyleData>) {
    return JSON.stringify({
        activityLevelId: data?.activityLevel?.id ?? null,
    });
}

function serializeObjectiveData(data?: Partial<ObjectiveData>) {
    return JSON.stringify({
        goalWeight: roundNumber(data?.goalWeight),
        goalWeightUnit: data?.goalWeightUnit ?? null,
        targetDate: toDateOnlyString(data?.targetDate) ?? null,
        dailyCalorieTarget: data?.dailyCalorieTarget ?? null,
        goalSteps: data?.goalSteps ?? null,
        goalBedtime: toTimeString(data?.goalBedtime) ?? null,
        goalWakeUpTime: toTimeString(data?.goalWakeUpTime) ?? null,
        dailyProteinGoalGrams: data?.dailyProteinGoalGrams ?? null,
        dailyFatGoalGrams: data?.dailyFatGoalGrams ?? null,
        dailyCarbsGoalGrams: data?.dailyCarbsGoalGrams ?? null,
    });
}

function getLengthUnitName(name?: string | null): LengthUnitName {
    return name === "ft" ? "ft" : "cm";
}

function getWeightUnitName(name?: string | null): WeightUnitName {
    if (name === "lbs" || name === "st") return name;
    return "kg";
}

function findActivityLevelForFactor(activityLevels: ActivityLevel[], factor?: number | null) {
    if (!activityLevels.length) return undefined;
    if (!Number.isFinite(factor)) return activityLevels[0];
    const targetFactor = Number(factor);

    const exact = activityLevels.find((level) => targetFactor >= level.minFactor && targetFactor <= level.maxFactor);
    if (exact) return exact;

    return [...activityLevels]
        .sort((a, b) => {
            const aMid = (a.minFactor + a.maxFactor) / 2;
            const bMid = (b.minFactor + b.maxFactor) / 2;
            return Math.abs(aMid - targetFactor) - Math.abs(bMid - targetFactor);
        })[0];
}

function SectionFooter({
    detail,
    isSaving,
    isDisabled,
    onPress,
}: {
    detail: string;
    isSaving: boolean;
    isDisabled: boolean;
    onPress: () => void;
}) {
    return (
        <Card.Footer className="flex-row items-center justify-between gap-4">
            <Text className="flex-1 text-sm text-muted">{detail}</Text>
            <Button variant="primary" size="sm" onPress={onPress} isDisabled={isDisabled}>
                <Button.Label>{isSaving ? "Saving..." : "Save"}</Button.Label>
            </Button>
        </Card.Footer>
    );
}

export default function UserSettingsScreen({ navigation }: Props) {
    const {
        userProfile,
        userGoals,
        latestWeight,
        latestHeight,
        activityLevels,
        lengthUnits,
        weightUnits,
        updateProfile,
        updateGoals,
        logWeight,
        logHeight,
    } = useUserStore();

    const defaultLengthUnit = useMemo<LengthUnitName>(() => {
        const unitName = lengthUnits.find((unit) => unit.id === userProfile?.defaultLengthUnitId)?.name;
        return getLengthUnitName(unitName);
    }, [lengthUnits, userProfile?.defaultLengthUnitId]);

    const defaultWeightUnit = useMemo<WeightUnitName>(() => {
        const unitName = weightUnits.find((unit) => unit.id === userProfile?.defaultWeightUnitId)?.name;
        return getWeightUnitName(unitName);
    }, [weightUnits, userProfile?.defaultWeightUnitId]);

    const persistedBasic = useMemo<Partial<BasicInfoData>>(() => ({
        birthDate: parseDateOnly(userProfile?.dateOfBirth),
        sex: normalizeSexFromProfile(userProfile?.sex),
        lengthUnit: defaultLengthUnit,
        weightUnit: defaultWeightUnit,
        preferredUnit: getPreferredUnit(defaultLengthUnit, defaultWeightUnit),
    }), [defaultLengthUnit, defaultWeightUnit, userProfile?.dateOfBirth, userProfile?.sex]);

    const persistedBody = useMemo<Partial<BodyInfoData>>(() => ({
        height: convertCmToHeight(latestHeight?.heightCm, defaultLengthUnit),
        heightUnit: defaultLengthUnit,
        weight: convertGramsToWeight(latestWeight?.weightGrams, defaultWeightUnit),
        weightUnit: defaultWeightUnit,
        bodyFatPercentage: latestWeight?.bodyFatPercentage ?? undefined,
        leanTissuePercentage: latestWeight?.leanTissuePercentage ?? undefined,
        waterPercentage: latestWeight?.waterPercentage ?? undefined,
        boneMassPercentage: latestWeight?.boneMassPercentage ?? undefined,
    }), [
        defaultLengthUnit,
        defaultWeightUnit,
        latestHeight?.heightCm,
        latestWeight?.bodyFatPercentage,
        latestWeight?.boneMassPercentage,
        latestWeight?.leanTissuePercentage,
        latestWeight?.waterPercentage,
        latestWeight?.weightGrams,
    ]);

    const persistedLifestyle = useMemo<Partial<LifestyleData>>(() => ({
        activityLevel: findActivityLevelForFactor(activityLevels, userProfile?.currentActivityFactor),
    }), [activityLevels, userProfile?.currentActivityFactor]);

    const persistedObjectives = useMemo<Partial<ObjectiveData>>(() => ({
        goalWeight: convertGramsToWeight(userGoals?.targetWeightGrams, defaultWeightUnit),
        goalWeightUnit: defaultWeightUnit,
        targetDate: parseDateOnly(userGoals?.targetWeightDate),
        dailyCalorieTarget: userProfile?.currentBmrCalories ?? undefined,
        goalSteps: userGoals?.dailyStepsGoal ?? undefined,
        goalBedtime: timeToDate(userGoals?.bedtimeGoal ?? ""),
        goalWakeUpTime: timeToDate(userGoals?.wakeupGoal ?? ""),
        dailyProteinGoalGrams: userGoals?.dailyProteinGoalGrams ?? undefined,
        dailyFatGoalGrams: userGoals?.dailyFatGoalGrams ?? undefined,
        dailyCarbsGoalGrams: userGoals?.dailyCarbsGoalGrams ?? undefined,
    }), [
        defaultWeightUnit,
        userGoals?.bedtimeGoal,
        userGoals?.dailyCarbsGoalGrams,
        userGoals?.dailyFatGoalGrams,
        userGoals?.dailyProteinGoalGrams,
        userGoals?.dailyStepsGoal,
        userGoals?.targetWeightDate,
        userGoals?.targetWeightGrams,
        userGoals?.wakeupGoal,
        userProfile?.currentBmrCalories,
    ]);

    const persistedBasicKey = useMemo(() => serializeBasicData(persistedBasic), [persistedBasic]);
    const persistedBodyKey = useMemo(() => serializeBodyData(persistedBody), [persistedBody]);
    const persistedLifestyleKey = useMemo(() => serializeLifestyleData(persistedLifestyle), [persistedLifestyle]);
    const persistedObjectivesKey = useMemo(() => serializeObjectiveData(persistedObjectives), [persistedObjectives]);

    const [basicDraft, setBasicDraft] = useState<Partial<BasicInfoData>>(persistedBasic);
    const [bodyDraft, setBodyDraft] = useState<Partial<BodyInfoData>>(persistedBody);
    const [lifestyleDraft, setLifestyleDraft] = useState<Partial<LifestyleData>>(persistedLifestyle);
    const [objectivesDraft, setObjectivesDraft] = useState<Partial<ObjectiveData>>(persistedObjectives);

    const [basicVersion, setBasicVersion] = useState(0);
    const [bodyVersion, setBodyVersion] = useState(0);
    const [lifestyleVersion, setLifestyleVersion] = useState(0);
    const [objectivesVersion, setObjectivesVersion] = useState(0);

    const [basicCanSave, setBasicCanSave] = useState(false);
    const [bodyCanSave, setBodyCanSave] = useState(false);
    const [lifestyleCanSave, setLifestyleCanSave] = useState(false);
    const [objectivesCanSave, setObjectivesCanSave] = useState(false);

    const [basicOnSave, setBasicOnSave] = useState<SaveAction>(null);
    const [bodyOnSave, setBodyOnSave] = useState<SaveAction>(null);
    const [lifestyleOnSave, setLifestyleOnSave] = useState<SaveAction>(null);
    const [objectivesOnSave, setObjectivesOnSave] = useState<SaveAction>(null);

    const [saving, setSaving] = useState<Record<SectionKey, boolean>>({
        basic: false,
        body: false,
        lifestyle: false,
        objectives: false,
    });

    const registerBasicSave = useCallback((handler: SaveAction) => {
        setBasicOnSave(() => handler);
    }, []);

    const registerBodySave = useCallback((handler: SaveAction) => {
        setBodyOnSave(() => handler);
    }, []);

    const registerLifestyleSave = useCallback((handler: SaveAction) => {
        setLifestyleOnSave(() => handler);
    }, []);

    const registerObjectivesSave = useCallback((handler: SaveAction) => {
        setObjectivesOnSave(() => handler);
    }, []);

    useEffect(() => {
        setBasicDraft(persistedBasic);
        setBasicVersion((value) => value + 1);
    }, [persistedBasicKey]);

    useEffect(() => {
        setBodyDraft(persistedBody);
        setBodyVersion((value) => value + 1);
    }, [persistedBodyKey]);

    useEffect(() => {
        setLifestyleDraft(persistedLifestyle);
        setLifestyleVersion((value) => value + 1);
    }, [persistedLifestyleKey]);

    useEffect(() => {
        setObjectivesDraft(persistedObjectives);
        setObjectivesVersion((value) => value + 1);
    }, [persistedObjectivesKey]);

    const basicDirty = persistedBasicKey !== serializeBasicData(basicDraft);
    const bodyDirty = persistedBodyKey !== serializeBodyData(bodyDraft);
    const lifestyleDirty = persistedLifestyleKey !== serializeLifestyleData(lifestyleDraft);
    const objectivesDirty = persistedObjectivesKey !== serializeObjectiveData(objectivesDraft);

    const blockingDirtyState = basicDirty || bodyDirty || lifestyleDirty;
    const bodyIsMissingLatestHeight = latestHeight == null;

    const setSectionSaving = useCallback((section: SectionKey, isSaving: boolean) => {
        setSaving((current) => ({ ...current, [section]: isSaving }));
    }, []);

    const handleBasicSave = useCallback(async (data: BasicInfoData) => {
        setSectionSaving("basic", true);

        try {
            await updateProfile({
                dateOfBirth: toDateOnlyString(data.birthDate) ?? null,
                sex: normalizeSexToProfile(data.sex),
                defaultWeightUnitId: weightUnits.find((unit) => unit.name === data.weightUnit)?.id ?? null,
                defaultLengthUnitId: lengthUnits.find((unit) => unit.name === data.lengthUnit)?.id ?? null,
            });

            toast.show({
                variant: "default",
                label: "Basic info updated",
                description: "Your profile defaults were saved.",
            });
        } catch (error) {
            toast.show({
                variant: "warning",
                label: "Unable to save basic info",
                description: toErrorMessage(error),
            });
        } finally {
            setSectionSaving("basic", false);
        }
    }, [lengthUnits, setSectionSaving, updateProfile, weightUnits]);

    const handleBodySave = useCallback(async (data: BodyInfoData) => {
        const weightGrams = convertWeightToGrams(data.weight, data.weightUnit);
        const heightCm = convertHeightToCm(data.height, data.heightUnit);

        if (!weightGrams || !heightCm) {
            toast.show({
                variant: "warning",
                label: "Unable to save body metrics",
                description: "Height and weight are required.",
            });
            return;
        }

        setSectionSaving("body", true);

        try {
            const measuredAt = new Date().toISOString();
            await Promise.all([
                logWeight({
                    measuredAt,
                    weightGrams,
                    bodyFatPercentage: data.bodyFatPercentage ?? null,
                    leanTissuePercentage: data.leanTissuePercentage ?? null,
                    waterPercentage: data.waterPercentage ?? null,
                    boneMassPercentage: data.boneMassPercentage ?? null,
                }),
                logHeight({
                    measuredAt,
                    heightCm,
                }),
            ]);

            toast.show({
                variant: "default",
                label: "Body metrics updated",
                description: "Latest measurements were saved.",
            });
        } catch (error) {
            toast.show({
                variant: "warning",
                label: "Unable to save body metrics",
                description: toErrorMessage(error),
            });
        } finally {
            setSectionSaving("body", false);
        }
    }, [logHeight, logWeight, setSectionSaving]);

    const handleLifestyleSave = useCallback(async (data: LifestyleData) => {
        setSectionSaving("lifestyle", true);

        try {
            const activityFactor = (Number(data.activityLevel.minFactor) + Number(data.activityLevel.maxFactor)) / 2;
            await updateProfile({
                currentActivityFactor: activityFactor,
            });

            toast.show({
                variant: "default",
                label: "Activity updated",
                description: "Your activity factor was saved.",
            });
        } catch (error) {
            toast.show({
                variant: "warning",
                label: "Unable to save activity",
                description: toErrorMessage(error),
            });
        } finally {
            setSectionSaving("lifestyle", false);
        }
    }, [setSectionSaving, updateProfile]);

    const handleObjectivesSave = useCallback(async (data: ObjectiveData) => {
        setSectionSaving("objectives", true);

        try {
            await Promise.all([
                updateGoals({
                    dailyStepsGoal: data.goalSteps ?? null,
                    bedtimeGoal: toTimeString(data.goalBedtime) ?? null,
                    wakeupGoal: toTimeString(data.goalWakeUpTime) ?? null,
                    dailyProteinGoalGrams: data.dailyProteinGoalGrams ?? null,
                    dailyFatGoalGrams: data.dailyFatGoalGrams ?? null,
                    dailyCarbsGoalGrams: data.dailyCarbsGoalGrams ?? null,
                    targetWeightGrams: convertWeightToGrams(data.goalWeight, data.goalWeightUnit) ?? null,
                    targetWeightDate: toDateOnlyString(data.targetDate) ?? null,
                }),
                updateProfile({
                    currentBmrCalories: data.dailyCalorieTarget ?? null,
                }),
            ]);

            toast.show({
                variant: "default",
                label: "Goals updated",
                description: "Your daily calorie target and goal settings were saved.",
            });
        } catch (error) {
            toast.show({
                variant: "warning",
                label: "Unable to save goals",
                description: toErrorMessage(error),
            });
        } finally {
            setSectionSaving("objectives", false);
        }
    }, [setSectionSaving, updateGoals, updateProfile]);
    const foregroundColor = useThemeColor('foreground')
    return (
        <MainLayout>
            <H2 className="text-3xl">Profile & goals</H2>
            <Text className="mt-1 text-muted">
                Update the same profile inputs that power your calorie target, macros, and health defaults.
            </Text>

            <Card variant="transparent" className="gap-4">
                <Card.Header>
                    <Card.Title>Basic info</Card.Title>
                    <Card.Description>Birth date, sex, and your default measurement units.</Card.Description>
                </Card.Header>
                <Card.Body className="gap-4">
                    <BasicInfo
                        key={`basic-${basicVersion}`}
                        initialData={persistedBasic}
                        onSubmit={handleBasicSave}
                        onDraftChange={setBasicDraft}
                        setNextEnabled={setBasicCanSave}
                        registerOnNext={registerBasicSave}
                    />
                </Card.Body>
                <SectionFooter
                    detail="Changing units here will also remap the body and goal forms."
                    isSaving={saving.basic}
                    isDisabled={!basicDirty || !basicCanSave || saving.basic}
                    onPress={() => basicOnSave?.()}
                />
            </Card>

            <Card variant="transparent" className="gap-4">
                <Card.Header>
                    <Card.Title>Body measurements</Card.Title>
                    <Card.Description>
                        Latest weight, height, and optional body-composition fields.
                    </Card.Description>
                </Card.Header>
                <Card.Body className="gap-4">
                    <BodyInfo
                        key={`body-${bodyVersion}`}
                        initialData={persistedBody}
                        onSubmit={handleBodySave}
                        onDraftChange={setBodyDraft}
                        setNextEnabled={setBodyCanSave}
                        registerOnNext={registerBodySave}
                        defaultHeightUnit={basicDraft.lengthUnit ?? defaultLengthUnit}
                        defaultWeightUnit={basicDraft.weightUnit ?? defaultWeightUnit}
                        scrollable={false}
                    />
                </Card.Body>
                <SectionFooter
                    detail={bodyIsMissingLatestHeight
                        ? "Height starts blank when no latest height is available yet. Saving here will populate it."
                        : "Saving creates a new latest measurement entry for both weight and height."}
                    isSaving={saving.body}
                    isDisabled={!bodyDirty || !bodyCanSave || saving.body}
                    onPress={() => bodyOnSave?.()}
                />
            </Card>

            <Card variant="transparent" className="gap-4">
                <Card.Header>
                    <Card.Title>Activity</Card.Title>
                    <Card.Description>Used to estimate TDEE from your current body data.</Card.Description>
                </Card.Header>
                <Card.Body className="gap-4">
                    <LifestyleInfo
                        key={`lifestyle-${lifestyleVersion}`}
                        initialData={persistedLifestyle}
                        onSubmit={handleLifestyleSave}
                        onDraftChange={setLifestyleDraft}
                        setNextEnabled={setLifestyleCanSave}
                        registerOnNext={registerLifestyleSave}
                    />
                </Card.Body>
                <SectionFooter
                    detail="Activity changes feed the live calorie calculation in the goals section."
                    isSaving={saving.lifestyle}
                    isDisabled={!lifestyleDirty || !lifestyleCanSave || saving.lifestyle}
                    onPress={() => lifestyleOnSave?.()}
                />
            </Card>

            <Card variant="transparent" className="gap-4">
                <Card.Header>
                    <Card.Title>Objectives</Card.Title>
                    <Card.Description>Goal weight, macros, steps, and sleep timing targets.</Card.Description>
                </Card.Header>
                <Card.Body className="gap-4">
                    <Objectives
                        key={`objectives-${objectivesVersion}`}
                        initialData={persistedObjectives}
                        onSubmit={handleObjectivesSave}
                        onDraftChange={setObjectivesDraft}
                        setNextEnabled={setObjectivesCanSave}
                        registerOnNext={registerObjectivesSave}
                        basicInfoData={basicDraft}
                        bodyInfoData={bodyDraft}
                        lifeStyleData={lifestyleDraft}
                        scrollable={false}
                    />
                </Card.Body>
                <SectionFooter
                    detail={blockingDirtyState
                        ? "Save basic info, body, and activity changes first so the calorie target stays in sync."
                        : "This section recalculates your daily calorie target from the current profile inputs."}
                    isSaving={saving.objectives}
                    isDisabled={!objectivesDirty || !objectivesCanSave || blockingDirtyState || saving.objectives}
                    onPress={() => objectivesOnSave?.()}
                />
            </Card>
        </MainLayout>
    );
}
