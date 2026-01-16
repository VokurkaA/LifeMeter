import {ScrollView, View} from "react-native";
import {ReactNode} from "react";
import { cn } from "heroui-native";

interface MainLayoutProps {
    children?: ReactNode;
    className?: string;
}

export default function MainLayout({children, className}: MainLayoutProps) {
    return (
        <View className='flex-1 bg-background min-h-svh'>
            <ScrollView className={cn('relative flex-1', className)} contentContainerClassName='gap-4 p-4 pb-8'>
                {children}
            </ScrollView>
        </View>
    )
}