import React from 'react';
import { Text as RnText } from 'react-native';
import {cn} from '@/lib/utils'
type TextProps = {
    children: React.ReactNode;
    className?: string;
};

export function Text({ children, className }: TextProps) {
    return (
        <RnText className={cn('text-foreground text-base', className)}>
            {children}
        </RnText>
    );
}

export function Muted({ children, className }: TextProps) {
    return (
        <Text className={cn('text-muted text-xs font-light', className)}>
            {children}
        </Text>
    );
}

export function H1({ children, className }: TextProps) {
    return (
        <Text className={cn('text-foreground font-semibold text-5xl', className)}>
            {children}
        </Text>
    );
}

export function H2({ children, className }: TextProps) {
    return (
        <Text
            className={cn('text-foreground font-semibold text-4xl ', className)}
        >
            {children}
        </Text>
    );
}

export function H3({ children, className }: TextProps) {
    return (
        <Text className={cn('text-muted font-semibold text-3xl', className)}>
            {children}
        </Text>
    );
}

export function Heading({ children, className }: TextProps) {
    return (
        <Text className={cn('text-foreground font-bold text-2xl', className)}>
            {children}
        </Text>
    );
}

export function SubHeading({ children, className }: TextProps) {
    return (
        <Text className={cn('text-muted text-base', className)}>
            {children}
        </Text>
    );
}