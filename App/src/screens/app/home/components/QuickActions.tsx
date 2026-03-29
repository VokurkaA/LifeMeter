import React from "react";
import { View } from "react-native";
import { Button, useThemeColor } from "heroui-native";
import { Text } from "@/components/Text";
import { navigate } from "@/navigation/navigate";
import { Utensils, Scale, Dumbbell } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export const QuickActions = () => {
  const themeColorAccent = useThemeColor("accent");

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onPress,
    delay
  }: { 
    icon: any, 
    label: string, 
    onPress: () => void,
    delay: number
  }) => (
    <View className="flex-1">
      <Button 
        variant="secondary"
        className="flex-col h-24 w-full gap-2 border border-muted/5"
        onPress={onPress}
      >
        <View className="bg-accent/10 p-2.5 rounded-xl">
          <Icon size={20} color={themeColorAccent} />
        </View>
        <Button.Label className="text-xs font-bold uppercase tracking-wider text-foreground">
          {label}
        </Button.Label>
      </Button>
    </View>
  );

  return (
    <View className="flex-row justify-between gap-3">
      <ActionButton 
        icon={Utensils} 
        label="Add Meal" 
        onPress={() => navigate("Nutrition")} 
        delay={300}
      />
      <ActionButton 
        icon={Scale} 
        label="Weight" 
        onPress={() => navigate("UserSettings")} 
        delay={400}
      />
      <ActionButton 
        icon={Dumbbell} 
        label="Workout" 
        onPress={() => navigate("Training")} 
        delay={500}
      />
    </View>
  );
};
