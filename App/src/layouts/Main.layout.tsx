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
            <ScrollView className={cn('relative flex-1 p-4', className)}>
                {children}
            </ScrollView>
        </View>
    )
}