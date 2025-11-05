import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { H1 } from '@/components/ui/Text';
import { OnboardingStackParamList } from '@/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';

export default function TitleScreen({
  navigation,
}: NativeStackScreenProps<OnboardingStackParamList, 'Title'>) {
  return (
    <View className="flex flex-1 flex-col justify-between bg-background">
      <H1 className="mt-16 text-center">Welcome</H1>
      <Card className="rounded-b-none rounded-t-xl bg-card p-8">
        <Button
          className="mb-8 rounded-full"
          size="lg"
          label="Get Started"
          variant="default"
          onPress={() => navigation.navigate('SignUp')}
        />
        <Button
          className="rounded-full"
          size="lg"
          label="I already have an account"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
        />
      </Card>
    </View>
  );
}
