import {useRef, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {Button, TextField, useThemeColor, useToast} from 'heroui-native';
import {ArrowUpRight, CircleAlert, Eye, EyeOff} from 'lucide-react-native';
import {Heading} from '../../components/Text';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '@/contexts/useAuth';

export default function SignUp() {
    const {signUp} = useAuth();
    const {toast} = useToast();
    const themeColorMuted = useThemeColor('muted');
    const themeColorDanger = useThemeColor('danger');
    const placeholderColor = useThemeColor('field-placeholder');
    const navigation = useNavigation<any>();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const usernameRef = useRef<TextInput | null>(null);
    const emailRef = useRef<TextInput | null>(null);
    const passwordRef = useRef<TextInput | null>(null);
    const confirmPasswordRef = useRef<TextInput | null>(null);

    const isUsernameValid = username === '' || username.length >= 3 && username.length <= 20;
    const isEmailValid = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = password === '' || password.length >= 8;
    const isConfirmValid = confirmPassword === '' || (confirmPassword.length >= 8 && confirmPassword === password);

    const canSubmit = username !== '' && email !== '' && password !== '' && confirmPassword !== '' && isUsernameValid && isEmailValid && isPasswordValid && isConfirmValid;

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await signUp(email, password, username);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Something went wrong while signing up';

            toast.show({
                variant: 'danger',
                label: 'Failed to sign up',
                description: message,
                icon: <CircleAlert color={themeColorDanger}/>,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (<View className="gap-4 p-4">
        <Heading>Sign Up</Heading>

        <TextField
            isRequired
            isDisabled={isSubmitting}
            isInvalid={username !== '' && !isUsernameValid}
        >
            <TextField.Label>Username</TextField.Label>
            <TextField.Input
                accessibilityLabel="Username"
                placeholderTextColor={placeholderColor}
                ref={usernameRef}
                placeholder="Choose a username"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                editable={!isSubmitting}
                value={username}
                onChangeText={setUsername}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus()}
            />
            <TextField.Description>Choose your username</TextField.Description>
            <TextField.ErrorMessage>Username must be between 3 and 20 characters</TextField.ErrorMessage>
        </TextField>

        <TextField
            isRequired
            isDisabled={isSubmitting}
            isInvalid={email !== '' && !isEmailValid}
        >
            <TextField.Label>Email</TextField.Label>
            <TextField.Input
                accessibilityLabel="Email"
                ref={emailRef}
                placeholderTextColor={placeholderColor}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                editable={!isSubmitting}
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField.Description>Enter your email address</TextField.Description>
            <TextField.ErrorMessage>Please enter a valid email address</TextField.ErrorMessage>
        </TextField>

        <TextField
            isRequired
            isDisabled={isSubmitting}
            isInvalid={password !== '' && !isPasswordValid}
        >
            <TextField.Label>Password</TextField.Label>
            <View className="flex-row items-center w-full">
                <TextField.Input
                    accessibilityLabel="Password"
                    ref={passwordRef}
                    className="flex-1 pr-12"
                    placeholderTextColor={placeholderColor}
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    editable={!isSubmitting}
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <Pressable
                    className="absolute right-4"
                    onPress={() => setShowPassword(prev => !prev)}
                    hitSlop={10}
                    disabled={isSubmitting}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? (<EyeOff color={themeColorMuted} size={20}/>) : (
                        <Eye color={themeColorMuted} size={20}/>)}
                </Pressable>
            </View>
            <TextField.Description>Choose your password</TextField.Description>
            <TextField.ErrorMessage>Password must be at least 8 characters</TextField.ErrorMessage>
        </TextField>

        <TextField
            isRequired
            isDisabled={isSubmitting}
            isInvalid={confirmPassword !== '' && !isConfirmValid}
        >
            <TextField.Label>Confirm Password</TextField.Label>
            <View className="flex-row items-center w-full">
                <TextField.Input
                    accessibilityLabel="Confirm Password"
                    ref={confirmPasswordRef}
                    className="flex-1 pr-12"
                    placeholderTextColor={placeholderColor}
                    placeholder="Re-enter your password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    editable={!isSubmitting}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                />
                <Pressable
                    className="absolute right-4"
                    onPress={() => setShowConfirmPassword(prev => !prev)}
                    hitSlop={10}
                    disabled={isSubmitting}
                    accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                    {showConfirmPassword ? (<EyeOff color={themeColorMuted} size={20}/>) : (
                        <Eye color={themeColorMuted} size={20}/>)}
                </Pressable>
            </View>
            <TextField.Description>Enter your password again</TextField.Description>
            <TextField.ErrorMessage>Passwords must match</TextField.ErrorMessage>
        </TextField>

        <Button isDisabled={!canSubmit || isSubmitting} onPress={handleSubmit}>
            Sign up
        </Button>

        <Pressable
            className="flex flex-row items-center"
            onPress={() => navigation.navigate('SignIn')}
            disabled={isSubmitting}
        >
            <Text className="text-foreground">Already have an account?</Text>
            <Text> </Text>
            <Text className="underline text-muted">Sign in</Text>
            <ArrowUpRight size={14} color={themeColorMuted}/>
        </Pressable>
    </View>);
}
