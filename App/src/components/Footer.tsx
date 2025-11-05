import { navigate } from '@/navigation/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import AppleIcon from './icons/apple';
import ExerciseIcon from './icons/exercise';
import HomeIcon from './icons/home';
import NightIcon from './icons/night';
import PlusIcon from './icons/plus';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { Text } from './ui/Text';

export default function Footer({
  current,
  showName = false,
}: {
  current?: string;
  showName?: boolean;
}) {
  return (
    <View className="relative flex min-h-16 flex-row items-center justify-between rounded-t-2xl bg-card px-4">
      <BottomTabIcon
        icon={
          <HomeIcon
            className={`aspect-square w-6 text-${current === 'Home' ? 'primary' : 'foreground'}`}
            fill="currentColor"
          />
        }
        name="Home"
        onPress={() => navigate('Home')}
        showName={showName}
      />

      <BottomTabIcon
        icon={
          <ExerciseIcon
            className={`mr-4 aspect-square w-6 text-${current === 'Training' ? 'primary' : 'foreground'}`}
            fill="currentColor"
          />
        }
        name="Training"
        onPress={() => navigate('Training')}
        showName={showName}
      />

      <View className="flex-1" />

      <BottomTabIcon
        icon={
          <AppleIcon
            className={`ml-4 aspect-square w-6 text-${current === 'Nutrition' ? 'primary' : 'foreground'}`}
            fill="none"
            stroke="currentColor"
          />
        }
        name="Nutrition"
        onPress={() => navigate('Nutrition')}
        showName={showName}
      />
      <BottomTabIcon
        icon={
          <NightIcon
            className={`aspect-square w-6 text-${current === 'Sleep' ? 'primary' : 'foreground'}`}
            fill="currentColor"
          />
        }
        name="Sleep"
        onPress={() => navigate('Sleep')}
        showName={showName}
      />
      <TrackPopover />
    </View>
  );
}

const BottomTabIcon = ({
  icon,
  name,
  showName,
  onPress,
}: {
  icon: ReactNode;
  name: string;
  showName: boolean;
  active?: boolean;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      className="flex-1 items-center justify-center py-2 active:opacity-80"
      onPress={onPress}
    >
      {icon}
      {showName && <Text className="mt-1 text-sm text-foreground">{name}</Text>}
    </TouchableOpacity>
  );
};

const TrackPopover = () => {
  const [open, setOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: open ? 1 : 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [open, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const scale = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });
  const iconClassName = 'w-6 aspect-square text-foreground';
  const options = [
    {
      key: 'training',
      label: 'New training',
      icon: <ExerciseIcon className={iconClassName} fill="currentColor" />,
      action: () => navigate('Training'),
    },
    {
      key: 'nutrition',
      label: 'New meal',
      icon: <AppleIcon className={iconClassName} fill="currentColor" />,
      action: () => navigate('Nutrition'),
    },
    {
      key: 'sleep',
      label: 'New sleep',
      icon: <NightIcon className={iconClassName} fill="currentColor" />,
      action: () => navigate('Sleep'),
    },
  ];

  return (
    <View
      pointerEvents="box-none"
      className="absolute -top-4 left-0 right-0 items-center justify-center"
      style={{ zIndex: 50, elevation: 50 }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TouchableOpacity className="active:opacity-90" accessibilityRole="button">
            <View className="aspect-square w-20 items-center justify-center rounded-full bg-secondary shadow-2xl shadow-secondary/40">
              <Animated.View
                style={[
                  {
                    transform: [{ rotate }, { scale }],
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <PlusIcon
                  className="aspect-square h-14 text-foreground"
                  strokeWidth={open ? 1 : 2}
                />
              </Animated.View>
            </View>
          </TouchableOpacity>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="border-0 bg-transparent shadow-none"
          overlayClassName="flex-1 bg-black/75"
        >
          <View className="flex flex-col items-center justify-center">
            {options.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => {
                  setOpen(false);
                  option.action();
                }}
                className="flex-row items-center p-2"
              >
                <Text className="ml-2">{option.label}</Text>
                <View className="ml-4 rounded-full bg-popover p-4">{option.icon}</View>
              </TouchableOpacity>
            ))}
          </View>
        </PopoverContent>
      </Popover>
    </View>
  );
};
