import {ThemeToggle} from '@/components/theme-toggle';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/Avatar';
import {Button} from '@/components/ui/Button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/Card';
import {Text} from '@/components/ui/Text';
import {useToast} from '@/components/ui/Toast';
import {useAuth} from '@/contexts/AuthContext';
import React from "react";
import {ScrollView, View} from "react-native";

function HomeScreen() {
    const {user, session, signOut} = useAuth();
    const {toast} = useToast();

    const handleLogout = async () => {
        try {
            await signOut();
            toast('Successfully logged out!', 'success', 3000);
        } catch (error) {
            console.error('Logout failed:', error);
            toast('Failed to log out', 'destructive', 5000);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (<ScrollView className="flex-1 p-4">
            <View className="items-center mb-6">
                <Avatar className="w-24 h-24 mb-4">
                    {user?.image ? (<AvatarImage source={{uri: user.image}}/>) : (<AvatarFallback>
                            {getInitials(user?.name)}
                        </AvatarFallback>)}
                </Avatar>
                <Text variant="h1" className="mb-2">{user?.name || 'User'}</Text>
                <Text variant="muted">{user?.email}</Text>
            </View>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="gap-3">
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground">User ID:</Text>
                        <Text className="font-medium">{user?.id}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground">Role:</Text>
                        <Text className="font-medium capitalize">{user?.role}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground">Email Verified:</Text>
                        <Text className="font-medium">{user?.emailVerified ? '✓ Yes' : '✗ No'}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground">Last Login Method:</Text>
                        <Text className="font-medium capitalize">{user?.lastLoginMethod || 'N/A'}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground">Account Status:</Text>
                        <Text className={`font-medium ${user?.banned ? 'text-destructive' : 'text-green-500'}`}>
                            {user?.banned ? '🚫 Banned' : '✓ Active'}
                        </Text>
                    </View>
                    {user?.banned && user?.banReason && (<View className="flex-row justify-between">
                            <Text className="text-muted-foreground">Ban Reason:</Text>
                            <Text className="font-medium text-destructive">{user.banReason}</Text>
                        </View>)}
                    {user?.banned && user?.banExpires && (<View className="flex-row justify-between">
                            <Text className="text-muted-foreground">Ban Expires:</Text>
                            <Text className="font-medium">{formatDate(user.banExpires)}</Text>
                        </View>)}
                </CardContent>
            </Card>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Account Dates</CardTitle>
                </CardHeader>
                <CardContent className="gap-3">
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground">Created:</Text>
                        <Text className="font-medium">{formatDate(user?.createdAt)}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground">Last Updated:</Text>
                        <Text className="font-medium">{formatDate(user?.updatedAt)}</Text>
                    </View>
                </CardContent>
            </Card>

            {session && (<Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Session Information</CardTitle>
                    </CardHeader>
                    <CardContent className="gap-3">
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground">Session ID:</Text>
                            <Text className="text-xs font-medium">{session.id}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground">IP Address:</Text>
                            <Text className="font-medium">{session.ipAddress}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground">Expires:</Text>
                            <Text className="font-medium">{formatDate(session.expiresAt)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground">Created:</Text>
                            <Text className="font-medium">{formatDate(session.createdAt)}</Text>
                        </View>
                    </CardContent>
                </Card>)}

            <ThemeToggle className="mb-4"/>

            <Button
                label="Log Out"
                onPress={handleLogout}
                variant="destructive"
                size="lg"
                className="mb-8"
            />
        </ScrollView>);
}

export default HomeScreen;