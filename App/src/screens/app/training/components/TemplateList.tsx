import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, PressableFeedback } from 'heroui-native';
import { Text } from '@/components/Text';
import { useWorkoutStore } from '@/contexts/useWorkoutStore';
import { Dumbbell, Plus } from 'lucide-react-native';
import { navigate } from '@/navigation/navigate';

export default function TemplateList() {
  const { userWorkoutTemplates } = useWorkoutStore();

  return (
    <View className="gap-2 mb-6">
      <Text className="text-xl font-bold px-1">Templates</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {userWorkoutTemplates.map((template) => (
          <PressableFeedback key={template.id} className="mr-3" onPress={() => navigate('TemplateBuilder', { templateId: template.id })}>
            <Card className="p-4 w-40 min-h-32 justify-between">
              <Card.Header>
                <View className="bg-primary/10 p-2 rounded-full w-10 h-10 items-center justify-center">
                  <Dumbbell size={20} color="#0ea5e9" />
                </View>
              </Card.Header>
              <Card.Body>
                <Card.Title className="text-sm" numberOfLines={2}>{template.name}</Card.Title>
                <Card.Description className="text-xs">{template.sets.length} sets</Card.Description>
              </Card.Body>
            </Card>
          </PressableFeedback>
        ))}
        <PressableFeedback onPress={() => navigate('TemplateBuilder', {})}>
          <Card className="p-4 w-40 min-h-32 justify-center items-center border-dashed border-border/50 border bg-surface/30">
             <Plus size={24} color="#888" className="mb-2" />
             <Text className="text-muted font-bold">New Template</Text>
          </Card>
        </PressableFeedback>
      </ScrollView>
    </View>
  );
}
