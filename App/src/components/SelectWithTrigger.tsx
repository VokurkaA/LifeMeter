import Feather from '@expo/vector-icons/Feather';
import { Select, Separator, useSelect } from 'heroui-native';
import React, { useEffect, useMemo, useState, type FC } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { Text } from '@/components/Text';

const StyledFeather = withUniwind(Feather);
const StyleAnimatedView = withUniwind(Animated.View);

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

    listLabel?: string; 
    contentOffset?: number;
};

const AnimatedTrigger: FC<{
    placeholder: string;
    isDisabled?: boolean;
}> = ({ placeholder, isDisabled }) => {
    const { isOpen } = useSelect();
    const animatedValue = useSharedValue(isOpen ? 1 : 0);

    useEffect(() => {
        animatedValue.value = withTiming(isOpen ? 1 : 0, {
            duration: 200,
            easing: Easing.out(Easing.ease),
        });
    }, [isOpen, animatedValue]);

    const rContainerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(animatedValue.value, [0, 1], [0, 1]);
        return { opacity };
    });

    const rChevronStyle = useAnimatedStyle(() => {
        const rotate = interpolate(animatedValue.value, [0, 1], [0, -180]);
        return { transform: [{ rotate: `${rotate}deg` }] };
    });

    return (
        <View
            className={[
                'bg-surface h-12 w-full px-3 rounded-2xl justify-center shadow-md shadow-black/5',
                isDisabled ? 'opacity-60' : '',
            ].join(' ')}
            style={styles.borderCurve}
        >
            <StyleAnimatedView
                style={[rContainerStyle, styles.borderCurve]}
                className="absolute -inset-1 border-[2.5px] border-accent rounded-[18px] pointer-events-none"
            />

            <Select.Value placeholder={placeholder} />

            <StyleAnimatedView style={rChevronStyle} className="absolute right-3">
                <StyledFeather name="chevron-down" size={18} className="text-muted" />
            </StyleAnimatedView>
        </View>
    );
};

export function SelectWithTrigger({
    options,
    value,
    initialValue,
    onValueChange,
    label,
    placeholder,
    className,
    isDisabled,
    listLabel,
    contentOffset,
}: SelectWithTriggerProps) {
    const valueByKey = useMemo(() => {
        const map = new Map<string, SelectWithTriggerOption>();
        for (const o of options) map.set(o.value, o);
        return map;
    }, [options]);

    const [internalValue, setInternalValue] = useState<SelectWithTriggerOption | undefined>(() => initialValue);
    const selectedValue = value ?? internalValue;

    const resolvedPlaceholder = placeholder ?? 'Select...';

    return (
        <View className={['gap-2', className].filter(Boolean).join(' ')}>
            {label && <Text className={isDisabled ? 'text-muted' : ''}>{label}</Text>}

            <Select
                value={selectedValue}
                onValueChange={(next: unknown) => {
                    const n = next as any;
                    const resolved =
                        (n?.value != null ? valueByKey.get(String(n.value)) : undefined) ??
                        (next as SelectWithTriggerOption | undefined);

                    if (value === undefined) setInternalValue(resolved);
                    onValueChange?.(resolved);
                }}
                isDisabled={isDisabled}
            >
                <Select.Trigger isDisabled={isDisabled}>
                    <AnimatedTrigger placeholder={resolvedPlaceholder} isDisabled={isDisabled} />
                </Select.Trigger>

                <Select.Portal>
                    <Select.Overlay />
                    <Select.Content
                        width="trigger"
                        presentation="popover"
                        offset={contentOffset}
                    >
                        {listLabel && <Select.ListLabel className="mb-2">{listLabel}</Select.ListLabel>}

                        {options.map((opt, index) => (
                            <React.Fragment key={opt.value}>
                                <Select.Item value={opt.value} label={opt.label} />
                                {index < options.length - 1 && <Separator />}
                            </React.Fragment>
                        ))}
                    </Select.Content>
                </Select.Portal>
            </Select>
        </View>
    );
}

const styles = StyleSheet.create({
    borderCurve: {
        borderCurve: 'continuous',
    },
});