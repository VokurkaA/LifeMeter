import {ThemeToggle} from "@/components/theme-toggle";
import {Button} from "@/components/ui/Button";
import {H1} from "@/components/ui/Text";
import {useNavigation} from "@/contexts/NavigationContext";
import React from "react";
import {View} from "react-native";

function AuthScreen() {
    const {navigate} = useNavigation();

    return (<View className="p-8">
            <H1 className="m-24 text-center">Welcome</H1>
            <ThemeToggle className="mb-4"/>
            <Button
                onPress={() => navigate({
                    id: 'login', name: 'Login'
                })}
                className="mb-4 rounded-xl"
                size="lg"
                label="I already have an account"
                variant="default"
            />
            <Button
                onPress={() => navigate({
                    id: 'signup', name: 'Sign Up'
                })}
                className="rounded-xl"
                size="lg"
                label="Create an account"
                variant="secondary"
            />
        </View>);
}

export default AuthScreen;