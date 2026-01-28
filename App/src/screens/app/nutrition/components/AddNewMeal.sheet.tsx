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
import { BottomSheetFooter, BottomSheetScrollView } from "@gorhom/bottom-sheet";

export default function AddNewMeal() {
    const { createUserMeal, userMeals } = useStore();
    const [activeTab, setActiveTab] = useState("quickAdd");
    const [isOpen, setIsOpen] = useState(false);

    const handleSuccess = () => { setIsOpen(false); };

    const renderFooter = useCallback(
        (props: any) => (
            <BottomSheetFooter {...props}>
                <Tabs className="px-4 pb-safe-offset-1" value={activeTab} onValueChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.ScrollView contentContainerClassName="w-full justify-between">
                            <Tabs.Indicator />
                            <TabTrigger value="quickAdd" label="Quick Add" />
                            <TabTrigger value="scanBarcode" label="Scan" />
                            <TabTrigger value="fromExisting" label="From Existing" />
                            <TabTrigger value="newMeal" label="New Meal" />
                        </Tabs.ScrollView>
                    </Tabs.List>
                </Tabs>
            </BottomSheetFooter>
        ),
        [activeTab, setActiveTab]
    );

    const TabTrigger = ({ value, label }: { value: string; label: string }) => {
        return (
            <Tabs.Trigger value={value}>
                {({ isSelected }) => (
                    <Tabs.Label className={` ${isSelected ? "text-accent" : ""}`}>
                        {label}
                    </Tabs.Label>
                )}
            </Tabs.Trigger>
        );
    };

    const TabContent = ({ value, fillComponent }: { value: string, fillComponent: React.ReactNode }) => {
        return (
            <Tabs.Content value={value}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    className="gap-6 grow"
                >
                    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                        {fillComponent}
                    </BottomSheetScrollView>
                </Animated.View>
            </Tabs.Content>
        )
    }


    return (
        <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
            <BottomSheet.Trigger asChild>
                <Button>Add New Meal</Button>
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content
                    contentContainerClassName='h-full pb-28'
                    enableOverDrag={false}
                    enableDynamicSizing={true}
                    footerComponent={renderFooter}
                >
                    <BottomSheet.Title className="mb-4">Add A New Meal</BottomSheet.Title>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <Animated.View layout={LinearTransition.duration(200)}>
                            <TabContent value="quickAdd" fillComponent={
                                <QuickAddMeal
                                    onSuccess={handleSuccess}
                                    createUserMeal={createUserMeal}
                                />
                            } />
                            <TabContent value="scanBarcode" fillComponent={
                                <ScanMeal
                                    onSuccess={handleSuccess}
                                    createUserMeal={createUserMeal}
                                />
                            } />
                            <TabContent value="fromExisting" fillComponent={
                                <FromExistingMeal
                                    onSuccess={handleSuccess}
                                    createUserMeal={createUserMeal}
                                    userMeals={userMeals}
                                />
                            } />
                            <TabContent value="newMeal" fillComponent={
                                <NewMeal
                                    onSuccess={handleSuccess}
                                    createUserMeal={createUserMeal}
                                    userMeals={userMeals}
                                />
                            } />
                        </Animated.View>
                    </Tabs>
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}