import React, {ReactNode, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BottomTabBarProps, createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Popover, PressableFeedback, Surface, useThemeColor} from 'heroui-native';
import {AppleIcon, DumbbellIcon, HomeIcon, MoonStarIcon, Plus} from 'lucide-react-native';
import Animated, {Easing, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import HomeScreen from '@/screens/app/Home.screen';
import TrainingScreen from '@/screens/app/Training.screen';
import NutritionScreen from '@/screens/app/nutrition/Index.screen';
import SleepScreen from '@/screens/app/sleep/Index.screen';
import {TabParamList} from '@/types/types';
import Header from '@/components/Header';
import {Muted, Text} from '@/components/Text';
import {BlurView} from 'expo-blur';

const Tab = createBottomTabNavigator<TabParamList>();

export default function AppTabs() {
    const backgroundColor = useThemeColor('background');

    return (<Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
            headerShown: true, header: () => <Header/>, sceneStyle: {backgroundColor}, lazy: false, freezeOnBlur: true,
        }}
    >
        <Tab.Screen name="Home" component={HomeScreen}/>
        <Tab.Screen name="Training" component={TrainingScreen}/>
        <Tab.Screen name="Nutrition" component={NutritionScreen}/>
        <Tab.Screen name="Sleep" component={SleepScreen}/>
    </Tab.Navigator>);
}

function CustomTabBar({state, descriptors, navigation}: BottomTabBarProps) {
    const activeColor = useThemeColor('foreground');
    const inactiveColor = useThemeColor('muted');
    const backgroundColor = useThemeColor('background');
    const showTabText = true;

    return (<View style={{backgroundColor}}>
        <Surface className="flex flex-row items-start justify-between w-full h-20 px-8 rounded-b-none pb-4">
            {/* Home */}
            <TabIcon
                icon={<HomeIcon/>}
                name="Home"
                showName={showTabText}
                active={state.index === 0}
                onPress={() => navigation.navigate('Home')}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
            />

            {/* Training */}
            <TabIcon
                icon={<DumbbellIcon/>}
                name="Training"
                showName={showTabText}
                active={state.index === 1}
                onPress={() => navigation.navigate('Training')}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
            />

            {/* Spacer for FAB */}
            <View className='mx-8'/>

            {/* Nutrition */}
            <TabIcon
                icon={<AppleIcon/>}
                name="Nutrition"
                showName={showTabText}
                active={state.index === 2}
                onPress={() => navigation.navigate('Nutrition')}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
            />

            {/* Sleep */}
            <TabIcon
                icon={<MoonStarIcon/>}
                name="Sleep"
                showName={showTabText}
                active={state.index === 3}
                onPress={() => navigation.navigate('Sleep')}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
            />
        </Surface>

        <PlusActionPopover/>
    </View>);
}

interface TabIconProps {
    icon: ReactNode;
    name: string;
    showName: boolean;
    active: boolean;
    onPress: () => void;
    activeColor: string;
    inactiveColor: string;
}

function TabIcon({icon, name, showName, active, onPress, activeColor, inactiveColor}: TabIconProps) {
    const color = active ? activeColor : inactiveColor;
    const styledIcon = React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{
        color?: string; size?: number; strokeWidth?: number
    }>, {
        color: color, size: 28, strokeWidth: active ? 2.5 : 2,
    }) : icon;

    return (<Pressable onPress={onPress} className="items-center justify-center gap-1 mt-3">
        {styledIcon}
        {showName && (<Muted className={`${active && 'text-foreground'} text-xs`}>{name}</Muted>)}
    </Pressable>);
}

function PlusActionPopover() {
    const iconColor = useThemeColor('foreground');
    const [isOpen, setIsOpen] = useState(false);

    const rotationDeg = useSharedValue(0);

    const rIconStyle = useAnimatedStyle(() => ({
        transform: [{rotate: `${rotationDeg.value}deg`}],
    }));

    const handleOpenChange = (open: boolean) => {
        if (open === isOpen) return;

        setIsOpen(open);
        rotationDeg.value = withTiming(open ? 45 : 0, {
            duration: 200,
            easing: Easing.out(Easing.ease),
        });
    };

    const openPopover = () => handleOpenChange(true);
    const closePopover = () => handleOpenChange(false);

    return (
        <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
            <Popover.Trigger asChild>
                <PressableFeedback
                    className="absolute bottom-2 w-20 h-20 items-center justify-center bg-border rounded-full"
                    style={{left: '50%', marginLeft: -40}}
                    onPressIn={openPopover}
                    onPress={openPopover}  
                >
                    <Animated.View style={rIconStyle}>
                        <Plus color={iconColor} size={50} strokeWidth={1.5}/>
                    </Animated.View>
                </PressableFeedback>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Overlay className="bg-transparent"/>

                {isOpen && (
                    <BlurView
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                        tint="default"
                        intensity={1}
                        experimentalBlurMethod="dimezisBlurView"
                    />
                )}

                <Popover.Content placement="top" presentation="popover" className="bg-surface">
                    <View className="flex flex-col gap-6 p-4">
                        <Pressable className="flex flex-row items-center gap-4" onPress={closePopover}>
                            <Text>Add a workout</Text>
                            <DumbbellIcon size={32} color={iconColor}/>
                        </Pressable>

                        <Pressable className="flex flex-row items-center gap-4" onPress={closePopover}>
                            <Text>Log nutrition</Text>
                            <AppleIcon size={32} color={iconColor}/>
                        </Pressable>

                        <Pressable className="flex flex-row items-center gap-4" onPress={closePopover}>
                            <Text>Track sleep</Text>
                            <MoonStarIcon size={32} color={iconColor}/>
                        </Pressable>
                    </View>
                </Popover.Content>
            </Popover.Portal>
        </Popover>
    );
}
