import { navigate } from "@/navigation/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import AppleIcon from "./icons/apple";
import ExerciseIcon from "./icons/exercise";
import HomeIcon from "./icons/home";
import NightIcon from "./icons/night";
import PlusIcon from "./icons/plus";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Text } from "./ui/Text";

export default function Footer() {
    const [open, setOpen] = useState(false);

    return (
        <View className="flex flex-row items-center justify-around h-16 p-4 bg-card rounded-t-3xl">
            <BottomTabIcon icon={<HomeIcon />} name="Home" showName={false} onPress={() => navigate('Home')} />
            <BottomTabIcon icon={<ExerciseIcon />} name="Training" showName={false} onPress={() => navigate('Training')} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <TouchableOpacity>
                        <View className="flex items-center justify-center h-24 rounded-full aspect-square bg-secondary">
                            <PlusIcon className="w-12 aspect-square text-foreground" />
                        </View>
                    </TouchableOpacity>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-56 p-2">
                    <View className="flex flex-col">
                        <TouchableOpacity
                            className="flex flex-row items-center gap-3 px-3 py-2 rounded-md"
                            onPress={() => { setOpen(false); navigate('Training'); }}
                        >
                            <Text>New training</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex flex-row items-center gap-3 px-3 py-2 rounded-md"
                            onPress={() => { setOpen(false); navigate('Nutrition'); }}
                        >
                            <Text>New meal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex flex-row items-center gap-3 px-3 py-2 rounded-md"
                            onPress={() => { setOpen(false); navigate('Sleep'); }}
                        >
                            <Text>New sleep</Text>
                        </TouchableOpacity>
                    </View>
                </PopoverContent>
            </Popover>
            <BottomTabIcon icon={<AppleIcon />} name="Nutrition" showName={false} onPress={() => navigate('Nutrition')} />
            <BottomTabIcon icon={<NightIcon />} name="Sleep" showName={false} onPress={() => navigate('Sleep')} />
        </View>
    );
}

const BottomTabIcon = ({icon, name, showName, onPress}: { icon: ReactNode, name: string, showName: boolean, onPress?: () => void }) => {
    return (
        <TouchableOpacity className="flex items-center justify-center" onPress={onPress}>
            {icon}
            {showName && <Text className="text-center">{name}</Text>}
        </TouchableOpacity>
    );
}
