import {View} from 'react-native';
import {useEffect, useMemo, useState} from 'react';
import {SelectWithTrigger, SelectWithTriggerOption} from '@/components/SelectWithTrigger';
import DateTimePicker from '@/components/DateTimePicker';
import {CalendarDaysIcon} from 'lucide-react-native';
import {useThemeColor} from 'heroui-native';
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


export default function BasicInfo({onSubmit, setNextEnabled, registerOnNext, initialData}: BasicInfoProps) {
    const sexOptions: SelectWithTriggerOption[] = [{label: 'Male', value: 'male'}, {label: 'Female', value: 'female'}];
    const unitOptions: SelectWithTriggerOption[] = [{
        label: 'Metric (m, kg)', value: 'metric'
    }, {label: 'Imperial (ft, lb)', value: 'imperial'}, {label: 'Mixed', value: 'mixed'}];
    const lengthUnitOptions: SelectWithTriggerOption[] = [{label: 'Centimeters (cm)', value: 'cm'}, {
        label: 'Feet (ft)', value: 'ft'
    }];
    const weightUnitOptions: SelectWithTriggerOption[] = [{
        label: 'Kilograms (kg)', value: 'kg'
    }, {label: 'Pounds (lbs)', value: 'lbs'}, {label: 'Stone (st)', value: 'st'}];

    const allOptions = [...sexOptions, ...unitOptions, ...lengthUnitOptions, ...weightUnitOptions,];
    const mutedColor = useThemeColor("muted");

    const [preferredUnit, setPreferredUnit] = useState<BasicInfoData['preferredUnit'] | undefined>(initialData?.preferredUnit);
    const [lengthUnit, setLengthUnit] = useState<BasicInfoData['lengthUnit'] | undefined>(initialData?.lengthUnit);
    const [weightUnit, setWeightUnit] = useState<BasicInfoData['weightUnit'] | undefined>(initialData?.weightUnit);
    const [sex, setSex] = useState<BasicInfoData['sex'] | undefined>(initialData?.sex);
    const [birthDate, setBirthDate] = useState<BasicInfoData['birthDate'] | undefined>(initialData?.birthDate);

    const optionByValue = useMemo(() => new Map<string, SelectWithTriggerOption>(allOptions.map(o => [o.value, o])), []);
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

            rightIcon={<CalendarDaysIcon color={mutedColor} size={18}/>}
        />
        <SelectWithTrigger
            label="Sex"
            value={findVal(sex)}
            onValueChange={(val) => setSex(val?.value as BasicInfoData['sex'])}
            placeholder="Enter your sex"
            options={sexOptions}
        />

        <SelectWithTrigger
            label="Unit type"
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
            placeholder="Your preferred unit type"
            options={unitOptions}
        />

        {preferredUnit === 'mixed' && (<View className="gap-4">
            <SelectWithTrigger
                label="Length unit"
                value={findVal(lengthUnit)}
                onValueChange={(val) => setLengthUnit(val?.value as BasicInfoData['lengthUnit'])}
                placeholder="Choose length unit"
                options={lengthUnitOptions}
            />
            <SelectWithTrigger
                label="Weight unit"
                value={findVal(weightUnit)}
                onValueChange={(val) => setWeightUnit(val?.value as BasicInfoData['weightUnit'])}
                placeholder="Choose weight unit"
                options={weightUnitOptions}
            />
        </View>)}
    </View>);
};