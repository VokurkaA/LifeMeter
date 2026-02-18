import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { cn } from "@/lib/utils";
import { PressableFeedback, Separator } from 'heroui-native';
import { Text } from "@/components/Text";

interface ButtonGroupItemProps extends ViewProps {
    children: React.ReactNode;
    icon?: React.ReactNode;
    endContent?: React.ReactNode;
    onPress?: () => void;
    className?: string;
}

const ButtonGroupItem = ({
    children,
    icon,
    endContent,
    className,
    onPress,
    ...props
}: ButtonGroupItemProps) => {
    return (
        <PressableFeedback
            isAnimatedStyleActive={false}
            onPress={onPress}
            className={cn("flex-row items-center justify-between p-4", className)}
            {...props}
        >
            <PressableFeedback.Highlight />
            <View className="flex-row items-center gap-4">
                {icon}
                <Text>{children}</Text>
            </View>

            {endContent && (
                <View className="flex-row items-center">
                    {endContent}
                </View>
            )}
        </PressableFeedback>
    );
};

interface ButtonGroupProps {
    children: React.ReactNode;
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}

const ButtonGroupMain = ({
    children,
    orientation = 'vertical',
    className
}: ButtonGroupProps) => {
    const arrayChildren = React.Children.toArray(children);

    return (
        <View
            className={cn(
                `flex overflow-hidden rounded-2xl border border-border bg-inherit`,
                orientation === 'horizontal' ? 'flex-row h-full' : 'flex-col w-full',
                className
            )}
        >
            {arrayChildren.map((child, index) => (
                <React.Fragment key={index}>
                    {child}
                    {index < arrayChildren.length - 1 && (
                        <Separator orientation={orientation === 'vertical' ? 'horizontal' : 'vertical'} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );
};

export const ButtonGroup = Object.assign(ButtonGroupMain, {
    Item: ButtonGroupItem,
});