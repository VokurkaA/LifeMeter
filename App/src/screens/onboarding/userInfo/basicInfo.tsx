import { View } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Label, Select, Separator, useThemeColor } from 'heroui-native';
import DateTimePicker from '@/components/DateTimePicker';
import { CalendarDaysIcon } from 'lucide-react-native';
import { formatDate } from '@/lib/dateTime';

export interface BasicInfoData {
    preferredUnit: 'metric' | 'imperial' | 'mixed';
    lengthUnit: 'cm' | 'ft';
    weightUnit: 'kg' | 'lbs' | 'st';
    sex: 'male' | 'female';
    birthDate: Date;
}

interface BasicInfoProps {
    onSubmit: (data: BasicInfoData) => void;
    setNextEnabled: (enabled: boolean) => void;
    registerOnNext: (onNext: null | (() => void)) => void;
    initialData?: BasicInfoData;
}

type SelectOption = { label: string; value: string };

export default function BasicInfo({ onSubmit, setNextEnabled, registerOnNext, initialData }: BasicInfoProps) {
    const sexOptions: SelectOption[] = [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }];
    const unitOptions: SelectOption[] = [{
        label: 'Metric (m, kg)', value: 'metric'
    }, { label: 'Imperial (ft, lb)', value: 'imperial' }, { label: 'Mixed', value: 'mixed' }];
    const lengthUnitOptions: SelectOption[] = [{ label: 'Centimeters (cm)', value: 'cm' }, {
        label: 'Feet (ft)', value: 'ft'
    }];
    const weightUnitOptions: SelectOption[] = [{
        label: 'Kilograms (kg)', value: 'kg'
    }, { label: 'Pounds (lbs)', value: 'lbs' }, { label: 'Stone (st)', value: 'st' }];

    const allOptions = [...sexOptions, ...unitOptions, ...lengthUnitOptions, ...weightUnitOptions,];
    const mutedColor = useThemeColor("muted");

    const [preferredUnit, setPreferredUnit] = useState<BasicInfoData['preferredUnit'] | undefined>(initialData?.preferredUnit);
    const [lengthUnit, setLengthUnit] = useState<BasicInfoData['lengthUnit'] | undefined>(initialData?.lengthUnit);
    const [weightUnit, setWeightUnit] = useState<BasicInfoData['weightUnit'] | undefined>(initialData?.weightUnit);
    const [sex, setSex] = useState<BasicInfoData['sex'] | undefined>(initialData?.sex);
    const [birthDate, setBirthDate] = useState<BasicInfoData['birthDate'] | undefined>(initialData?.birthDate);

    const optionByValue = useMemo(() => new Map<string, SelectOption>(allOptions.map(o => [o.value, o])), []);
    const findVal = (val?: string) => (val ? optionByValue.get(val) : undefined);

    const isValidBirthDate = useMemo(() => {
        if (!birthDate) return false;

        const today = new Date();
        if (birthDate.getTime() > today.getTime()) return false;

        const cutoff = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());

        return birthDate.getTime() <= cutoff.getTime();
    }, [birthDate]);

    const isValid: boolean = useMemo(() => {
        if (!birthDate) return false;
        return Boolean(sex && preferredUnit && lengthUnit && weightUnit && isValidBirthDate);
    }, [sex, preferredUnit, lengthUnit, weightUnit, birthDate, isValidBirthDate]);

    useEffect(() => {
        setNextEnabled(isValid);

        if (!isValid) {
            registerOnNext(null);
            return;
        }

        registerOnNext(() => {
            onSubmit({
                preferredUnit, lengthUnit, weightUnit, sex, birthDate,
            } as BasicInfoData);
        });

        return () => registerOnNext(null);
    }, [isValid, preferredUnit, lengthUnit, weightUnit, sex, birthDate, onSubmit, setNextEnabled, registerOnNext,]);

    return (<View className="gap-4">
        <DateTimePicker
            label='Birth date'
            placeholder='Enter your date of birth'
            value={birthDate}
            onValueChange={setBirthDate}
            minimumDate={new Date(1920, 0, 1)}
            maximumDate={new Date()}
            mode='date'
            display='spinner'
            formatValue={formatDate}

            isInvalid={birthDate ? !isValidBirthDate : false}
            errorMessage='Invalid birth date'
            description='You must be at least 12 years old to sign up.'

            rightIcon={<CalendarDaysIcon color={mutedColor} size={18} />}
        />

        <Select
            value={findVal(sex)}
            onValueChange={(val) => setSex(val?.value as BasicInfoData['sex'])}
        >
            <Label>Sex</Label>
            <Select.Trigger>
                <Select.Value placeholder="Enter your sex" />
                <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
                <Select.Overlay />
                <Select.Content presentation="popover" width="trigger">
                    {sexOptions.map((opt, index) => (
                        <React.Fragment key={opt.value}>
                            <Select.Item value={opt.value} label={opt.label}>
                                <Select.ItemLabel />
                                <Select.ItemIndicator />
                            </Select.Item>
                            {index < sexOptions.length - 1 && <Separator />}
                        </React.Fragment>
                    ))}
                </Select.Content>
            </Select.Portal>
        </Select>

        <Select
            value={findVal(preferredUnit)}
            onValueChange={(value) => {
                setPreferredUnit(value?.value as BasicInfoData['preferredUnit']);

                if (value?.value === 'mixed') {
                    setLengthUnit(undefined);
                    setWeightUnit(undefined);
                } else if (value?.value === 'metric') {
                    setLengthUnit('cm');
                    setWeightUnit('kg');
                } else if (value?.value === 'imperial') {
                    setLengthUnit('ft');
                    setWeightUnit('lbs');
                }
            }}
        >
            <Label>Unit type</Label>
            <Select.Trigger>
                <Select.Value placeholder="Your preferred unit type" />
                <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
                <Select.Overlay />
                <Select.Content presentation="popover" width="trigger">
                    {unitOptions.map((opt, index) => (
                        <React.Fragment key={opt.value}>
                            <Select.Item value={opt.value} label={opt.label}>
                                <Select.ItemLabel />
                                <Select.ItemIndicator />
                            </Select.Item>
                            {index < unitOptions.length - 1 && <Separator />}
                        </React.Fragment>
                    ))}
                </Select.Content>
            </Select.Portal>
        </Select>

        {preferredUnit === 'mixed' && (<View className="gap-4">
            <Select
                value={findVal(lengthUnit)}
                onValueChange={(val) => setLengthUnit(val?.value as BasicInfoData['lengthUnit'])}
            >
                <Label>Length unit</Label>
                <Select.Trigger>
                    <Select.Value placeholder="Choose length unit" />
                    <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Overlay />
                    <Select.Content presentation="popover" width="trigger">
                        {lengthUnitOptions.map((opt, index) => (
                            <React.Fragment key={opt.value}>
                                <Select.Item value={opt.value} label={opt.label}>
                                    <Select.ItemLabel />
                                    <Select.ItemIndicator />
                                </Select.Item>
                                {index < lengthUnitOptions.length - 1 && <Separator />}
                            </React.Fragment>
                        ))}
                    </Select.Content>
                </Select.Portal>
            </Select>

            <Select
                value={findVal(weightUnit)}
                onValueChange={(val) => setWeightUnit(val?.value as BasicInfoData['weightUnit'])}
            >
                <Label>Weight unit</Label>
                <Select.Trigger>
                    <Select.Value placeholder="Choose weight unit" />
                    <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Overlay />
                    <Select.Content presentation="popover" width="trigger">
                        {weightUnitOptions.map((opt, index) => (
                            <React.Fragment key={opt.value}>
                                <Select.Item value={opt.value} label={opt.label}>
                                    <Select.ItemLabel />
                                    <Select.ItemIndicator />
                                </Select.Item>
                                {index < weightUnitOptions.length - 1 && <Separator />}
                            </React.Fragment>
                        ))}
                    </Select.Content>
                </Select.Portal>
            </Select>
        </View>)}
    </View>);
}