import {ScrollView, View} from "react-native";
import {ReactNode} from "react";
import { cn } from "heroui-native";

interface MainLayoutProps {
    children?: ReactNode;
    className?: string;
    scrollable?: boolean;
}

export default function MainLayout({children, className, scrollable = true}: MainLayoutProps) {
    if (!scrollable) {
        return (
            <View className={cn('flex-1 bg-background min-h-svh', className)}>
                {children}
            </View>
        );
    }

    return (
        <View className='flex-1 bg-background min-h-svh'>
            <ScrollView className={cn('relative flex-1', className)} contentContainerClassName='gap-4 p-4 pb-8' showsVerticalScrollIndicator={false}>
                {children}
            </ScrollView>
        </View>
    )
}