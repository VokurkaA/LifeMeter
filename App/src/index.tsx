import "./styles/global.css";
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './lib/theme-provider';
import { ThemeToggle } from './components/theme-toggle';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <ThemeToggle />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

registerRootComponent(App);

