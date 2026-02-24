import { Avatar, Button, Chip, Dialog, ListGroup, PressableFeedback, Separator, Surface, useThemeColor } from "heroui-native";
import { useAuth } from "@/contexts/useAuth";
import { LogOutIcon, MoonIcon, SettingsIcon, SunIcon, UserIcon } from "lucide-react-native";
import { View } from 'react-native'
import { useStore } from "@/contexts/useStore";
import { H2, Muted, Text } from "@/components/Text";
import { Uniwind, useUniwind } from 'uniwind';

export default function Header() {
    const { user, session, signOut } = useAuth();
    const { userProfile, userGoals } = useStore();
    const { theme } = useUniwind()
    const mutedColor = useThemeColor('muted');
    const foregroundColor = useThemeColor('foreground');

    return (
        <View className="bg-background">
            <Surface className='flex flex-row items-center justify-between w-full px-6 rounded-t-none'>
                <View className='flex flex-row items-center gap-4'>
                    <H2>LifeMeter</H2>
                </View>
                <Dialog>
                    <Dialog.Trigger>
                        <Avatar animation="disable-all" size="sm" alt={user?.name ?? "User avatar"}>
                            {user?.image && (<Avatar.Image source={{ uri: user.image }} />)}
                            <Avatar.Fallback>
                                <UserIcon color={mutedColor} size={24} />
                            </Avatar.Fallback>
                        </Avatar>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content isSwipeable={false} className="relative flex items-center gap-2">
                            <Dialog.Title className="text-center text-base">{user?.email}</Dialog.Title>
                            <Dialog.Close className="absolute right-2 top-2" variant="ghost" />
                            <Avatar alt={user?.name ?? "User avatar"} className="h-22 aspect-square">
                                <Avatar.Image source={{ uri: user?.image ?? undefined }} />
                                <Avatar.Fallback>
                                    <UserIcon color={mutedColor} size={48} />
                                </Avatar.Fallback>
                            </Avatar>
                            <Dialog.Title>Hello, {user?.name}</Dialog.Title>
                            <Chip className="mx-auto" variant="soft" color={user?.role === "admin" ? "warning" : "accent"}>
                                <Chip.Label>{user?.role}</Chip.Label>
                            </Chip>
                            <ListGroup variant="secondary" className="w-full">
                                <PressableFeedback
                                    animation={false}
                                    onPress={() => Uniwind.setTheme(theme === 'light' ? 'dark' : 'light')}
                                >
                                    <PressableFeedback.Scale>
                                        <ListGroup.Item disabled>
                                            <ListGroup.ItemPrefix>
                                                {theme === 'light' ? <MoonIcon size={20} color={foregroundColor} /> : <SunIcon size={20} color={foregroundColor} />}
                                            </ListGroup.ItemPrefix>
                                            <ListGroup.ItemContent>
                                                <ListGroup.ItemTitle>Switch to {theme === 'light' ? 'dark' : 'light'} mode</ListGroup.ItemTitle>
                                            </ListGroup.ItemContent>
                                        </ListGroup.Item>
                                    </PressableFeedback.Scale>
                                    <PressableFeedback.Ripple />
                                </PressableFeedback>
                                <Separator />
                                <PressableFeedback
                                    animation={false}
                                    onPress={() => { signOut() }}
                                >
                                    <PressableFeedback.Scale>
                                        <ListGroup.Item disabled>
                                            <ListGroup.ItemPrefix>
                                                <LogOutIcon color={foregroundColor} size={20} />
                                            </ListGroup.ItemPrefix>
                                            <ListGroup.ItemContent>
                                                <ListGroup.ItemTitle>Sign out</ListGroup.ItemTitle>
                                            </ListGroup.ItemContent>
                                        </ListGroup.Item>
                                    </PressableFeedback.Scale>
                                    <PressableFeedback.Ripple />
                                </PressableFeedback>
                            </ListGroup>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog>
            </Surface>
        </View>
    )
}