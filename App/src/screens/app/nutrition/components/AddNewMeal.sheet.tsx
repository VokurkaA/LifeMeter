import { BottomSheet, Button, Tabs } from "heroui-native";
import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useStore } from "@/contexts/useStore";
import { BottomSheetFooter, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import QuickAddMeal from "../tabs/QuickAddMeal.tab";
import ScanMeal from "../tabs/ScanMeal.tab";
import FromExistingMeal from "../tabs/FromExistingMeal";
import NewMeal from "../tabs/NewMeal";

export default function AddNewMeal() {
    const { createUserMeal, userMeals } = useStore();
    const [activeTab, setActiveTab] = useState("quickAdd");
    const [isOpen, setIsOpen] = useState(false);
    const [snapIndex, setSnapIndex] = useState(1);
    const bottomSheetRef = useRef<any>(null);

    const snapPoints = useMemo(() => {
        switch (activeTab) {
            case "quickAdd":
                return ["25%", "70%"];
            case "scanBarcode":
                return ['60%'];
            case "fromExisting":
                return ["25%", "50%", "80%", "90%"];
            case "newMeal":
                return ["45%", "70%", "90%"];
            default:
                return ["25%"];
        }
    }, [activeTab]);

    useEffect(() => {
        setSnapIndex(1);
        if (bottomSheetRef.current && typeof bottomSheetRef.current.snapToIndex === 'function') {
            bottomSheetRef.current.snapToIndex(1);
        }
    }, [activeTab]);

    const handleSuccess = () => setIsOpen(false);

    const TabTrigger = ({ value, label }: { value: string; label: string }) => (
        <Tabs.Trigger value={value}>
            {({ isSelected }: { isSelected: boolean }) => (
                <Tabs.Label className={isSelected ? "text-accent" : undefined}>{label}</Tabs.Label>
            )}
        </Tabs.Trigger>
    );

    const TabContent = ({ value, fillComponent }: { value: string; fillComponent: React.ReactNode }) => {
        return (
            <Tabs.Content value={value}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    className="gap-6"
                >
                    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                        {fillComponent}
                    </BottomSheetScrollView>
                </Animated.View>
            </Tabs.Content>
        );
    };

    const renderFooter = useCallback(
        (props: any) => (
            <BottomSheetFooter {...props}>
                <Tabs className="px-4 pb-safe-offset-1" value={activeTab} onValueChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.ScrollView scrollAlign="center" contentContainerClassName="w-full justify-between">
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
        [activeTab]
    );

    return (
        <BottomSheet ref={bottomSheetRef} isOpen={isOpen} onOpenChange={setIsOpen}>
            <BottomSheet.Trigger asChild>
                <Button>Add New Meal</Button>
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content
                    contentContainerClassName="pb-28 h-full"
                    enableOverDrag={false}
                    snapPoints={snapPoints}
                    index={snapIndex}
                    footerComponent={renderFooter}
                >
                    <BottomSheet.Title className="mb-4">Add A New Meal</BottomSheet.Title>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <Animated.View key={activeTab} layout={LinearTransition.duration(200)}>
                            <TabContent
                                value="quickAdd"
                                fillComponent={<QuickAddMeal onSuccess={handleSuccess} createUserMeal={createUserMeal} />}
                            />
                            <TabContent
                                value="scanBarcode"
                                fillComponent={<ScanMeal onSuccess={handleSuccess} createUserMeal={createUserMeal} />}
                            />
                            <TabContent
                                value="fromExisting"
                                fillComponent={<FromExistingMeal onSuccess={handleSuccess} createUserMeal={createUserMeal} userMeals={userMeals} />}
                            />
                            <TabContent
                                value="newMeal"
                                fillComponent={<NewMeal onSuccess={handleSuccess} createUserMeal={createUserMeal} userMeals={userMeals} />}
                            />
                        </Animated.View>
                    </Tabs>
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}