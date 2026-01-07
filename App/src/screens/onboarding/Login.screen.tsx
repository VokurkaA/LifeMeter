import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H1 } from '@/components/ui/Text';
import { useAuth } from '@/contexts/useAuth';
import { OnboardingStackParamList } from '@/types/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, TextInput, View } from 'react-native';
import { useToast } from '@/components/ui/Toast'; //

export default function LoginScreen({
  navigation,
}: NativeStackScreenProps<OnboardingStackParamList, 'Login'>) {
  const { signIn } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      toast('Please enter both email and password', 'destructive');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error(error);
      toast(error.message || 'Login failed', 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background p-8">
      <H1 className="my-8 text-center">Log in</H1>
      <KeyboardAvoidingView>
        <View className="mt-16">
          <Input
            ref={emailRef}
            type="email"
            className="mb-4"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            onReturnFocus={passwordRef}
          />
          <Input
            ref={passwordRef}
            type="password"
            className="mb-4"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            onReturnFocus={() => Keyboard.dismiss()}
          />
          <Button
            className="mt-4"
            label={isLoading ? 'Logging in...' : 'Log in'}
            variant="default"
            disabled={isLoading}
            onPress={handleLogin}
          />
        </View>
      </KeyboardAvoidingView>
      <Button
        className="mt-auto"
        label="Create an account"
        variant="link"
        onPress={() => navigation.navigate('SignUp')}
      />
    </View>
  );
}
