import { useTheme } from '@/lib/theme-provider';
import React from 'react';
import { Text, View } from 'react-native';
import { Switch } from './ui/Switch';

export function ThemeToggle({className, ...props}: React.ComponentPropsWithoutRef<typeof View>) {
    const {setTheme, isDark} = useTheme();
    return (<View className={`flex-row items-center justify-between p-4 border rounded-lg bg-card border-border ${className}`} {...props}>
            <View className="flex-row items-center space-x-3">
                <Text className="text-lg font-medium text-foreground">
                    {isDark ? '🌙' : '☀️'}
                </Text>
                <Text className="text-base font-medium text-foreground">
                    {isDark ? 'Dark' : 'Light'} Mode
                </Text>
            </View>
            <Switch
                value={isDark}
                onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
            />
        </View>);
}
