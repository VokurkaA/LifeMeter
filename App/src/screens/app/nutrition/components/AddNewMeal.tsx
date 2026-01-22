import { View } from "react-native";
import { Text } from "@/components/Text";
import { BottomSheet, Button, Tabs, TextField } from "heroui-native";
import { useState } from "react";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
} from 'react-native-reanimated';
import AddMeal from "./AddMeal";
import ScanMeal from "./ScanMeal";
import CreateFood from "./CreateFood";

const AnimatedContentContainer = ({
    children,
}: {
    children: React.ReactNode;
}) => (
    <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="gap-6"
    >
        {children}
    </Animated.View>
);

export default function AddNewMeal() {
    const [activeTab, setActiveTab] = useState("quickAdd");
    return (
        <View>
            <BottomSheet>
                <BottomSheet.Trigger asChild>
                    <Button>Add New Meal</Button>
                </BottomSheet.Trigger>
                <BottomSheet.Portal>
                    <BottomSheet.Overlay />
                    <BottomSheet.Content>
                        <BottomSheet.Title>Add New Meal</BottomSheet.Title>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <Tabs.List className="w-full justify-between overflow-scroll">
                                <Tabs.Indicator />
                                <Tabs.Trigger value="quickAdd">
                                    <Tabs.Label>Quick Add</Tabs.Label>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="scanBarcode">
                                    <Tabs.Label>Scan</Tabs.Label>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="addMeal">
                                    <Tabs.Label>Add Meal</Tabs.Label>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="createFood">
                                    <Tabs.Label>Create Food</Tabs.Label>
                                </Tabs.Trigger>
                            </Tabs.List>

                            <Animated.View layout={LinearTransition.duration(200)}>
                                <Tabs.Content value="quickAdd">
                                    <AnimatedContentContainer>
                                        <Text>Quick Add Content</Text>
                                        <TextField>
                                            <TextField.Label>Calories</TextField.Label>
                                            <TextField.Input placeholder="Enter calories" />
                                        </TextField>
                                    </AnimatedContentContainer>
                                </Tabs.Content>
                                <Tabs.Content value="scanBarcode">
                                    <AnimatedContentContainer>
                                        <ScanMeal />
                                    </AnimatedContentContainer>
                                </Tabs.Content>
                                <Tabs.Content value="addMeal">
                                    <AnimatedContentContainer>
                                        <AddMeal />
                                    </AnimatedContentContainer>
                                </Tabs.Content>
                                <Tabs.Content value="createFood">
                                    <AnimatedContentContainer>
                                        <CreateFood />
                                    </AnimatedContentContainer>
                                </Tabs.Content>
                            </Animated.View>
                        </Tabs>
                    </BottomSheet.Content>
                </BottomSheet.Portal>
            </BottomSheet>
        </View>
    );
}
