import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CommonActions, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useExitConfirmBackHandler } from '@/navigation/back-handler';
import { AppStackParamList, OnboardingStackParamList } from './types/types';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HeroUINativeProvider, useThemeColor } from 'heroui-native';
import '../global.css';
import { AuthProvider, useAuth } from '@/contexts/useAuth';
import { StoreProvider, useStore } from './contexts/useStore';
import WelcomeScreen from '@/screens/onboarding/Welcome.screen';
import SignIn from '@/screens/onboarding/SignIn.screen';
import SignUp from '@/screens/onboarding/SignUp.screen';
import OnboardingInfoScreen from "@/screens/onboarding/userInfo/Index.screen";
import { navigationRef } from '@/navigation/navigate';
import SleepList from "@/screens/app/sleep/components/SleepList";
import AppTabs from '@/navigation/Tabs';
import { KeyboardProvider } from "react-native-keyboard-controller";

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const useScreenOptions = () => {
    const backgroundColor = useThemeColor('background');
    return {
        headerShown: false, headerStyle: { backgroundColor }, contentStyle: { backgroundColor }, animation: 'none' as const,
    };
};

const createResetListener = (rootRouteName: string) => ({ navigation }: any) => ({
    beforeRemove: (e: any) => {
        if (e.data.action.type !== 'GO_BACK') return;

        const state = navigation.getState();
        const currentRoute = state.routes[state.index]?.name;

        if (currentRoute !== rootRouteName) {
            e.preventDefault();
            navigation.dispatch(CommonActions.reset({
                index: 0, routes: [{ name: rootRouteName }],
            }));
        }
    },
});


function RootApp() {
    const { user, loading } = useAuth();
    const { userProfile, isLoading } = useStore();

    const onboardingRef = useNavigationContainerRef();
    const screenOptions = useScreenOptions();

    const onboardingRoute = onboardingRef.isReady() ? onboardingRef.getCurrentRoute()?.name : undefined;
    const appRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;
    const enableExitConfirm = (!user && onboardingRoute === 'Title') || (user && appRoute === 'Home');

    useExitConfirmBackHandler(enableExitConfirm ?? false);

    if (loading || (!userProfile && isLoading)) {
        return null;
    }

    if (!user) {
        return (<NavigationContainer ref={onboardingRef}>
            <OnboardingStack.Navigator
                initialRouteName="Title"
                screenOptions={screenOptions}
                screenListeners={createResetListener('Title')}
            >
                <OnboardingStack.Screen name="Title" component={WelcomeScreen} />
                <OnboardingStack.Screen name="SignIn" component={SignIn} />
                <OnboardingStack.Screen name="SignUp" component={SignUp} />
            </OnboardingStack.Navigator>
        </NavigationContainer>);
    }

    if (!userProfile || !userProfile.finishedOnboarding) {
        return <OnboardingInfoScreen />;
    }

    return (<View className='flex-1'>
        <NavigationContainer ref={navigationRef}>
            <AppStack.Navigator
                initialRouteName="Tabs"
                screenOptions={screenOptions}
            >
                <AppStack.Screen name="Tabs" component={AppTabs} />
                <AppStack.Screen name="SleepList" component={SleepList} />
            </AppStack.Navigator>
        </NavigationContainer>
    </View>);
}

export default function App() {
    const surfaceColor = useThemeColor('surface');
    const backgroundColor = useThemeColor('background');
    return (<GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
            <SafeAreaProvider>
                <HeroUINativeProvider>
                    <AuthProvider>
                        <StoreProvider>
                            <SafeAreaView edges={['left', 'right', 'top']} style={{ flex: 1, backgroundColor }}>
                                <View className="flex-1 bg-background">
                                    <RootApp />
                                </View>
                                <StatusBar
                                    backgroundColor={surfaceColor}
                                    translucent={false}
                                    style="auto"
                                />
                            </SafeAreaView>
                        </StoreProvider>
                    </AuthProvider>
                </HeroUINativeProvider>
            </SafeAreaProvider>
        </KeyboardProvider>
    </GestureHandlerRootView>);
}