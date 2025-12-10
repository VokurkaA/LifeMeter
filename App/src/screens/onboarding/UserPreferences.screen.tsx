import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/types/types';
import { H1, H2 } from '@/components/ui/Text';
import { useAuth } from '@/contexts/useAuth';

import { BasicUserInfo, BasicUserInfoData } from '@/screens/onboarding/basicUserInfo';
import { BodyStats } from '@/screens/onboarding/BodyStats';
import { Lifestyle } from '@/screens/onboarding/Lifestyle';
import { Objective } from '@/screens/onboarding/Objective';

// Define the shape of the aggregated data
type OnboardingData = Partial<BasicUserInfoData> & {
  height?: number;
  weight?: number;
  activityFactor?: number;
  targetWeight?: number;
};

export default function UserPreferencesScreen({
  navigation,
}: NativeStackScreenProps<OnboardingStackParamList, 'Preferences'>) {
  const { user } = useAuth();

  // State to track current step (0 to 3)
  const [step, setStep] = useState(0);

  // State to accumulate data across steps
  const [formData, setFormData] = useState<OnboardingData>({});

  const handleFinalSubmit = async (finalData: OnboardingData) => {
    try {
      console.log('Final Payload for API:', finalData);

      // TODO: Call your API backend here to insert into:
      // 1. user_profile (DOB, sex, activity_factor, preferred units)
      // 2. user_weight_log (weight)
      // 3. user_height_log (height)
      // 4. user_goal (target_weight)

      Alert.alert('Success', 'Profile setup complete!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }, // Or wherever you go next
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <BasicUserInfo
            onSubmit={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(1);
            }}
          />
        );
      case 1:
        return (
          <BodyStats
            // We cast because we know step 0 set these
            units={formData as BasicUserInfoData}
            onSubmit={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(2);
            }}
          />
        );
      case 2:
        return (
          <Lifestyle
            onSubmit={(data) => {
              setFormData((prev) => ({ ...prev, ...data }));
              setStep(3);
            }}
          />
        );
      case 3:
        return (
          <Objective
            units={formData as BasicUserInfoData}
            onSubmit={(data) => {
              const completeData = { ...formData, ...data };
              setFormData(completeData);
              handleFinalSubmit(completeData);
            }}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 0:
        return 'Tell us about yourself';
      case 1:
        return 'Body Measurements';
      case 2:
        return 'Lifestyle';
      case 3:
        return 'Your Goal';
    }
  };

  return (
    <View className="flex-1 bg-background p-8">
      <View className="mt-8">
        <H1 className="text-center">Hi {user?.name}</H1>
        <H2 className="mt-2 text-center text-muted-foreground">{getStepTitle()}</H2>

        {/* Simple Progress Indicator */}
        <View className="mt-4 flex-row justify-center space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className={`h-2 w-2 rounded-full ${i === step ? 'bg-primary' : 'bg-gray-300'}`}
            />
          ))}
        </View>
      </View>

      {renderStep()}
    </View>
  );
}
