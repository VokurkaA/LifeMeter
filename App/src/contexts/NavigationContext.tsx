import { NavigationItem, Tab } from '@/types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface NavigationContextType {
  tabs: Tab[];
  activeTabIndex: number;
  activeTab: Tab;
  switchTab: (index: number) => Tab | null;
  setActiveTabById: (id: string) => Tab | null;
  navigate: (item: NavigationItem) => void;
  goBack: () => NavigationItem | null;
  canGoBack: () => boolean;
  getCurrentScreen: () => NavigationItem | null;
  replace: (item: NavigationItem) => void;
  clearStack: () => void;
  isOnHomeTab: () => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  tabs: Tab[];
}

export function NavigationProvider({ children, tabs }: NavigationProviderProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  const [stacks, setStacks] = useState<Map<string, NavigationItem[]>>(
    new Map(tabs.map(tab => [tab.id, []]))
  );

  const activeTab = tabs[activeTabIndex];

  const switchTab = (index: number): Tab | null => {
    if (index >= 0 && index < tabs.length) {
      setActiveTabIndex(index);
      return tabs[index];
    }
    return null;
  };

  const setActiveTabById = (id: string): Tab | null => {
    const index = tabs.findIndex((tab) => tab.id === id);
    if (index !== -1) {
      setActiveTabIndex(index);
      return tabs[index];
    }
    return null;
  };

  const navigate = (item: NavigationItem): void => {
    const currentStack = stacks.get(activeTab.id) || [];
    setStacks(new Map(stacks.set(activeTab.id, [...currentStack, item])));
  };

  const goBack = (): NavigationItem | null => {
    const currentStack = stacks.get(activeTab.id) || [];
    if (currentStack.length === 0) return null;
    
    const newStack = [...currentStack];
    newStack.pop();
    setStacks(new Map(stacks.set(activeTab.id, newStack)));
    
    return newStack.length > 0 ? newStack[newStack.length - 1] : null;
  };

  const canGoBack = (): boolean => {
    const currentStack = stacks.get(activeTab.id) || [];
    return currentStack.length > 0;
  };

  const getCurrentScreen = (): NavigationItem | null => {
    const currentStack = stacks.get(activeTab.id) || [];
    // Return the top of the stack, or null if stack is empty (showing root screen)
    return currentStack.length > 0 ? currentStack[currentStack.length - 1] : null;
  };

  const replace = (item: NavigationItem): void => {
    const currentStack = stacks.get(activeTab.id) || [];
    const newStack = currentStack.length > 0 
      ? [...currentStack.slice(0, -1), item]
      : [item];
    setStacks(new Map(stacks.set(activeTab.id, newStack)));
  };

  const clearStack = (): void => {
    setStacks(new Map(stacks.set(activeTab.id, [])));
  };

  const isOnHomeTab = (): boolean => {
    return activeTabIndex === 0;
  };

  const value: NavigationContextType = {
    tabs,
    activeTabIndex,
    activeTab,
    switchTab,
    setActiveTabById,
    navigate,
    goBack,
    canGoBack,
    getCurrentScreen,
    replace,
    clearStack,
    isOnHomeTab,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}