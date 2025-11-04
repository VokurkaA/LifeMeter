import { cva, type VariantProps } from 'class-variance-authority';
import { Text as RNText } from 'react-native';

import { cn } from '@/lib/utils';
import React from "react";

const textVariants = cva('text-foreground', {
    variants: {
        variant: {
            default: 'text-base',
            h1: 'text-3xl font-semibold tracking-tight',
            h2: 'text-2xl font-semibold tracking-tight',
            h3: 'text-xl font-semibold tracking-tight',
            muted: 'text-sm text-muted-foreground',
            small: 'text-xs font-medium',
        },
    }, defaultVariants: {
        variant: 'default',
    },
});

export interface TextProps extends React.ComponentPropsWithoutRef<typeof RNText>, VariantProps<typeof textVariants> {
}

function Text({className, variant, ...props}: TextProps) {
    return (<RNText
        className={cn(textVariants({variant, className}))}
        {...props}
    />);
}

function H1({className, ...props}: React.ComponentPropsWithoutRef<typeof RNText>) {
    return <Text variant="h1" className={className} {...props} />;
}

function H2({className, ...props}: React.ComponentPropsWithoutRef<typeof RNText>) {
    return <Text variant="h2" className={className} {...props} />;
}

function H3({className, ...props}: React.ComponentPropsWithoutRef<typeof RNText>) {
    return <Text variant="h3" className={className} {...props} />;
}

export { H1, H2, H3, Text, textVariants };