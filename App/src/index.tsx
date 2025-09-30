import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Welcome to LifeMeter!</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

registerRootComponent(App);

