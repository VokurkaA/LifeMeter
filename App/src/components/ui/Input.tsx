import React, { forwardRef } from 'react';
import { TextInput, View } from 'react-native';
import { Text } from './Text';

import { cn } from '@/lib/utils';

export interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
    label?: string;
    labelClasses?: string;
    inputClasses?: string;
    placeholderTextColor?: string;
}

const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>((
    { className, label, labelClasses, inputClasses, placeholderTextColor, ...props }, ref) => (
    <View className={cn('flex flex-col gap-2', className)}>
        {label && <Text className={cn('text-sm font-medium text-foreground', labelClasses)}>{label}</Text>}
        <TextInput
            ref={ref}
            className={cn('text-foreground bg-background border border-input py-3 px-4 rounded-xl placeholder:text-muted-foreground', inputClasses)}
            placeholderTextColor={placeholderTextColor}
            {...props}
        />
    </View>));

Input.displayName = 'Input';

export { Input };
