// TODO: Replace with heroui-native DateTimePicker when available

import RnDateTimePicker, {type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {FieldError} from 'heroui-native';
import {type ReactNode, useMemo, useState} from 'react';
import {Platform, Pressable, View} from 'react-native';
import {Text} from '@/components/Text';

export type DatePickerWithTriggerProps = {
    value?: Date;
    onValueChange?: (date?: Date) => void;
    label?: string;
    placeholder?: string;
    minimumDate?: Date;
    maximumDate?: Date;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'compact' | 'inline';
    formatValue?: (date: Date) => string;
    isDisabled?: boolean;
    description?: string;
    errorMessage?: string;
    isInvalid?: boolean;

    rightIcon?: ReactNode;
    rightIconOnPress?: () => void;

    variant?: 'primary' | 'secondary';
};

const defaultFormatValue = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export default function DateTimePicker({
                                           value,
                                           onValueChange,
                                           label,
                                           placeholder = 'Select...',
                                           minimumDate,
                                           maximumDate,
                                           mode = 'date',
                                           display = 'default',
                                           formatValue = defaultFormatValue,
                                           isDisabled,
                                           description,
                                           errorMessage,
                                           isInvalid,
                                           rightIcon,
                                           rightIconOnPress,
                                           variant = 'primary',
                                       }: DatePickerWithTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const formatted = useMemo(() => (value ? formatValue(value) : ''), [value, formatValue]);

    const handleChange = (event: DateTimePickerEvent, date?: Date) => {
        if (event.type === 'set') {
            onValueChange?.(date);
        }
        if (Platform.OS === 'android' || display !== 'inline') {
            setIsOpen(false);
        }
    };

    const isRightIconDisabled = !!isDisabled || !rightIconOnPress;
    const backgroundColor = isDisabled ? 'bg-surface' : variant === 'primary' ? 'bg-field' : 'bg-default';

    return (<View className="gap-2">
        {label && <Text className={isDisabled ? 'text-muted' : ''}>{label}</Text>}

        <Pressable
            disabled={isDisabled}
            onPress={() => setIsOpen(true)}
            accessibilityRole="button"
            accessibilityState={{disabled: !!isDisabled}}
        >
            <View
                className={`${backgroundColor} flex-row items-center justify-between w-full h-12 px-3 shadow-md rounded-2xl shadow-black/5`}
            >
                <Text className={`${!value && 'text-muted'} text-sm flex-1`}>
                    {value ? formatted : placeholder}
                </Text>

                {rightIcon ? (<Pressable
                    disabled={isRightIconDisabled}
                    onPress={rightIconOnPress}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Right icon"
                    accessibilityState={{disabled: isRightIconDisabled}}
                >
                    <View>
                        {rightIcon}
                    </View>
                </Pressable>) : null}
            </View>
        </Pressable>

        <FieldError isInvalid={isInvalid}>
            <Text className='text-danger'>{errorMessage}</Text>
        </FieldError>
        {description && !isInvalid && <Text className="text-muted">{description}</Text>}

        {isOpen && (<RnDateTimePicker
            display={display as any}
            value={value ?? new Date()}
            mode={mode as any}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
        />)}
    </View>);
}