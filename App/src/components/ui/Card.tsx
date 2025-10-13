import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';
import React from "react";

function Card({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
    return (
        <View
            className={cn('rounded-2xl border border-border bg-card', className)}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
    return (
        <View
            className={cn('p-6', className)}
            {...props} />
    );
}

function CardTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
    return (
        <Text
            className={cn('text-xl font-semibold tracking-tight text-foreground', className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
    return (
        <Text
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />);
}

function CardContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
    return (
        <View
            className={cn('px-6 pb-6', className)}
            {...props} />
    );
}

function CardFooter({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
    return (
        <View
            className={cn('flex flex-row items-center px-6 pb-6', className)}
            {...props}
        />
    );
}

interface SimpleCardProps {
    className?: string;
    title?: string;
    description?: string;
    content?: string;
    footer?: string;
}

function SimpleCard({ className, title, description, content, footer, }: SimpleCardProps) {
    return (
        <Card className={className}>
            <CardHeader>
                {title && (<Text className="text-xl font-semibold tracking-tight text-foreground">
                    {title}
                </Text>)}
                {description && (<Text className="text-sm text-muted-foreground mt-1.5">{description}</Text>)}
            </CardHeader>
            {content && (<CardContent>
                <Text className="text-base text-foreground">{content}</Text>
            </CardContent>)}
            {footer && (<CardFooter>
                <Text className="text-sm text-muted-foreground">{footer}</Text>
            </CardFooter>)}
        </Card>
    );
}

export {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, SimpleCard
};

