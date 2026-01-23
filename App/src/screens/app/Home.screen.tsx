import { H1, H2 } from "@/components/Text";
import React, { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import MainLayout from "@/layouts/Main.layout";


export default function Home() {
    const { signOut } = useAuth();
    return (<MainLayout>
        <H1>Heading!</H1>
        <H2>Subheading!</H2>
        {/* <Text className="text-foreground text-4xl">Hello</Text>
            <Text className="text-foreground font-poppins text-4xl">Hello</Text>
            <Text className="text-foreground font-poppins-bold">Poppins Bold</Text>
            <Text className="text-foreground font-poppins-semibold">Poppins SemiBold</Text>

        <Text className='text-foreground font-poppins-semibold-italic text-4xl'>Poppins</Text>
        <Text className='text-foreground font-poppins-semibold text-4xl'>Poppins</Text> */}
        {/*<Button variant='danger' onPress={signOut}>Sign Out</Button>*/}
    </MainLayout>)
}