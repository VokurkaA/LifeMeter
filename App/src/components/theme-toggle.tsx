import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../lib/theme-provider';
import { Switch } from './ui/Switch';

export function ThemeToggle() {
  const { setTheme, isDark } = useTheme();
  return (
    <View className="flex-row items-center justify-between rounded-lg border border-border bg-card p-4">
      <View className="flex-row items-center space-x-3">
        <Text className="text-lg font-medium text-foreground">{isDark ? '🌙' : '☀️'}</Text>
        <Text className="text-base font-medium text-foreground">
          {isDark ? 'Dark' : 'Light'} Mode
        </Text>
      </View>
      <Switch value={isDark} onValueChange={(value) => setTheme(value ? 'dark' : 'light')} />
    </View>
  );
}
