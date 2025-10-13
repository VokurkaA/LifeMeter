import {Eye, EyeOff} from 'lucide-react-native';
import {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {H1} from '@/components/ui/Text';
import {useToast} from '@/components/ui/Toast';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from '@/lib/theme-provider';
import {ScreenWrapper} from '@/navigation/ScreenWrapper';

function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {signUp} = useAuth();
    const {toast} = useToast();
    const {isDark} = useTheme();

    const handleSignUp = async () => {
        if (!email || !password) {
            toast('Please fill all fields', 'destructive', 5000, 'top', false);
            return;
        }
        if (password !== confirmPassword) {
            toast('Passwords do not match', 'destructive', 5000, 'top', false);
            return;
        }
        try {
            await signUp(email, password, name, true);
            toast('Successfully signed up!', 'success', 3000);
        } catch (e) {
            console.error(e);
            toast('Failed to sign up', 'destructive', 5000);
        }
    }

    return (<ScreenWrapper>
            <KeyboardAwareScrollView className='p-8'>
                <H1 className='mb-8 text-center'>Sign Up</H1>
                <View className="gap-4 p-4">
                    <Input
                        label='Name'
                        placeholder="Enter your name"
                        value={name}
                        onChangeText={setName}
                    />
                    <Input
                        label='Email'
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                    />
                    <View className="relative">
                        <Input
                            label='Password'
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize='none'
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-9"
                        >
                            {showPassword ? (<EyeOff color={isDark ? '#ffffff' : '#000000'} size={20}
                                                     className="text-muted-foreground"/>) : (
                                <Eye color={isDark ? '#ffffff' : '#000000'} size={20}
                                     className="text-muted-foreground"/>)}
                        </TouchableOpacity>
                    </View>
                    <View className="relative">
                        <Input
                            label='Confirm Password'
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize='none'
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-9"
                        >
                            {showConfirmPassword ? (<EyeOff color={isDark ? '#ffffff' : '#000000'} size={20}
                                                            className="text-muted-foreground"/>) : (
                                <Eye color={isDark ? '#ffffff' : '#000000'} size={20}
                                     className="text-muted-foreground"/>)}
                        </TouchableOpacity>
                    </View>
                    <Button label='Sign Up' onPress={handleSignUp}/>
                </View>
            </KeyboardAwareScrollView>
        </ScreenWrapper>);
}

export default SignUp;