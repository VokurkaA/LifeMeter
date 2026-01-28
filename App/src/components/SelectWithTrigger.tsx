import { Select, useSelect, useSelectAnimation, useThemeColor } from 'heroui-native';
import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Text } from '@/components/Text';

export type SelectWithTriggerOption = { value: string; label: string };
export type SelectWithTriggerProps = {
    options: SelectWithTriggerOption[];
    value?: SelectWithTriggerOption;
    initialValue?: SelectWithTriggerOption;
    onValueChange?: (value?: SelectWithTriggerOption) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    isDisabled?: boolean;
};

export function SelectWithTrigger({ options, value, initialValue, onValueChange, label, placeholder, className, isDisabled }: SelectWithTriggerProps) {
    const valueByKey = useMemo(() => {
        const map = new Map<string, SelectWithTriggerOption>();
        for (const o of options) map.set(o.value, o);
        return map;
    }, [options]);

    const [internalValue, setInternalValue] = useState<SelectWithTriggerOption | undefined>(() => initialValue);
    const selectedValue = value ?? internalValue;

    const Trigger = () => {
        const { progress } = useSelectAnimation();
        const { value: selected } = useSelect();
        const muted = useThemeColor('muted');
        return (
            <View className={`justify-center h-12 w-full px-3 shadow-md rounded-2xl shadow-black/5 ${isDisabled ? 'bg-field/50' : 'bg-field'}`}>
                <Text className={selected ? '' : 'text-muted'} style={isDisabled ? { color: muted } : undefined}>
                    {selected?.label ?? (placeholder ?? 'Select...')}
                </Text>
                <Animated.View
                    className="absolute right-3"
                    style={useAnimatedStyle(() => ({
                        transform: [{
                            rotate: `${interpolate(progress.value, [0, 1, 2], [0, -180, 0])}deg`,
                        },],
                    }))}
                >
                    <ChevronDown color={muted} size={18} />
                </Animated.View>
            </View>
        );
    };

    return (
        <View className={['gap-2', className].filter(Boolean).join(' ')}>
            {label && <Text className={isDisabled ? 'text-muted' : ''}>{label}</Text>}

            <Select
                value={selectedValue}
                onValueChange={(next: unknown) => {
                    const n = next as any;
                    const resolved = (n?.value != null ? valueByKey.get(String(n.value)) : undefined) ?? (next as SelectWithTriggerOption | undefined);

                    if (value === undefined) setInternalValue(resolved);
                    onValueChange?.(resolved);
                }}
                isDisabled={isDisabled}
            >
                <Select.Trigger isDisabled={isDisabled}>
                    <Trigger />
                </Select.Trigger>

                <Select.Portal>
                    <Select.Overlay />
                    <Select.Content width="trigger">
                        {options.map(opt => (<Select.Item key={opt.value} value={opt.value} label={opt.label} />))}
                    </Select.Content>
                </Select.Portal>
            </Select>
        </View>
    );
}