import AuthScreen from '@/screens/auth/AuthScreen';
import LogInScreen from '@/screens/auth/LogInScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import HomeScreen from '@/screens/HomeScreen';
import React from 'react';

export type ScreenId = 'home' | 'auth' | 'login' | 'signup' | 'profile';

export const ScreenRegistry: Record<ScreenId, React.ComponentType> = {
    home: HomeScreen, auth: AuthScreen, login: LogInScreen, signup: SignUpScreen, profile: () => null, // TODO: Implement profile screen
};

export function getScreenComponent(screenId: string): React.ComponentType | null {
    return ScreenRegistry[screenId as ScreenId] || null;
}
