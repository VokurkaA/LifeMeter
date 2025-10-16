import {Eye, EyeOff} from 'lucide-react-native';
import {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {H1} from '@/components/ui/Text';
import {useToast} from '@/components/ui/Toast';
import {useAuth} from '@/contexts/AuthContext';
import {useNavigation} from '@/contexts/NavigationContext';
import {ScreenWrapper} from '@/navigation/ScreenWrapper';
import {useTheme} from '@/lib/theme-provider';

function LogIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const {signIn} = useAuth();
    const {clearStack} = useNavigation();
    const {toast} = useToast();

    const handleLogIn = async () => {
        if (!email || !password) {
            toast('Please enter both email and password', 'destructive', 5000, 'top', false);
            return;
        }
        try {
            await signIn(email, password, undefined, true);
            clearStack(); 
        } catch (e) {
            console.error(e);
            toast('Failed to log in', 'destructive', 5000);
        }
    }
    const {isDark} = useTheme();

    return (<ScreenWrapper>
            <H1 className='text-center'>Log In</H1>
            <KeyboardAwareScrollView className='p-8'>
                <View className="gap-4 p-4">
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
                    <Button label='Log In' onPress={handleLogIn}/>
                </View>
            </KeyboardAwareScrollView>
        </ScreenWrapper>);
}

export default LogIn;