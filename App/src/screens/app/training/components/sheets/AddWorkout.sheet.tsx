import { BottomSheet, Button, Tabs, useThemeColor, Card, PressableFeedback } from "heroui-native";
import { useCallback, useState, useRef, useMemo } from "react";
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { PlusIcon, Dumbbell, History, FilePlus } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/Text";
import { useWorkoutStore } from "@/contexts/useWorkoutStore";
import { formatTime, MONTHS } from "@/lib/dateTime";
import { navigate } from "@/navigation/navigate";

interface AddWorkoutSheetProps {
    trigger?: React.ReactNode;
}

const AnimatedContentContainer = ({ children }: { children: React.ReactNode }) => (
    <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="gap-6 flex-1"
    >
        {children}
    </Animated.View>
);

export default function AddWorkoutSheet({ trigger }: AddWorkoutSheetProps) {
    const { userWorkoutTemplates, userWorkouts, createUserWorkout } = useWorkoutStore();
    const foregroundColor = useThemeColor('foreground');
    const [activeTab, setActiveTab] = useState("quick");
    const [isOpen, setIsOpen] = useState(false);
    const bottomSheetRef = useRef<any>(null);

    const snapPoints = useMemo(() => ["50%", "85%"], []);

    const handleStartEmpty = async () => {
        const workout = await createUserWorkout({
            startDate: new Date().toISOString(),
            sets: [],
            label: ["Empty Workout"],
        } as any);
        setIsOpen(false);
        if (workout) {
            navigate('ActiveWorkout', { workoutId: workout.id });
        }
    };

    const handleStartTemplate = async (template: any) => {
        const workout = await createUserWorkout({
            workoutTemplateId: template.id,
            startDate: new Date().toISOString(),
            sets: template.sets.map((s: any) => ({
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
        } as any);
        setIsOpen(false);
        if (workout) {
            navigate('ActiveWorkout', { workoutId: workout.id });
        }
    };

    const TabTrigger = ({ value, label, icon: Icon }: { value: string; label: string; icon: any }) => (
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
        (props: any) => (
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
        <BottomSheet ref={bottomSheetRef} isOpen={isOpen} onOpenChange={setIsOpen}>
            <BottomSheet.Trigger asChild>
                {trigger || (
                    <Button variant="primary" className="mb-6 mx-1">
                        <PlusIcon color="white" size={20} />
                        <Button.Label className="text-white">Start Workout</Button.Label>
                    </Button>
                )}
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content
                    contentContainerClassName="flex-1 pb-28"
                    snapPoints={snapPoints}
                    footerComponent={renderFooter}
                >
                    <BottomSheet.Title className="mb-4 px-4">Training</BottomSheet.Title>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <Animated.View layout={LinearTransition.duration(200)} className="px-4 flex-1">
                            <Tabs.Content value="quick" className="flex-1">
                                <AnimatedContentContainer>
                                    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                                        <View className="gap-4">
                                            <Card className="p-6 items-center justify-center gap-4 bg-primary/5 border-primary/20">
                                                <Dumbbell size={48} color={foregroundColor} />
                                                <View className="items-center">
                                                    <Card.Title className="text-xl">Empty Session</Card.Title>
                                                    <Card.Description className="text-center">Start a workout without a template and add exercises as you go.</Card.Description>
                                                </View>
                                                <Button variant="primary" onPress={handleStartEmpty} className="w-full">
                                                    <Button.Label>Start Empty Workout</Button.Label>
                                                </Button>
                                            </Card>
                                            
                                            <Text className="font-bold mt-2">Recent Workouts</Text>
                                            {userWorkouts.slice(0, 3).map(w => (
                                                <PressableFeedback key={w.id}>
                                                    <Card className="flex-row justify-between bg-border items-center">
                                                        <Card.Body>
                                                            <Card.Title>{w.label?.[0] || 'Workout'}</Card.Title>
                                                            <Card.Description>{MONTHS[new Date(w.startDate).getMonth()]} {new Date(w.startDate).getDate()}</Card.Description>
                                                        </Card.Body>
                                                        <PlusIcon size={18} color={foregroundColor} />
                                                    </Card>
                                                </PressableFeedback>
                                            ))}
                                        </View>
                                    </BottomSheetScrollView>
                                </AnimatedContentContainer>
                            </Tabs.Content>

                            <Tabs.Content value="template" className="flex-1">
                                <AnimatedContentContainer>
                                    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                                        <View className="gap-3">
                                            {userWorkoutTemplates.map(t => (
                                                <PressableFeedback key={t.id} onPress={() => {
                                                    setIsOpen(false);
                                                    navigate('TemplateBuilder', { templateId: t.id });
                                                }}>
                                                    <Card className="p-4 flex-row justify-between items-center border-l-4 border-l-primary">
                                                        <Card.Body>
                                                            <Card.Title>{t.name}</Card.Title>
                                                            <Card.Description>{t.sets.length} sets</Card.Description>
                                                        </Card.Body>
                                                        <Button size="sm" variant="tertiary" onPress={() => handleStartTemplate(t)}>
                                                            <Button.Label>Start</Button.Label>
                                                        </Button>
                                                    </Card>
                                                </PressableFeedback>
                                            ))}
                                            {userWorkoutTemplates.length === 0 && (
                                                <Text className="text-muted text-center py-10">No templates yet. Create one to speed up your routine.</Text>
                                            )}
                                        </View>
                                    </BottomSheetScrollView>
                                </AnimatedContentContainer>
                            </Tabs.Content>

                            <Tabs.Content value="new" className="flex-1">
                                <AnimatedContentContainer>
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
                                </AnimatedContentContainer>
                            </Tabs.Content>
                        </Animated.View>
                    </Tabs>
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}
