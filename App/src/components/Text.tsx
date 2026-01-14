import React from 'react';
import { Text } from 'react-native';

type TextProps = {
    children: React.ReactNode;
    className?: string;
};

export function Heading({ children, className }: TextProps) {
    return (
        <Text
            className={`text-3xl font-bold text-foreground leading-tight tracking-tight pt-4 pb-1 ${className ?? ''}`}
        >
            {children}
        </Text>
    );
}

export function SubHeading({ children, className }: TextProps) {
    return (
        <Text
            className={`text-base text-foreground/80 leading-snug ${className ?? ''}`}
        >
            {children}
        </Text>
    );
}