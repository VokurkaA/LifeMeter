import React, { createContext, useContext, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import type { Theme, ThemeContextType } from '@/types/types';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const systemColorScheme = useColorScheme();

  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      <View className={isDark ? 'dark' : ''} style={{ flex: 1 }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
