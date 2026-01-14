import {navigate} from '@/navigation/navigate';
import {useNavigationState} from '@react-navigation/native';
import {Popover, Surface, useThemeColor} from 'heroui-native';
import {AppleIcon, DumbbellIcon, HomeIcon, MoonStarIcon, Plus} from 'lucide-react-native';
import React, {ReactNode} from 'react';
import {Pressable, Text, View} from 'react-native';

interface TabNavigationProps {
    showTabText?: boolean;
}

interface TabIconProps {
    icon: ReactNode;
    name: string;
    showName: boolean;
    active?: boolean;
    onPress?: () => void;
}

export default function TabNavigation({showTabText = true}: TabNavigationProps) {
    const routes = useNavigationState((state) => state?.routes);
    const index = useNavigationState((state) => state?.index ?? 0);
    const currentRoute = routes?.[index]?.name;

    const activeColor = useThemeColor('foreground');
    const inactiveColor = useThemeColor('muted')

    return (<View>
        <Surface className="flex flex-row items-start justify-between w-full h-20 px-8 rounded-b-none">
            <TabIcon
                icon={<HomeIcon/>}
                name="Home"
                showName={showTabText}
                active={currentRoute === 'Home'}
                onPress={() => navigate('Home')}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
            />
            <TabIcon
                icon={<DumbbellIcon/>}
                name="Training"
                showName={showTabText}
                active={currentRoute === 'Training'}
                onPress={() => navigate('Training')}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
            />

            <View className='mx-8'/>

            <TabIcon
                icon={<AppleIcon/>}
                name="Nutrition"
                showName={showTabText}
                active={currentRoute === 'Nutrition'}
                onPress={() => navigate('Nutrition')}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
            />
            <TabIcon
                icon={<MoonStarIcon/>}
                name="Sleep"
                showName={showTabText}
                active={currentRoute === 'Sleep'}
                onPress={() => navigate('Sleep')}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
            />
        </Surface>

        <PlusActionPopover/>
    </View>)
}

function TabIcon({icon, name, showName, active, onPress, activeColor, inactiveColor,}: TabIconProps & {
    activeColor: string; inactiveColor: string
}) {

    const color = active ? activeColor : inactiveColor;
    const styledIcon = React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{
        color?: string; size?: number; strokeWidth?: number;
    }>, {
        color: color, size: 28, strokeWidth: active ? 2.5 : 2,
    }) : icon;

    return (<Pressable onPress={onPress} className="items-center justify-center gap-1">
        {styledIcon}
        {showName && (<Text className={`${active ? 'text-foreground' : 'text-muted'} text-xs`}>{name}</Text>)}
    </Pressable>);
}

function PlusActionPopover() {
    const iconColor = useThemeColor('foreground');

    return (<Popover>
        <Popover.Trigger asChild>
            <Pressable className="absolute bottom-0 translate-x-1/2 -translate-y-2 right-1/2">
                <View
                    className="items-center justify-center h-20 rounded-full aspect-square bg-field">
                    <Plus color={iconColor} size={50} strokeWidth={1.5}/>
                </View>
            </Pressable>
        </Popover.Trigger>

        <Popover.Portal>
            <Popover.Overlay/>
            <Popover.Content placement="top" className='bg-surface'>
                <View className='flex flex-col gap-6 p-4'>
                    <Pressable className='flex flex-row items-center gap-4'>
                        <Text className='text-foreground'>Add a workout</Text>
                        <DumbbellIcon size={32} color={iconColor}/>
                    </Pressable>
                    <Pressable className='flex flex-row items-center gap-4'>
                        <Text className='text-foreground'>Log nutrition</Text>
                        <AppleIcon size={32} color={iconColor}/>
                    </Pressable>
                    <Pressable className='flex flex-row items-center gap-4'>
                        <Text className='text-foreground'>Track sleep</Text>
                        <MoonStarIcon size={32} color={iconColor}/>
                    </Pressable>
                </View>
            </Popover.Content>
        </Popover.Portal>
    </Popover>);
}