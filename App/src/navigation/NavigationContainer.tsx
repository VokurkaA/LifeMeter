import {useNavigation} from '@/contexts/NavigationContext';
import React from 'react';
import {View} from 'react-native';
import {getScreenComponent} from './ScreenRegistry';

interface NavigationContainerProps {
    rootScreenId: string;
}

/**
 * NavigationContainer handles rendering the appropriate screen based on the navigation stack.
 * If the stack is empty, it renders the root screen.
 * If there are screens on the stack, it renders the topmost screen.
 */
export function NavigationContainer({rootScreenId}: NavigationContainerProps) {
    const {getCurrentScreen} = useNavigation();
    const currentScreen = getCurrentScreen();

    // Determine which screen to render
    const screenId = currentScreen ? currentScreen.id : rootScreenId;
    const ScreenComponent = getScreenComponent(screenId);

    if (!ScreenComponent) {
        return null;
    }

    return (<View className="flex-1">
            <ScreenComponent/>
        </View>);
}
