import 'react-native-gesture-handler';
import '@/styles/global.css';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import HomeScreen from '@/screens/app/Home.screen';
import NutritionScreen from '@/screens/app/nutrition/Index.screen';
import TrainingScreen from './screens/app/training/index.screen';
import SleepScreen from './screens/app/sleep/Index.screen';
import LoginScreen from '@/screens/onboarding/Login.screen';
import SignupScreen from '@/screens/onboarding/SignupScreen';
import TitleScreen from '@/screens/onboarding/Title.screen';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/contexts/useAuth';
import { StoreProvider, useStore } from '@/contexts/useStore';
import { ThemeProvider, useTheme } from '@/lib/theme-provider';
import { useExitConfirmBackHandler } from '@/navigation/back-handler';
import { AppStackParamList, OnboardingStackParamList } from '@/types/types';
import { navigationRef } from '@/navigation/navigation';
import { PreferencesScreen } from '@/screens/onboarding/userInfo/Index.Screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function MainLayout({ currentRouteName }: { currentRouteName?: string }) {
  const { user } = useAuth();
  const { userProfile } = useStore();

  const atHome = currentRouteName === 'Home';
  const atTitle = currentRouteName === 'Title';
  const enableExitConfirm = (!user && atTitle) || (!!user && atHome);

  useExitConfirmBackHandler(enableExitConfirm);

  if (!user) {
    return (
      <OnboardingStack.Navigator
        initialRouteName="Title"
        screenOptions={{
          contentStyle: { backgroundColor: 'transparent' },
          headerShown: false,
        }}
      >
        <OnboardingStack.Screen
          name="Title"
          component={TitleScreen}
          options={{ gestureEnabled: false }}
        />
        <OnboardingStack.Screen name="Login" component={LoginScreen} />
        <OnboardingStack.Screen name="SignUp" component={SignupScreen} />
      </OnboardingStack.Navigator>
    );
  }

  if (!userProfile?.finishedOnboarding) {
    return <PreferencesScreen />;
  }

  return (
    <View className="flex-1">
      <Header />
      <AppStack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
        screenListeners={({ navigation }) => ({
          beforeRemove: (e) => {
            if (e.data.action.type !== 'GO_BACK') return;
            const state = navigation.getState();
            const current = state.routes[state.index]?.name;
            if (current !== 'Home') {
              e.preventDefault();
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                }),
              );
            }
          },
        })}
      >
        <AppStack.Screen name="Home" component={HomeScreen} />
        <AppStack.Screen name="Training" component={TrainingScreen} />
        <AppStack.Screen name="Nutrition" component={NutritionScreen} />
        <AppStack.Screen name="Sleep" component={SleepScreen} />
      </AppStack.Navigator>

      <Footer current={currentRouteName} />
    </View>
  );
}

function Root() {
  const { isDark } = useTheme();
  const { loading } = useAuth();
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name)}
      >
        <MainLayout currentRouteName={currentRouteName} />
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <StoreProvider>
              <ToastProvider>
                <Root />
              </ToastProvider>
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
