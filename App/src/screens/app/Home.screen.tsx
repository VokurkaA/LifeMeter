import {Heading} from "@/components/Text";
import {Button} from "heroui-native";
import React from "react";
import {useAuth} from "@/contexts/useAuth";
import MainLayout from "@/layouts/Main.layout";

export default function Home() {
    const {signOut} = useAuth();

    return (<MainLayout>
            <Heading>Hello world!</Heading>
            {/*<Button variant='danger' onPress={signOut}>Sign Out</Button>*/}
        </MainLayout>)
}