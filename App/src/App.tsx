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
import { StoreProvider } from '@/contexts/useStore';
import { useUserStore } from '@/contexts/useUserStore';
import WelcomeScreen from '@/screens/onboarding/Welcome.screen';
import SignIn from '@/screens/onboarding/SignIn.screen';
import SignUp from '@/screens/onboarding/SignUp.screen';
import OnboardingInfoScreen from "@/screens/onboarding/userInfo/Index.screen";
import { navigationRef } from '@/navigation/navigate';
import AppTabs from '@/navigation/Tabs';
import ActiveWorkoutScreen from '@/screens/app/training/ActiveWorkout.screen';
import TemplateBuilderScreen from '@/screens/app/training/TemplateBuilder.screen';
import UserSettingsScreen from '@/screens/app/settings/UserSettings.screen';
import { KeyboardProvider } from "react-native-keyboard-controller";
import * as Notifications from "expo-notifications";
import { NetworkProvider } from './contexts/useNetwork';
import ToastRegistrar from '@/components/ToastRegistrar';
import AutoHealthSync from '@/components/AutoHealthSync';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

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

function RootAppContent() {
    const { user, loading } = useAuth();
    const { userProfile, isLoading } = useUserStore();

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

    return (
        <View className='flex-1'>
            <NavigationContainer ref={navigationRef}>
                <AppStack.Navigator
                    initialRouteName="Tabs"
                    screenOptions={screenOptions}
                >
                    <AppStack.Screen name="Tabs" component={AppTabs} />
                    <AppStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
                    <AppStack.Screen name="TemplateBuilder" component={TemplateBuilderScreen} />
                    <AppStack.Screen name="UserSettings" component={UserSettingsScreen} />
                </AppStack.Navigator>
            </NavigationContainer>
        </View>
    );
}

function RootApp() {
    return (
        <NetworkProvider>
            <AutoHealthSync />
            <RootAppContent />
        </NetworkProvider>
    );
}

function AppContent() {
    const surfaceColor = useThemeColor('surface');
    const backgroundColor = useThemeColor('background');
    return (
        <>
            <ToastRegistrar />
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
        </>
    );
}

export default function App() {
    return (<GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
            <SafeAreaProvider>
                <HeroUINativeProvider>
                    <AppContent />
                </HeroUINativeProvider>
            </SafeAreaProvider>
        </KeyboardProvider>
    </GestureHandlerRootView>);
}
