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
import { BottomSheetFooter } from "@gorhom/bottom-sheet";

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

    const renderFooter = useCallback(
        (props: any) => (
            <BottomSheetFooter {...props} bottomInset={24}>
                <Tabs className="px-4" value={activeTab} onValueChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.ScrollView contentContainerClassName="w-full justify-between">
                            <Tabs.Indicator />
                            <Tabs.Trigger value="quickAdd">
                                {({ isSelected }) => (
                                    <Tabs.Label className={`${isSelected ? "text-accent" : ""}`}>
                                        Quick Add
                                    </Tabs.Label>
                                )}
                            </Tabs.Trigger>
                            <Tabs.Trigger value="scanBarcode">
                                {({ isSelected }) => (
                                    <Tabs.Label className={` ${isSelected ? "text-accent" : ""}`}>
                                        Scan
                                    </Tabs.Label>
                                )}
                            </Tabs.Trigger>
                            <Tabs.Trigger value="fromExisting">
                                {({ isSelected }) => (
                                    <Tabs.Label className={` ${isSelected ? "text-accent" : ""}`}>
                                        From Existing
                                    </Tabs.Label>
                                )}
                            </Tabs.Trigger>
                            <Tabs.Trigger value="newMeal">
                                {({ isSelected }) => (
                                    <Tabs.Label className={` ${isSelected ? "text-accent" : ""}`}>
                                        New Meal
                                    </Tabs.Label>
                                )}
                            </Tabs.Trigger>
                        </Tabs.ScrollView>
                    </Tabs.List>
                </Tabs>
            </BottomSheetFooter>
        ),
        [activeTab, setActiveTab]
    );



    return (
        <View>
            <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
                <BottomSheet.Trigger asChild>
                    <Button>Add New Meal</Button>
                </BottomSheet.Trigger>
                <BottomSheet.Portal>
                    <BottomSheet.Overlay />
                    <BottomSheet.Content
                        contentContainerClassName='h-full pb-24'
                        enableOverDrag={false}
                        enableDynamicSizing={true}
                        footerComponent={renderFooter}
                    >
                        <BottomSheet.Title className="mb-4">Add A New Meal</BottomSheet.Title>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
