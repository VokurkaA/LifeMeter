import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { cn } from '@/lib/utils';

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof View> {
    label?: string;
    labelClasses?: string;
    checkboxClasses?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({
    label,
    labelClasses,
    checkboxClasses,
    className,
    checked: controlledChecked,
    defaultChecked = false,
    onCheckedChange,
    ...props
}: CheckboxProps) {
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : uncontrolledChecked;

    const toggleCheckbox = () => {
        const newChecked = !checked;
        if (!isControlled) {
            setUncontrolledChecked(newChecked);
        }
        onCheckedChange?.(newChecked);
    };

    return (
        <View
            className={cn('flex flex-row items-center gap-2', className)}
            {...props}
        >
            <TouchableOpacity
                onPress={toggleCheckbox}
                activeOpacity={1}
                className="flex flex-row items-center gap-2"
            >
                <View
                    className={cn(
                        'w-5 h-5 border-2 border-input rounded-md bg-background flex justify-center items-center',
                        {
                            'bg-primary border-primary': checked,
                        },
                        checkboxClasses
                    )}
                >
                    {checked && <Text className="text-xs font-bold leading-none text-primary-foreground">✓</Text>}
                </View>
                {label && (
                    <Text className={cn('text-foreground', labelClasses)}>{label}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

export { Checkbox };

