import { KeyboardAvoidingView, View } from 'react-native';
import { H1 } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { BasicInfo, BasicInfoData } from '@/screens/onboarding/userInfo/BasicInfo';
import { BodyStats, BodyStatsData } from '@/screens/onboarding/userInfo/BodyStats';
import { Lifestyle, LifestyleData } from '@/screens/onboarding/userInfo/Lifestyle';
import { Objective, ObjectiveData } from '@/screens/onboarding/userInfo/Objective';
import { useState } from 'react';

export function PreferencesScreen() {
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>();
  const [bodyStats, setBodyStats] = useState<BodyStatsData>();
  const [lifestyle, setLifestyle] = useState<LifestyleData>();
  const [objective, setObjective] = useState<ObjectiveData>();

  const [activeStep, setActiveStep] = useState(0);

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
      key={3}
    />,
    <View key={1}>
      <H1>That&#39;s it</H1>
      <Button className="mt-auto" label="Finish" variant="link" />
    </View>,
  ];

  return (
    <View className="flex-1 bg-background p-8">
      <H1 className="my-8 text-center">Preferences</H1>

      <KeyboardAvoidingView>
        <View className="mt-16">{steps[activeStep]}</View>
      </KeyboardAvoidingView>
    </View>
  );
}
