export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string;
    createdAt: string;
    updatedAt: string;
    role: string;
    banned: boolean;
    banReason: string;
    banExpires: string;
    lastLoginMethod: string;
    normalizedEmail: string;
}

export interface Session {
    id: string;
    expiresAt: string;
    token: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string;
    userAgent: string;
    userId: string;
    impersonatedBy: string;
}

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, name?: string, rememberMe?: boolean) => Promise<void>;
    signIn: (email: string, password: string, callbackURL?: string, rememberMe?: boolean) => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

export interface StoreContextType {
    sleepSessions: SleepSession[];
    startSleep: () => Promise<SleepSession>;
    endSleep: () => Promise<SleepSession>;
    refreshSleepSessions: () => Promise<void>;
}

export interface NavigationItem {
    id: string;
    name: string;
    component?: React.ReactElement;
    params?: Record<string, unknown>;
}

export interface Tab extends NavigationItem {
    icon?: string;
    badge?: number;
}

export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

export type Theme = "light" | "dark" | "system";

export type OnboardingStackParamList = {
    Title: undefined;
    SignUp: undefined;
    Login: undefined;
};

export type AppStackParamList = {
    Home: undefined;
    Training: undefined;
    Nutrition: undefined;
    Sleep: undefined;
};

export type SleepSession = {
    id: string;
    userId: string;
    startAt: string;
    endAt: string | null;
    note: string | null;
}
export type RootParamList = OnboardingStackParamList & AppStackParamList;
