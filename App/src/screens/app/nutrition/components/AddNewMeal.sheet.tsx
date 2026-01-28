import { View } from "react-native";
import { BottomSheet, Button, Tabs } from "heroui-native";
import { useCallback, useState } from "react";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
} from 'react-native-reanimated';
import ScanMeal from "../tabs/ScanMeal.tab";
import QuickAddMeal from "../tabs/QuickAddMeal.tab";
import { useStore } from "@/contexts/useStore";
import NewMeal from "../tabs/NewMeal";
import FromExistingMeal from "../tabs/FromExistingMeal";
import { ScrollView } from "react-native";

const AnimatedContentContainer = ({ children }: { children: React.ReactNode; }) => (
    <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="gap-6"
    >
        {children}
    </Animated.View>
);

export default function AddNewMeal() {
    const { createUserMeal, userMeals } = useStore();
    const [activeTab, setActiveTab] = useState("quickAdd");
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => {
        setIsOpen(false);
    };
    return (
        <View>
            <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
                <BottomSheet.Trigger asChild>
                    <Button>Add New Meal</Button>
                </BottomSheet.Trigger>
                <BottomSheet.Portal>
                    <BottomSheet.Overlay />
                    <BottomSheet.Content
                        snapPoints={['25%', '40%', '60%', '80%']}
                        index={1}
                        contentContainerClassName='h-full'
                        enableOverDrag={false}
                        enableDynamicSizing={true}
                        // footerComponent={footerComponent}
                    >
                        <BottomSheet.Title className="mb-4">Add A New Meal</BottomSheet.Title>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <Tabs.List className="flex-row">
                                    <Tabs.Indicator />
                                    <Tabs.Trigger value="quickAdd" className="flex-1">
                                        {({ isSelected }) => (<Tabs.Label className={` ${isSelected ? "text-accent" : ""}`}>Quick Add</Tabs.Label>)}
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="scanBarcode" className="flex-1">
                                        {({ isSelected }) => (<Tabs.Label className={` ${isSelected ? "text-accent" : ""}`}>Scan</Tabs.Label>)}
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="fromExisting" className="flex-1">
                                        {({ isSelected }) => (<Tabs.Label className={` ${isSelected ? "text-accent" : ""}`}>From Existing</Tabs.Label>)}
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="newMeal" className="flex-1">
                                        {({ isSelected }) => (<Tabs.Label className={` ${isSelected ? "text-accent" : ""}`}>New Meal</Tabs.Label>)}
                                    </Tabs.Trigger>
                                </Tabs.List>
                            </ScrollView>
                            <Animated.View layout={LinearTransition.duration(200)}>
                                <Tabs.Content value="quickAdd">
                                    <AnimatedContentContainer>
                                        <QuickAddMeal
                                            onSuccess={handleSuccess}
                                            createUserMeal={createUserMeal}
                                        />
                                    </AnimatedContentContainer>
                                </Tabs.Content>
                                <Tabs.Content value="scanBarcode">
                                    <AnimatedContentContainer>
                                        <ScanMeal
                                            onSuccess={handleSuccess}
                                            createUserMeal={createUserMeal}
                                        />
                                    </AnimatedContentContainer>
                                </Tabs.Content>
                                <Tabs.Content value="fromExisting">
                                    <AnimatedContentContainer>
                                        <FromExistingMeal
                                            onSuccess={handleSuccess}
                                            createUserMeal={createUserMeal}
                                            userMeals={userMeals}
                                        />
                                    </AnimatedContentContainer>
                                </Tabs.Content>
                                <Tabs.Content value="newMeal">
                                    <AnimatedContentContainer>
                                        <NewMeal
                                            onSuccess={handleSuccess}
                                            createUserMeal={createUserMeal}
                                            userMeals={userMeals}
                                        />
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
