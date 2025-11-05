import { useAuth } from '@/contexts/useAuth';
import { TouchableOpacity, View } from 'react-native';
import HamburgerIcon from './icons/hamburger';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Button } from './ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { H1, Text } from './ui/Text';
import { ThemeToggle } from './theme-toggle';
import { Time } from '@/lib/Time';

export default function Header() {
  const { user, signOut } = useAuth();
  return (
    <View className="flex h-20 flex-row items-center justify-between rounded-b-3xl bg-card px-4 py-4">
      <View className="flex flex-row items-center">
        <View className="mr-4 flex aspect-square h-12 items-center justify-center rounded-full bg-secondary">
          <HamburgerIcon variant="left-shrink" />
        </View>
        <H1>LifeMeter</H1>
      </View>
      <Popover>
        <PopoverTrigger asChild>
          <TouchableOpacity className="ml-auto">
            <Avatar>
              <AvatarImage source={{ uri: user?.image || undefined }} />
              <AvatarFallback textClassname="font-bold color-foreground">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
          </TouchableOpacity>
        </PopoverTrigger>

        <PopoverContent className="w-72" align="end" side="bottom" sideOffset={8}>
          <ThemeToggle />
          <View className="mb-4 flex flex-row items-center gap-2">
            <Avatar>
              <AvatarImage source={{ uri: user?.image || undefined }} />
              <AvatarFallback textClassname="font-bold color-foreground">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <View className="flex-1">
              <Text className="font-semibold">{user?.name || 'User'}</Text>
              <Text className="text-sm text-muted-foreground">{user?.email || 'No email'}</Text>
            </View>
          </View>
          <View className="mb-4 gap-1">
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">ID</Text>
              <Text className="text-sm">{user?.id || 'N/A'}</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Email verified</Text>
              <Text className="text-sm">{user?.emailVerified ? 'Yes' : 'No'}</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Banned</Text>
              <Text className="text-sm">{user?.banned ? 'Yes' : 'No'}</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Ban expires</Text>
              <Text className="text-sm">{user?.banExpires || 'N/A'}</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Ban reason</Text>
              <Text className="text-sm">{user?.banReason || 'N/A'}</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Created at</Text>
              <Text className="text-sm">{Time.format(user?.createdAt, 'D.M.YYYY')}</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Last login method</Text>
              <Text className="text-sm">{user?.lastLoginMethod || 'Unknown'}</Text>
            </View>
          </View>

          <Button label="Log out" variant="destructive" className="rounded-md" onPress={signOut} />
        </PopoverContent>
      </Popover>
    </View>
  );
}
