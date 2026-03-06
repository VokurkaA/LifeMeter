import React from 'react';
import { Input } from 'heroui-native';

const SetInput = ({ value, onChange, onBlur, placeholder }: {
    value: string;
    onChange: (val: string) => void;
    onBlur: () => void;
    placeholder?: string;
}) => (
    <Input
        variant="secondary"
        className="flex-1"
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
    />
);

export default SetInput;
