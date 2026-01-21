import React from 'react';
import { Text as RnText, TextProps as RnTextProps } from 'react-native';
import {cn} from '@/lib/utils'

type TextProps = RnTextProps & {
    children: React.ReactNode;
    className?: string;
};

export function Text({ children, className, ...props }: TextProps) {
    return (
        <RnText className={cn('text-foreground text-base', className)} {...props}>
            {children}
        </RnText>
    );
}

export function Muted({ children, className, ...props }: TextProps) {
    return (
        <Text className={cn('text-muted text-xs font-light', className)} {...props}>
            {children}
        </Text>
    );
}

export function H1({ children, className, ...props }: TextProps) {
    return (
        <Text className={cn('text-foreground font-semibold text-5xl', className)} {...props}>
            {children}
        </Text>
    );
}

export function H2({ children, className, ...props }: TextProps) {
    return (
        <Text
            className={cn('text-foreground font-semibold text-4xl ', className)}
            {...props}
        >
            {children}
        </Text>
    );
}

export function H3({ children, className, ...props }: TextProps) {
    return (
        <Text className={cn('text-muted font-semibold text-3xl', className)} {...props}>
            {children}
        </Text>
    );
}

export function Heading({ children, className, ...props }: TextProps) {
    return (
        <Text className={cn('text-foreground font-bold text-2xl', className)} {...props}>
            {children}
        </Text>
    );
}

export function SubHeading({ children, className, ...props }: TextProps) {
    return (
        <Text className={cn('text-muted text-base', className)} {...props}>
            {children}
        </Text>
    );
}
