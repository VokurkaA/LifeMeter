import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View>
      <Text>Welcome to LifeMeter!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

registerRootComponent(App);

