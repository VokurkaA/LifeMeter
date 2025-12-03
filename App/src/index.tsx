import 'react-native-gesture-handler';
import '@/styles/global.css';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import HomeScreen from '@/screens/app/Home.screen';
import NutritionScreen from '@/screens/app/nutrition/Index.screen';
import TrainingScreen from './screens/app/training/index.screen';
import LoginScreen from '@/screens/onboarding/Login.screen';
import SigninScreen from '@/screens/onboarding/Signin.screen';
import TitleScreen from '@/screens/onboarding/Title.screen';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/contexts/useAuth';
import { StoreProvider } from '@/contexts/useStore';
import { ThemeProvider, useTheme } from '@/lib/theme-provider';
import { useExitConfirmBackHandler } from '@/navigation/back-handler';
import { navigationRef } from '@/navigation/navigation';
import { AppStackParamList, OnboardingStackParamList } from '@/types/types';
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SleepScreen from './screens/app/sleep/Index.screen';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function Root() {
  const { isDark } = useTheme();
  const { user, loading } = useAuth();
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>(undefined);

  const atHome = currentRouteName === 'Home';
  const atTitle = currentRouteName === 'Title';
  const enableExitConfirm = (!user && atTitle) || (!!user && atHome);
  useExitConfirmBackHandler(enableExitConfirm);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name)}
      >
        {loading ? (
          <View className="items-center justify-center flex-1">
            <ActivityIndicator size="large" />
          </View>
        ) : !user ? (
          <OnboardingStack.Navigator
            initialRouteName="Title"
            screenOptions={{ contentStyle: { backgroundColor: 'transparent' }, headerShown: false }}
          >
            <OnboardingStack.Screen
              name="Title"
              component={TitleScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <OnboardingStack.Screen name="Login" component={LoginScreen} />
            <OnboardingStack.Screen name="SignUp" component={SigninScreen} />
          </OnboardingStack.Navigator>
        ) : (
          <View className="flex-1">
            <Header />
            <AppStack.Navigator
              initialRouteName="Home"
              screenOptions={{ headerShown: false, animation: 'none' }}
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
                        routes: [{ name: 'Home' as never }],
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
        )}
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <Root />
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

registerRootComponent(App);
