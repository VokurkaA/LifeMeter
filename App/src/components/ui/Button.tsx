import { cva, type VariantProps } from 'class-variance-authority';
import { Text, TouchableOpacity } from 'react-native';

import { cn } from '@/lib/utils';
import React from "react";

const buttonVariants = cva('flex flex-row items-center justify-center rounded-xl', {
    variants: {
        variant: {
            default: 'bg-primary',
            secondary: 'bg-secondary',
            destructive: 'bg-destructive',
            ghost: 'bg-transparent',
            link: 'bg-transparent',
        }, size: {
            default: 'h-12 px-6', 
            sm: 'h-10 px-4', 
            lg: 'h-14 px-8',
        },
    }, defaultVariants: {
        variant: 'default', size: 'default',
    },
});

const buttonTextVariants = cva('text-center font-semibold', {
    variants: {
        variant: {
            default: 'text-primary-foreground',
            secondary: 'text-secondary-foreground',
            destructive: 'text-destructive-foreground',
            ghost: 'text-foreground',
            link: 'text-foreground underline',
        }, size: {
            default: 'text-base', 
            sm: 'text-sm', 
            lg: 'text-lg',
        },
    }, defaultVariants: {
        variant: 'default', size: 'default',
    },
});

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof TouchableOpacity>, VariantProps<typeof buttonVariants> {
    label: string;
    labelClasses?: string;
}

function Button({label, labelClasses, className, variant, size, ...props}: ButtonProps) {
    return (<TouchableOpacity className={cn(buttonVariants({variant, size, className}))} {...props}>
            <Text className={cn(buttonTextVariants({variant, size, className: labelClasses}))}>
                {label}
            </Text>
        </TouchableOpacity>);
}

export { Button, buttonTextVariants, buttonVariants };

