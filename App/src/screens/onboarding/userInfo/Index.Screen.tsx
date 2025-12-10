import { KeyboardAvoidingView, View } from 'react-native';
import { H1 } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/types/types';
import { BasicInfo, BasicInfoData } from '@/screens/onboarding/userInfo/BasicInfo';
import { BodyStats } from '@/screens/onboarding/userInfo/BodyStats';
import { Lifestyle } from '@/screens/onboarding/userInfo/Lifestyle';
import { Objective } from '@/screens/onboarding/userInfo/Objective';
import { useState } from 'react';

export function PreferencesScreen({
  navigation,
}: NativeStackScreenProps<OnboardingStackParamList, 'Preferences'>) {
  const [basicInfo, setBasicInfo] = useState<BasicInfoData | undefined>();
  const [bodyStats, setBodyStats] = useState();
  const [lifestyle, setLifestyle] = useState();
  const [objective, setObjective] = useState();

  const steps = [
    <BasicInfo onSubmit={setBasicInfo} key={0} />,
    <BodyStats onSubmit={setBodyStats} key={1} />,
    <Lifestyle onSubmit={setLifestyle} key={2} />,
    <Objective onSubmit={setObjective} key={3} />,
    <View key={4}>
      <H1>That&#39;s it</H1>
      <Button
        className="mt-auto"
        label="Finish"
        variant="link"
        // onPress={() => navigation.navigate('Home')}
      />
    </View>,
  ];
  const [activeSeep, setActiveStep] = useState(0);
  return (
    <View className="flex-1 bg-background p-8">
      <H1 className="my-8 text-center">Log in</H1>
      <KeyboardAvoidingView>
        <View className="mt-16">{steps[activeSeep]}</View>
      </KeyboardAvoidingView>
    </View>
  );
}
