import {Button, TextField, useThemeColor, useToast} from "heroui-native";
import {Pressable, Text, TextInput, View} from "react-native";
import {useRef, useState} from "react";
import {ArrowUpRight, CircleAlert, Eye, EyeOff} from "lucide-react-native";
import {Heading} from "@/components/Text";
import {useNavigation} from "@react-navigation/native";
import {useAuth} from "@/contexts/useAuth";

export default function SignIn() {
    const {signIn} = useAuth();
    const {toast} = useToast();
    const themeColorMuted = useThemeColor("muted");
    const themeColorDanger = useThemeColor("danger");
    const placeholderColor = useThemeColor("field-placeholder");
    const navigation = useNavigation<any>();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const emailRef = useRef<TextInput | null>(null);
    const passwordRef = useRef<TextInput | null>(null);

    const isEmailValid = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = password === "" || password.length >= 6;

    const canSubmit = email !== "" && password !== "" && isEmailValid && isPasswordValid;

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await signIn(email, password);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong while signing in";

            toast.show({
                variant: "danger",
                label: "Failed to sign in",
                description: message,
                icon: <CircleAlert color={themeColorDanger}/>,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (<View className="gap-4 p-4">
        <Heading>Sign In</Heading>

        <TextField
            isRequired
            isDisabled={isSubmitting}
            isInvalid={email !== "" && !isEmailValid}
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
            isInvalid={password !== "" && !isPasswordValid}
        >
            <TextField.Label>Password</TextField.Label>
            <View className="flex-row items-center w-full">
                <TextField.Input
                    accessibilityLabel="Password"
                    ref={passwordRef}
                    className="flex-1 pr-12"
                    placeholderTextColor={placeholderColor}
                    placeholder="Enter password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    editable={!isSubmitting}
                    onChangeText={setPassword}
                    autoComplete="password"
                    textContentType="password"
                    value={password}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                />
                <Pressable
                    className="absolute right-4"
                    onPress={() => setShowPassword(prev => !prev)}
                    hitSlop={10}
                    disabled={isSubmitting}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? (<EyeOff color={themeColorMuted} size={20}/>) : (
                        <Eye color={themeColorMuted} size={20}/>)}
                </Pressable>
            </View>
            <TextField.ErrorMessage>Password must be at least 6 characters</TextField.ErrorMessage>
        </TextField>

        <Button isDisabled={!canSubmit || isSubmitting} onPress={handleSubmit}>
            Sign in
        </Button>

        <Pressable
            className="flex flex-row items-center"
            onPress={() => navigation.navigate("SignUp")}
            disabled={isSubmitting}
        >
            <Text className="text-foreground">Don't have an account?</Text>
            <Text> </Text>
            <Text className="underline text-muted">Sign up</Text>
            <ArrowUpRight size={14} color={themeColorMuted}/>
        </Pressable>
    </View>);
}
