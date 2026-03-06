import { BottomSheet, Button, Tabs, useThemeColor, Card, PressableFeedback } from "heroui-native";
import { useCallback, useState } from "react";
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { BottomSheetFooter, BottomSheetFooterProps, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { PlusIcon, Dumbbell, History, FilePlus, LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/Text";
import { useWorkoutStore } from "@/contexts/useWorkoutStore";
import { MONTHS } from "@/lib/dateTime";
import { navigate } from "@/navigation/navigate";
import type { FullWorkout, FullWorkoutTemplate, TemplateWorkoutSet } from "@/types/workout.types";

interface AddWorkoutSheetProps {
    trigger?: React.ReactNode;
}

const AnimatedContentContainer = ({ children }: { children: React.ReactNode }) => (
    <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="gap-6"
    >
        {children}
    </Animated.View>
);

interface TabWrapperProps {
    value: string;
    children: React.ReactNode;
}

const TabWrapper = ({ value, children }: TabWrapperProps) => (
    <Tabs.Content value={value}>
        <AnimatedContentContainer>
            <BottomSheetView className="pb-26 p-4">
                {children}
            </BottomSheetView>
        </AnimatedContentContainer>
    </Tabs.Content>
);

interface QuickTabContentProps {
    foregroundColor: string;
    userWorkouts: FullWorkout[];
    handleStartEmpty: () => void;
}

const QuickTabContent = ({ foregroundColor, userWorkouts, handleStartEmpty }: QuickTabContentProps) => (
    <>
        <Card className="flex flex-col items-center justify-center gap-2">
            <Dumbbell size={48} color={foregroundColor} />
            <View className="items-center">
                <Card.Title className="text-xl">No Session</Card.Title>
                <Card.Description className="text-center">Start a workout without a template and add exercises as you go.</Card.Description>
            </View>
            <Button variant="primary" onPress={handleStartEmpty} className="w-full">
                <Button.Label>Start New Workout</Button.Label>
            </Button>
        </Card>

        <Text className="font-bold my-2">Recent Workouts</Text>
        <View className="flex flex-col gap-2">
            {userWorkouts.slice(0, 3).map(w => (
                <PressableFeedback key={w.id}>
                    <Card variant="secondary" className="flex-row justify-between items-center">
                        <Card.Body>
                            <Card.Title>{w.label?.[0] || 'Workout'}</Card.Title>
                            <Card.Description>{MONTHS[new Date(w.startDate).getMonth()]} {new Date(w.startDate).getDate()}</Card.Description>
                        </Card.Body>
                        <PlusIcon size={18} color={foregroundColor} />
                    </Card>
                </PressableFeedback>
            ))}
        </View>
    </>
);

interface TemplateTabContentProps {
    userWorkoutTemplates: FullWorkoutTemplate[];
    handleStartTemplate: (template: FullWorkoutTemplate) => void;
    setIsOpen: (value: boolean) => void;
}

const TemplateTabContent = ({ userWorkoutTemplates, handleStartTemplate, setIsOpen }: TemplateTabContentProps) => (
    <>
        {userWorkoutTemplates.map(t => (
            <PressableFeedback key={t.id} onPress={() => {
                setIsOpen(false);
                navigate('TemplateBuilder', { templateId: t.id });
            }}>
                <Card variant="secondary" className="border border-border">
                    <Card.Body>
                        <Card.Title>{t.name}</Card.Title>
                        <Card.Description>{t.sets.length} sets</Card.Description>
                    </Card.Body>
                    <Button size="sm" variant="secondary" onPress={() => handleStartTemplate(t)}>
                        <Button.Label>Start</Button.Label>
                    </Button>
                </Card>
            </PressableFeedback>
        ))}
        {userWorkoutTemplates.length === 0 && (
            <Text className="text-muted text-center py-10">No templates yet. Create one to speed up your routine.</Text>
        )}
    </>
);

interface NewTabContentProps {
    foregroundColor: string;
    setIsOpen: (value: boolean) => void;
    setActiveTab: (value: string) => void;
}

const NewTabContent = ({ foregroundColor, setIsOpen, setActiveTab }: NewTabContentProps) => (
    <View className="py-10 items-center gap-4">
        <FilePlus size={48} color={foregroundColor} />
        <View className="items-center">
            <Text className="text-xl font-bold">New Template</Text>
            <Text className="text-muted text-center px-6">Create a reusable workout template with your favorite exercises.</Text>
        </View>
        <Button variant="primary" className="w-full" onPress={() => {
            setIsOpen(false);
            navigate('TemplateBuilder', {});
        }}>
            <Button.Label>Create Template</Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => setActiveTab("quick")}>
            <Button.Label>Go Back</Button.Label>
        </Button>
    </View>
);

export default function AddWorkoutSheet({ trigger }: AddWorkoutSheetProps) {
    const { userWorkoutTemplates, userWorkouts, createUserWorkout } = useWorkoutStore();
    const foregroundColor = useThemeColor('foreground');
    const [activeTab, setActiveTab] = useState("quick");
    const [isOpen, setIsOpen] = useState(false);

    const handleStartEmpty = async () => {
        const workout = await createUserWorkout({
            startDate: new Date().toISOString(),
            sets: [],
            label: ["Empty Workout"],
        } as unknown as FullWorkout);
        setIsOpen(false);
        if (workout) {
            navigate('ActiveWorkout', { workoutId: workout.id });
        }
    };

    const handleStartTemplate = async (template: FullWorkoutTemplate) => {
        const workout = await createUserWorkout({
            workoutTemplateId: template.id,
            startDate: new Date().toISOString(),
            sets: template.sets.map((s: TemplateWorkoutSet) => ({
                exerciseId: s.exerciseId,
                seqNumber: s.seqNumber,
                repetitions: s.repetitions || 1,
                rir: s.rir,
                restTime: s.restTime,
                notes: s.notes,
                styleId: s.styleId,
                setTypeId: s.setTypeId,
                weight: 0, // Default weight
                weightUnitId: "1", // Default unit
            })),
            label: [template.name],
        } as unknown as FullWorkout);
        setIsOpen(false);
        if (workout) {
            navigate('ActiveWorkout', { workoutId: workout.id });
        }
    };

    const TabTrigger = ({ value, label, icon: Icon }: { value: string; label: string; icon: LucideIcon }) => (
        <Tabs.Trigger value={value} className="flex-1 py-2">
            {({ isSelected }: { isSelected: boolean }) => (
                <View className="items-center gap-1">
                    <Icon size={18} color={isSelected ? foregroundColor : '#888'} />
                    <Tabs.Label className={isSelected ? "text-foreground font-bold" : "text-muted"}>{label}</Tabs.Label>
                </View>
            )}
        </Tabs.Trigger>
    );

    const renderFooter = useCallback(
        (props: BottomSheetFooterProps) => (
            <BottomSheetFooter {...props}>
                <Tabs className="px-4 pb-safe-offset-1 border-t border-border bg-surface" value={activeTab} onValueChange={setActiveTab}>
                    <Tabs.List className="bg-transparent">
                        <Tabs.Indicator />
                        <TabTrigger value="quick" label="Quick" icon={Dumbbell} />
                        <TabTrigger value="template" label="Template" icon={History} />
                        <TabTrigger value="new" label="New" icon={FilePlus} />
                    </Tabs.List>
                </Tabs>
            </BottomSheetFooter>
        ),
        [activeTab, foregroundColor]
    );

    return (
        <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
            <BottomSheet.Trigger asChild>
                {trigger || (
                    <Button variant="primary" className="mb-6 mx-1">
                        <PlusIcon color="white" size={20} />
                        <Button.Label>Start Workout</Button.Label>
                    </Button>
                )}
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content
                    enableDynamicSizing={true}
                    footerComponent={renderFooter}
                >
                    <BottomSheetView>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <Animated.View layout={LinearTransition.duration(200)}>
                                <TabWrapper value="quick">
                                    <QuickTabContent
                                        foregroundColor={foregroundColor}
                                        userWorkouts={userWorkouts}
                                        handleStartEmpty={handleStartEmpty}
                                    />
                                </TabWrapper>

                                <TabWrapper value="template">
                                    <TemplateTabContent
                                        userWorkoutTemplates={userWorkoutTemplates}
                                        handleStartTemplate={handleStartTemplate}
                                        setIsOpen={setIsOpen}
                                    />
                                </TabWrapper>

                                <TabWrapper value="new">
                                    <NewTabContent
                                        foregroundColor={foregroundColor}
                                        setIsOpen={setIsOpen}
                                        setActiveTab={setActiveTab}
                                    />
                                </TabWrapper>
                            </Animated.View>
                        </Tabs>
                    </BottomSheetView>
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}
