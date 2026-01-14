import {Avatar, Button, Dialog, Surface, useThemeColor} from "heroui-native";
import {useAuth} from "@/contexts/useAuth";
import {TextAlignStart, UserIcon} from "lucide-react-native";
import {Pressable, Text, View} from 'react-native'
import { useStore } from "@/contexts/useStore";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    const {user, session, signOut} = useAuth(); 
    const {userProfile, userGoals} = useStore(); 
    const mutedColor = useThemeColor('muted');
    const backgroundColor = useThemeColor('background');

    return (
    <View className="bg-background">
    <Surface className='flex flex-row items-center justify-between w-full px-6 rounded-t-none'>
        <View className='flex flex-row items-center gap-4'>
            <Pressable className='flex items-center justify-center h-10 rounded-full aspect-square bg-field'>
                <TextAlignStart color={mutedColor} size={24}/>
            </Pressable>
            <Text className="text-3xl font-bold text-foreground">LifeMeter</Text>
        </View>
        <Dialog>
            <Dialog.Trigger>
                <Avatar animation="disable-all" size="sm" alt={user?.name ?? "User avatar"}>
                    {user?.image && (<Avatar.Image source={{uri: user.image}}/>)}
                    <Avatar.Fallback>
                        <UserIcon color={mutedColor} size={24}/>
                    </Avatar.Fallback>
                </Avatar>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay/>
                <Dialog.Content>
                    <View>
                        <Text className="mt-2 font-bold text-foreground">User</Text>
                        {user && Object.entries(user).map(([key, value]) => (
                            <View key={key} className="flex flex-row items-center justify-between pb-px">
                                <Text className="flex-1 text-xs text-muted">{key}</Text>
                                <Text className="text-xs flex-2 text-muted">{String(value)}</Text>
                            </View>
                        ))}
                        <Text className="mt-2 font-bold text-foreground">Session</Text>
                        {session && Object.entries(session).map(([key, value]) => (
                            <View key={key} className="flex flex-row items-center justify-between pb-px">
                                <Text className="flex-1 text-xs text-muted">{key}</Text>
                                <Text className="text-xs flex-2 text-muted">{String(value)}</Text>
                            </View>
                        ))}
                        <Text className="mt-2 font-bold text-foreground">UserProfile</Text>
                        {userProfile && Object.entries(userProfile).map(([key, value]) => (
                            <View key={key} className="flex flex-row items-center justify-between pb-px">
                                <Text className="flex-1 text-xs text-muted">{key}</Text>
                                <Text className="text-xs flex-2 text-muted">{String(value)}</Text>
                            </View>
                        ))}
                        <Text className="mt-2 font-bold text-foreground">UserGoal</Text>
                        {userGoals && Object.entries(userGoals).map(([key, value]) => (
                            <View key={key} className="flex flex-row items-center justify-between pb-px">
                                <Text className="flex-1 text-xs text-muted">{key}</Text>
                                <Text className="text-xs flex-2 text-muted">{String(value)}</Text>
                            </View>
                        ))}
                    </View>
                    <Button onPress={signOut} size="sm" variant="danger-soft" className="my-4">Sign out</Button>
                    <ThemeToggle />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    </Surface>
    </View>)
}