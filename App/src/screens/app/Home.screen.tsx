import { SimpleCard } from '@/components/ui/Card';
import { H1 } from '@/components/ui/Text';
import { ScrollView, View } from 'react-native';

export default function HomeScreen() {
  const lorem =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation .';
  return (
    <ScrollView className="flex flex-1 bg-background">
      <H1 className="m-4">Home Screen</H1>
      <View className="p-4">
        <SimpleCard
          className="mb-4"
          variant="elevated"
          title="Elevated Card"
          description="sample text"
          content={lorem}
          footer="Footer text"
        />
        <SimpleCard
          className="mb-4"
          variant="outline"
          title="Outline card"
          description="sample text"
          content={lorem}
          footer="Footer text"
        />
        <SimpleCard
          variant="plain"
          title="Plain card"
          description="sample text"
          content={lorem}
          footer="Footer text"
        />
      </View>
    </ScrollView>
  );
}
