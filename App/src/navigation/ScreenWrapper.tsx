import {Button} from '@/components/ui/Button';
import {useNavigation} from '@/contexts/NavigationContext';
import React, {ReactNode} from 'react';
import {View} from 'react-native';

interface ScreenWrapperProps {
    children: ReactNode;
    showBackButton?: boolean;
}

/**
 * ScreenWrapper provides common screen functionality like back navigation.
 * Use this to wrap screens that need a back button.
 */
export function ScreenWrapper({children, showBackButton = true}: ScreenWrapperProps) {
    const {goBack, canGoBack} = useNavigation();

    return (<View className="flex-1">
            {showBackButton && canGoBack() && (<View className="p-4">
                    <Button label="Back" onPress={goBack} variant="ghost" size="sm"/>
                </View>)}
            <View className="flex-1">
                {children}
            </View>
        </View>);
}
