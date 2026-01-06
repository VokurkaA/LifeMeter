import { View } from 'react-native';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BodyStatsData } from '@/screens/onboarding/userInfo/BodyStats';
import { useStore } from '@/contexts/useStore';
import { calculateAge } from '@/lib/utils';
import { mifflinStJeor } from '@/lib/bmr';
import { Time } from '@/lib/Time';
import { Text } from '@/components/ui/Text';
import Slider from '@react-native-community/slider';

export interface ObjectiveData {
  goalWeight: number;
  calculatedBmr: number;
  targetDate: string;
  goalSteps: number;
  goalBedtime: string | null;
  goalWakeUpTime: string | null;
  dailyProteinGoalGrams: number;
  dailyCarbsGoalGrams: number;
  dailyFatGoalGrams: number;
}

interface BodyStatsProps {
  onSubmit: (data: ObjectiveData) => void;
  units: { weightUnit: 'kg' | 'lbs' | undefined };
  userSex: 'male' | 'female' | undefined;
  userBirthDate: string | undefined;
  userBodyStats: BodyStatsData | undefined;
  userActivityLevelId: number | undefined;
}

export function Objective({
  onSubmit,
  units,
  userSex,
  userBirthDate,
  userBodyStats,
  userActivityLevelId,
}: BodyStatsProps) {
  const { toast } = useToast();
  const { activityLevels, weightUnits, lengthUnits } = useStore();
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(units.weightUnit || 'kg');
  const [goalWeightBy, setGoalWeightBy] = useState<string | undefined>();
  const [goalSteps, setGoalSteps] = useState<number>(10000);
  const [goalBedtime, setGoalBedtime] = useState<string>('');
  const [goalWakeUpTime, setGoalWakeUpTime] = useState<string>('');

  // Macro sliders (percent of calories). They always sum to ~100%.
  const [proteinPct, setProteinPct] = useState(30);
  const [carbsPct, setCarbsPct] = useState(40);
  const [fatPct, setFatPct] = useState(30);

  const rebalanceMacros = (changed: 'protein' | 'carbs' | 'fat', newValue: number) => {
    let p = proteinPct;
    let c = carbsPct;
    let f = fatPct;

    if (changed === 'protein') p = newValue;
    if (changed === 'carbs') c = newValue;
    if (changed === 'fat') f = newValue;

    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
    p = clamp(p);
    c = clamp(c);
    f = clamp(f);

    const main = changed === 'protein' ? p : changed === 'carbs' ? c : f;
    const remaining = 100 - main;

    const others =
      changed === 'protein'
        ? { aKey: 'carbs', aVal: c, bKey: 'fat', bVal: f }
        : changed === 'carbs'
        ? { aKey: 'protein', aVal: p, bKey: 'fat', bVal: f }
        : { aKey: 'protein', aVal: p, bKey: 'carbs', bVal: c };

    const otherSum = others.aVal + others.bVal;

    let aNew = 0;
    let bNew = 0;

    if (remaining <= 0) {
      aNew = 0;
      bNew = 0;
    } else if (otherSum <= 0) {
      aNew = Math.floor(remaining / 2);
      bNew = remaining - aNew;
    } else {
      const scale = remaining / otherSum;
      aNew = clamp(others.aVal * scale);
      bNew = clamp(remaining - aNew);
    }

    if (changed === 'protein') {
      setProteinPct(p);
      setCarbsPct(aNew);
      setFatPct(bNew);
    } else if (changed === 'carbs') {
      setCarbsPct(c);
      setProteinPct(aNew);
      setFatPct(bNew);
    } else {
      setFatPct(f);
      setProteinPct(aNew);
      setCarbsPct(bNew);
    }
  };

  const baseMetabolicRate = (
    sex: 'male' | 'female',
    bodyStats: BodyStatsData,
    birthDate: string,
    weightUnits: { name: string; kgConversionFactor: number }[],
    lengthUnits: { name: string; meterConversionFactor: number }[],
  ) => {
    const age = calculateAge(birthDate);

    const weightUnitEntry = weightUnits.find(
      (u) => u.name.toLowerCase() === bodyStats.weightUnit.toLowerCase(),
    );
    const heightUnitEntry = lengthUnits.find(
      (u) => u.name.toLowerCase() === bodyStats.heightUnit.toLowerCase(),
    );

    const weightFactor = weightUnitEntry?.kgConversionFactor || 1;
    const heightFactor = heightUnitEntry?.meterConversionFactor || 1;

    const weightKg = bodyStats.weight * weightFactor;
    const heightCm = bodyStats.height * heightFactor * 100;

    return Math.round(mifflinStJeor(sex, weightKg, heightCm, age));
  };

  // Compute total daily calories for macros, taking weight goal into account if possible.
  const computeTotalCaloriesForMacros = (bmr: number): number => {
    // 1) Activity factor → maintenance calories
    const activityLevel = activityLevels.find((l) => l.id === userActivityLevelId);
    const rawActivityFactor = activityLevel ? activityLevel.minFactor : 1.2;
    let activityFactor =
      typeof rawActivityFactor === 'string' ? parseFloat(rawActivityFactor) : rawActivityFactor;
    if (!Number.isFinite(activityFactor) || activityFactor <= 0) activityFactor = 1.2;

    let maintenanceCalories = Math.round(bmr * activityFactor);
    if (!Number.isFinite(maintenanceCalories) || maintenanceCalories <= 0) {
      maintenanceCalories = bmr;
    }

    // If we can't safely use the goal (missing weight/date/body stats), just use maintenance.
    if (!goalWeight || !goalWeightBy || !userBodyStats) {
      return maintenanceCalories;
    }

    // 2) Parse target date (DD/MM/YYYY)
    const parts = goalWeightBy.split('/');
    if (parts.length !== 3) return maintenanceCalories;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const targetDate = new Date(year, month - 1, day);
    if (
      !Number.isFinite(targetDate.getTime()) ||
      targetDate.getFullYear() !== year ||
      targetDate.getMonth() !== month - 1 ||
      targetDate.getDate() !== day
    ) {
      return maintenanceCalories;
    }

    const today = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.round((targetDate.getTime() - today.getTime()) / msPerDay);
    if (!Number.isFinite(days) || days <= 0) return maintenanceCalories;

    // 3) Current vs target weight in kg
    const currentUnitEntry = weightUnits.find(
      (u) => u.name.toLowerCase() === userBodyStats.weightUnit.toLowerCase(),
    );
    const currentKg = userBodyStats.weight * (currentUnitEntry?.kgConversionFactor || 1);

    const goalUnitEntry = weightUnits.find((u) =>
      u.name.toLowerCase().includes(weightUnit.toLowerCase()),
    );
    const goalKg =
      goalWeight *
      (goalUnitEntry?.kgConversionFactor ||
        (weightUnit === 'lbs' ? 0.45359237 : 1 /* default assume kg */));

    const weightDiffKg = goalKg - currentKg;
    if (!Number.isFinite(weightDiffKg) || Math.abs(weightDiffKg) < 0.1) {
      // essentially a maintenance goal
      return maintenanceCalories;
    }

    // 4) Convert weight change to daily calorie delta
    const KCAL_PER_KG = 7700;
    const totalDelta = weightDiffKg * KCAL_PER_KG; // + for gain, - for loss
    const dailyDelta = totalDelta / days;

    let targetCalories = maintenanceCalories + dailyDelta;

    // 5) Simple safety clamp (optional)
    const minCalories = maintenanceCalories * 0.6;
    const maxCalories = maintenanceCalories * 1.6;
    if (targetCalories < minCalories) targetCalories = minCalories;
    if (targetCalories > maxCalories) targetCalories = maxCalories;

    return Math.round(targetCalories);
  };

  const validateAndSubmit = () => {
    if (!goalWeight) {
      toast('Please enter a goal weight', 'destructive', 1000, 'top', false, 'narrow');
      return;
    }

    if (!goalWeightBy) {
      toast('Please enter a target date', 'destructive', 1000, 'top', false, 'narrow');
      return;
    }

    const parts = goalWeightBy.split('/');
    let validDateIso = '';
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const dateObj = new Date(year, month - 1, day);
      const timeInstance = Time.from(dateObj);

      if (timeInstance.isValid() && dateObj.getFullYear() === year) {
        validDateIso = timeInstance.toISOString();
      }
    }

    if (!validDateIso) {
      toast('Invalid date format (DD/MM/YYYY)', 'destructive', 1000, 'top', false, 'narrow');
      return;
    }

    if (!goalSteps || goalSteps <= 0) {
      toast('Please enter a valid daily steps goal', 'destructive', 1000, 'top', false, 'narrow');
      return;
    }

    // Validate bedtime and wakeup time (optional, but if present, must be in HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    let bedtimeStr: string | null = null;
    let wakeupStr: string | null = null;

    const normalizeTime = (value: string): string | null => {
      const trimmed = value.trim();
      if (!timeRegex.test(trimmed)) return null;

      const [h, m] = trimmed.split(':').map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

      const d = new Date();
      d.setHours(h, m, 0, 0);
      const t = Time.from(d);
      if (!t.isValid()) return null;

      // Canonical 24h "HH:mm"
      return t.format('HH:mm');
    };

    if (goalBedtime.trim().length > 0) {
      const normalized = normalizeTime(goalBedtime);
      if (!normalized) {
        toast('Bedtime must be in HH:MM format', 'destructive', 1000, 'top', false, 'narrow');
        return;
      }
      bedtimeStr = normalized;
    }

    if (goalWakeUpTime.trim().length > 0) {
      const normalized = normalizeTime(goalWakeUpTime);
      if (!normalized) {
        toast('Wakeup time must be in HH:MM format', 'destructive', 1000, 'top', false, 'narrow');
        return;
      }
      wakeupStr = normalized;
    }

    const bmr = baseMetabolicRate(userSex!, userBodyStats!, userBirthDate!, weightUnits, lengthUnits);

    const totalCaloriesForMacros = computeTotalCaloriesForMacros(bmr);

    const pctSum = proteinPct + carbsPct + fatPct || 1;
    const proteinShare = proteinPct / pctSum;
    const carbsShare = carbsPct / pctSum;
    const fatShare = fatPct / pctSum;

    const dailyProteinGoalGrams = Math.round((totalCaloriesForMacros * proteinShare) / 4);
    const dailyCarbsGoalGrams = Math.round((totalCaloriesForMacros * carbsShare) / 4);
    const dailyFatGoalGrams = Math.round((totalCaloriesForMacros * fatShare) / 9);

    onSubmit({
      goalWeight: goalWeight,
      calculatedBmr: bmr,
      targetDate: validDateIso,
      goalSteps: goalSteps,
      goalBedtime: bedtimeStr,
      goalWakeUpTime: wakeupStr,
      dailyProteinGoalGrams,
      dailyCarbsGoalGrams,
      dailyFatGoalGrams,
    });
  };

  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${formatted.slice(0, 5)}/${cleaned.slice(4, 8)}`;
    }
    setGoalWeightBy(formatted);
  };

  // Live preview: calories and grams from current sliders
  let previewTotalCalories: number | null = null;
  let previewProteinGrams: number | null = null;
  let previewCarbsGrams: number | null = null;
  let previewFatGrams: number | null = null;

  if (userSex && userBodyStats && userBirthDate) {
    const bmrPreview = baseMetabolicRate(
      userSex,
      userBodyStats,
      userBirthDate,
      weightUnits,
      lengthUnits,
    );

    const totalCaloriesForMacros = computeTotalCaloriesForMacros(bmrPreview);

    const pctSum = proteinPct + carbsPct + fatPct || 1;
    const proteinShare = proteinPct / pctSum;
    const carbsShare = carbsPct / pctSum;
    const fatShare = fatPct / pctSum;

    previewTotalCalories = totalCaloriesForMacros;
    previewProteinGrams = Math.round((totalCaloriesForMacros * proteinShare) / 4);
    previewCarbsGrams = Math.round((totalCaloriesForMacros * carbsShare) / 4);
    previewFatGrams = Math.round((totalCaloriesForMacros * fatShare) / 9);
  }

  return (
    <View className="flex gap-4">
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Target weight"
            keyboardType="numeric"
            placeholder="Target weight"
            value={goalWeight !== null ? String(goalWeight) : ''}
            onChangeText={(val) => {
              setGoalWeight(val ? Number(val) : null);
            }}
          />
        </View>
        <Select
          className="min-w-24"
          title="Unit"
          placeholder=""
          variants={[
            { label: 'kg', value: 'kg' },
            { label: 'lbs', value: 'lbs' },
          ]}
          value={weightUnit}
          onChange={(val) => setWeightUnit(val as 'kg' | 'lbs')}
        />
      </View>
      <Input
        label="Goal weight by"
        placeholder="DD/MM/YYYY"
        value={goalWeightBy}
        onChangeText={handleDateChange}
        keyboardType="numeric"
        maxLength={10}
      />
      <Input
        label="Goal daily steps"
        placeholder="10000"
        keyboardType="numeric"
        value={goalSteps ? String(goalSteps) : ''}
        onChangeText={(val) => setGoalSteps(val ? Number(val) : 0)}
      />

      {/* Macro sliders */}
      <View className="gap-3 mt-2">
        <Text className="text-lg font-semibold text-foreground">Daily macronutrient goals</Text>

        <View>
          <Text className="mb-1 text-sm text-foreground">Protein {proteinPct}%</Text>
          <Slider
            minimumValue={5}
            maximumValue={60}
            step={1}
            value={proteinPct}
            onValueChange={(val) => rebalanceMacros('protein', val)}
          />
        </View>

        <View>
          <Text className="mb-1 text-sm text-foreground">Carbs {carbsPct}%</Text>
          <Slider
            minimumValue={5}
            maximumValue={80}
            step={1}
            value={carbsPct}
            onValueChange={(val) => rebalanceMacros('carbs', val)}
          />
        </View>

        <View>
          <Text className="mb-1 text-sm text-foreground">Fat {fatPct}%</Text>
          <Slider
            minimumValue={10}
            maximumValue={50}
            step={1}
            value={fatPct}
            onValueChange={(val) => rebalanceMacros('fat', val)}
          />
        </View>

        {/* Preview numbers */}
        <View className="mt-2">
          <Text className="text-sm text-muted-foreground">
            Total calories for macros:{' '}
            {previewTotalCalories !== null ? `${previewTotalCalories} kcal` : '—'}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Protein:{' '}
            {previewProteinGrams !== null ? `${previewProteinGrams} g` : '—'} · Carbs:{' '}
            {previewCarbsGrams !== null ? `${previewCarbsGrams} g` : '—'} · Fat:{' '}
            {previewFatGrams !== null ? `${previewFatGrams} g` : '—'}
          </Text>
        </View>
      </View>

      <Input
        label="Goal bedtime"
        type="time"
        value={goalBedtime}
        onChangeText={setGoalBedtime}
      />
      <Input
        label="Goal wakeup time"
        type="time"
        value={goalWakeUpTime}
        onChangeText={setGoalWakeUpTime}
      />

      <Button className="mt-auto" label="Next" variant="default" onPress={validateAndSubmit} />
    </View>
  );
}
