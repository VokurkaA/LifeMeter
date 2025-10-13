import {Poppins_600SemiBold_Italic, useFonts} from '@expo-google-fonts/poppins';
import {registerRootComponent} from 'expo';
import {StatusBar} from 'expo-status-bar';
import {ActivityIndicator, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ToastProvider, useToast} from './components/ui/Toast';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import {NavigationProvider} from './contexts/NavigationContext';
import {ThemeProvider, useTheme} from './lib/theme-provider';
import {useBackHandler} from './lib/useBackHandler';
import {NavigationContainer} from './navigation/NavigationContainer';
import "./styles/global.css";
import {Tab} from './types';
import {configureReanimatedLogger} from 'react-native-reanimated';

const tabs: Tab[] = [{
    id: 'home', name: 'Home'
}, {
    id: 'profile', name: 'Profile'
},];

function AppContent() {
    const {isDark} = useTheme();
    const {user, loading} = useAuth();
    const {toast} = useToast();

    useBackHandler({
        onExitPrompt: () => {
            toast('Press back again to exit', 'info', 2000, 'bottom', false);
        },
    });

    if (loading) {
        return (<SafeAreaView className={`flex-1 justify-center items-center bg-background`}>
                <StatusBar style={isDark ? 'light' : 'dark'}/>
                <View className="items-center justify-center flex-1">
                    <ActivityIndicator size="large"/>
                </View>
            </SafeAreaView>);
    }

    return (<SafeAreaView className={`flex-1 bg-background`}>
            <StatusBar style={isDark ? 'light' : 'dark'}/>
            <NavigationContainer rootScreenId={user ? "home" : "auth"}/>
        </SafeAreaView>);
}

export default function App() {
    configureReanimatedLogger({
        strict: false
    });
    const [fontsLoaded] = useFonts({
        Poppins_600SemiBold_Italic,
    });

    if (!fontsLoaded) {
        return (<View className="items-center justify-center flex-1">
            <ActivityIndicator size="large"/>
        </View>);
    }

    return (<ThemeProvider>
            <AuthProvider>
                <NavigationProvider tabs={tabs}>
                    <ToastProvider position="top">
                        <AppContent/>
                    </ToastProvider>
                </NavigationProvider>
            </AuthProvider>
        </ThemeProvider>);
}

registerRootComponent(App);