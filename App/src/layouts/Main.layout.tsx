import {ScrollView, View} from "react-native";
import TabNavigation from "@/components/TabNavigation";
import {ReactNode} from "react";
import Header from "@/components/Header";
import { cn } from "heroui-native";

interface MainLayoutProps {
    children?: ReactNode;
    className?: string;
}

export default function MainLayout({children, className}: MainLayoutProps) {
    return (
        <View className='flex-1 min-h-svh'>
            <Header/>
            <ScrollView className={cn('relative flex-1 p-4', className)}>
                {children}
            </ScrollView>
            <TabNavigation/>
        </View>
    )
}