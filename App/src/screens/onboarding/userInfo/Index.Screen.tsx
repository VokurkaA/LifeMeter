import { KeyboardAvoidingView, View } from 'react-native';
import { H1 } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { BasicInfo, BasicInfoData } from '@/screens/onboarding/userInfo/BasicInfo';
import { BodyStats, BodyStatsData } from '@/screens/onboarding/userInfo/BodyStats';
import { Lifestyle, LifestyleData } from '@/screens/onboarding/userInfo/Lifestyle';
import { Objective, ObjectiveData } from '@/screens/onboarding/userInfo/Objective';
import { useState } from 'react';
import { userProfileService } from '@/services/user.profile.service';
import { useStore } from '@/contexts/useStore';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/components/ui/Toast';
import { Time } from '@/lib/Time';

export function PreferencesScreen() {
  const { toast } = useToast();
  const { refreshSession } = useAuth();

  const { activityLevels, weightUnits, lengthUnits } = useStore();

  const [basicInfo, setBasicInfo] = useState<BasicInfoData>();
  const [bodyStats, setBodyStats] = useState<BodyStatsData>();
  const [lifestyle, setLifestyle] = useState<LifestyleData>();
  const [objective, setObjective] = useState<ObjectiveData>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeStep, setActiveStep] = useState(0);

  const handleFinish = async () => {
    if (!basicInfo || !bodyStats || !lifestyle || !objective) return;
    setIsSubmitting(true);

    try {
      const selectedActivity = activityLevels.find((l) => l.id === lifestyle.activityLevelId);
      const rawActivityFactor = selectedActivity ? selectedActivity.minFactor : 1.2;
      const activityFactor =
        typeof rawActivityFactor === 'string'
          ? parseFloat(rawActivityFactor)
          : rawActivityFactor;

      const preferredWeightUnitObj =
        weightUnits.find((u) =>
          u.name.toLowerCase().includes(basicInfo.preferredWeightUnit?.toLowerCase() || ''),
        ) || weightUnits[0];

      const preferredLengthUnitObj =
        lengthUnits.find((u) =>
          u.name.toLowerCase().includes(basicInfo.preferredLengthUnit?.toLowerCase() || ''),
        ) || lengthUnits[0];

      const inputWeightUnitObj = weightUnits.find((u) =>
        u.name.toLowerCase().includes(bodyStats.weightUnit.toLowerCase()),
      );
      const inputLengthUnitObj = lengthUnits.find((u) =>
        u.name.toLowerCase().includes(bodyStats.heightUnit.toLowerCase()),
      );

      const weightFactor = Number(inputWeightUnitObj?.kgConversionFactor) || 1;
      const lengthFactor = Number(inputLengthUnitObj?.meterConversionFactor) || 1;

      const weightGrams = bodyStats.weight * weightFactor * 1000;
      const heightCm = bodyStats.height * lengthFactor * 100;

      const targetWeightGrams =
        Number(objective.goalWeight) *
        (Number(preferredWeightUnitObj.kgConversionFactor) || 1) *
        1000;

      if (!Number.isFinite(targetWeightGrams) || targetWeightGrams <= 0) {
        console.log('Invalid targetWeightGrams debug', {
          goalWeight: objective.goalWeight,
          kgConversionFactor: preferredWeightUnitObj.kgConversionFactor,
        });
        toast('Invalid target weight', 'destructive');
        setIsSubmitting(false);
        return;
      }

      const timeToBackend = (time: string | null) => {
        if (!time) return null;
        const [hours, minutes] = time.split(':').map(Number);
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        const t = Time.from(d);
        return t.isValid() ? t.format('HH:mm:ss') : null;
      };

      const bedtimeGoal = timeToBackend(objective.goalBedtime);
      const wakeUpGoal = timeToBackend(objective.goalWakeUpTime);

      console.log('updateProfile payload', {
        dateOfBirth: basicInfo.birthDateIso,
        sex: basicInfo.sex === 'male' ? 'M' : 'F',
        currentActivityFactor: activityFactor,
        currentBmrCalories: objective.calculatedBmr,
        defaultWeightUnitId: preferredWeightUnitObj?.id,
        defaultLengthUnitId: preferredLengthUnitObj?.id,
      });

      console.log('updateGoals payload', {
        targetWeightGrams: Math.round(targetWeightGrams),
        targetWeightDate: Time.format(objective.targetDate, 'YYYY-MM-DD'),
        dailyStepsGoal: objective.goalSteps,
        dailyProteinGoalGrams: objective.dailyProteinGoalGrams,
        dailyCarbsGoalGrams: objective.dailyCarbsGoalGrams,
        dailyFatGoalGrams: objective.dailyFatGoalGrams,
        bedtimeGoal,
        wakeupGoal: wakeUpGoal,
      });

      await userProfileService.updateProfile({
        dateOfBirth: basicInfo.birthDateIso,
        sex: basicInfo.sex === 'male' ? 'M' : 'F',
        currentActivityFactor: activityFactor,
        currentBmrCalories: objective.calculatedBmr,
        defaultWeightUnitId: preferredWeightUnitObj?.id,
        defaultLengthUnitId: preferredLengthUnitObj?.id,
      });

      await userProfileService.updateGoals({
        targetWeightGrams: Math.round(targetWeightGrams),
        targetWeightDate: objective.targetDate,
        dailyStepsGoal: objective.goalSteps,
        dailyProteinGoalGrams: objective.dailyProteinGoalGrams,
        dailyCarbsGoalGrams: objective.dailyCarbsGoalGrams,
        dailyFatGoalGrams: objective.dailyFatGoalGrams,
        bedtimeGoal: bedtimeGoal,
        wakeupGoal: wakeUpGoal,
      });

      const now = new Date().toISOString();
      await userProfileService.logHeight({
        heightCm: Math.round(heightCm),
        measuredAt: now,
      });

      await userProfileService.logWeight({
        weightGrams: Math.round(weightGrams),
        measuredAt: now,
        bodyFatPercentage: bodyStats.bodyFatPercentage ?? null,
        leanTissuePercentage: bodyStats.leanTissuePercentage ?? null,
        waterPercentage: bodyStats.waterPercentage ?? null,
        boneMassPercentage: bodyStats.boneMassPercentage ?? null,
      });

      await refreshSession();
    } catch (error) {
      console.error('Onboarding submission failed', error);
      toast('Failed to save profile. Please try again.', 'destructive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    <BasicInfo
      onSubmit={(data) => {
        setBasicInfo(data);
        setActiveStep(1);
      }}
      key={0}
    />,
    <BodyStats
      units={{
        lengthUnit: basicInfo?.preferredLengthUnit,
        weightUnit: basicInfo?.preferredWeightUnit,
      }}
      onSubmit={(data) => {
        setBodyStats(data);
        setActiveStep(2);
      }}
      key={1}
    />,
    <Lifestyle
      onSubmit={(data) => {
        setLifestyle(data);
        setActiveStep(3);
      }}
      key={2}
    />,
    <Objective
      units={{ weightUnit: basicInfo?.preferredWeightUnit }}
      onSubmit={(data) => {
        setObjective(data);
        setActiveStep(4);
      }}
      userSex={basicInfo?.sex}
      userBirthDate={basicInfo?.birthDateIso}
      userBodyStats={bodyStats}
      userActivityLevelId={lifestyle?.activityLevelId}
      key={3}
    />,
    <View key={4} className="items-center justify-center flex-1">
      <H1 className="mb-4">That&#39;s it!</H1>
      <Button
        className="w-full mt-auto"
        label={isSubmitting ? 'Setting up...' : 'Finish'}
        variant="default"
        disabled={isSubmitting}
        onPress={() => handleFinish()}
      />
    </View>,
  ];

  return (
    <View className="flex-1 p-8 bg-background">
      <H1 className="my-8 text-center">Preferences</H1>

      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-1 mt-16">{steps[activeStep]}</View>
      </KeyboardAvoidingView>
    </View>
  );
}
