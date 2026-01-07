import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { H1 } from '@/components/ui/Text';
import { useAuth } from '@/contexts/useAuth';
import { OnboardingStackParamList } from '@/types/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, TextInput, View } from 'react-native';
import { useToast } from '@/components/ui/Toast';

export default function SignupScreen({
  navigation,
}: NativeStackScreenProps<OnboardingStackParamList, 'SignUp'>) {
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      toast('Please fill in all fields', 'destructive');
      return;
    }

    if (password !== confirmPassword) {
      toast('Passwords do not match', 'destructive');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, name);
    } catch (error: any) {
      console.error(error);
      toast(error.message || 'Sign up failed', 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background p-8">
      <H1 className="my-8 text-center">Sign up</H1>
      <KeyboardAvoidingView>
        <View className="mt-16">
          <Input
            ref={nameRef}
            type="name"
            className="mb-4"
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            onReturnFocus={emailRef}
          />
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
            onReturnFocus={confirmRef}
          />
          <Input
            ref={confirmRef}
            type="confirmPassword"
            className="mb-4"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onReturnFocus={() => Keyboard.dismiss()}
          />
        </View>
        <Button
          className="mt-4"
          label={isLoading ? 'Creating account...' : 'Create an account'}
          variant="default"
          disabled={isLoading}
          onPress={handleSignUp}
        />
      </KeyboardAvoidingView>
      <Button
        className="mt-auto"
        label="I already have an account"
        variant="link"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
}
