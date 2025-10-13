import { Circle, CircleDot } from 'lucide-react-native';
import React, { createContext, useContext, useState } from 'react';
import { Text, TouchableOpacity, useColorScheme } from 'react-native';

import { cn } from '@/lib/utils';
import { theme } from '@/styles/theme';

interface RadioGroupContextType {
    value: string;
    setValue: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

interface RadioGroupProps {
    defaultValue: string;
    children: React.ReactNode;
}

function RadioGroup({defaultValue, children}: RadioGroupProps) {
    const [value, setValue] = useState<string>(defaultValue);

    return (<RadioGroupContext.Provider value={{value, setValue}}>
            {children}
        </RadioGroupContext.Provider>);
}

interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
    value: string;
    label?: string;
    labelClasses?: string;
}

function RadioGroupItem({
                            value, className, label, labelClasses, ...props
                        }: RadioGroupItemProps) {
    const context = useContext(RadioGroupContext);
    if (!context) {
        throw new Error('RadioGroupItem must be used within a RadioGroup');
    }
    const {value: selectedValue, setValue} = context;

    const colorScheme = useColorScheme();
    const currentTheme = colorScheme === 'dark' ? theme.dark : theme.light;

    return (<TouchableOpacity
            onPress={() => setValue(value)}
            className={cn('flex flex-row items-center gap-2.5', className)}
            {...props}
        >
            {selectedValue === value ? (<CircleDot size={20} color={currentTheme.foreground}/>) : (
                <Circle size={20} color={currentTheme.foreground}/>)}
            {label && (<Text className={cn('text-foreground', labelClasses)}>{label}</Text>)}
        </TouchableOpacity>);
}

interface RadioGroupLabelProps extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
    value: string;
}

function RadioGroupLabel({value, className, ...props}: RadioGroupLabelProps) {
    const context = useContext(RadioGroupContext);
    if (!context) {
        throw new Error('RadioGroupLabel must be used within a RadioGroup');
    }
    const {setValue} = context;

    return (<TouchableOpacity
            className={className}
            onPress={() => setValue(value)}
            {...props}
        />);
}

export { RadioGroup, RadioGroupItem, RadioGroupLabel };

