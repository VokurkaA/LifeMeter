import React, { useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/types/types';
import { H1, H2 } from '@/components/ui/Text';
import { useAuth } from '@/contexts/useAuth';
import { BasicUserInfo, BasicUserInfoData } from '@/screens/onboarding/basicUserInfo';
import { BodyStats, BodyStatsData } from '@/screens/onboarding/bodyStats';

export default function UserPreferencesScreen({
  navigation,
}: NativeStackScreenProps<OnboardingStackParamList, 'Preferences'>) {
  const { user } = useAuth();
  const [basicUserInfo, setBasicUserInfo] = useState<BasicUserInfoData | null>();
  const [bodyStats, setBodyStats] = useState<BodyStatsData | null>()
  return (
    <View className="flex-1 bg-background p-8">
      <H1 className="mt-8 text-center">Hi {user?.name}</H1>
      <H2 className="text-center">Tell us about yourself</H2>

      <BasicUserInfo onSubmit={setBasicUserInfo} />
      <BodyStats units={{basicUserInfo.preferredLengthUnit, basicUserInfo.preferredWeightUnit}} onSubmit={setBodyStats} />
    </View>
  );
}
