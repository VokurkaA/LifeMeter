import {useUserStore} from "@/contexts/useUserStore";
import {ActivityLevel} from "@/types/user.profile.types";
import {Description, Label, Slider, useThemeColor} from "heroui-native";
import {useEffect, useState} from "react";
import {Text, View} from "react-native";

export interface LifestyleData {
    activityLevel: ActivityLevel;
}

interface LifestyleInfoProps {
    onSubmit: (data: LifestyleData) => void;
    setNextEnabled: (enabled: boolean) => void;
    registerOnNext: (onNext: null | (() => void)) => void;
    initialData?: Partial<LifestyleData>;
    onDraftChange?: (data: Partial<LifestyleData>) => void;
}

export default function LifestyleInfo({
    onSubmit,
    setNextEnabled,
    registerOnNext,
    initialData,
    onDraftChange,
}: LifestyleInfoProps) {
    const {activityLevels} = useUserStore();
    const [activityLevelId, setActivityLevelId] = useState<number>(initialData?.activityLevel?.id || 1);

    useEffect(() => {
        const selectedLevel = activityLevels[activityLevelId - 1];
        onDraftChange?.(selectedLevel ? {activityLevel: selectedLevel} : {});

        setNextEnabled(Boolean(selectedLevel));
        if (!selectedLevel) {
            registerOnNext(null);
            return;
        }
        registerOnNext(() => {
            onSubmit({activityLevel: selectedLevel});
        });
    }, [activityLevelId, onDraftChange, onSubmit, registerOnNext, activityLevels]);
    return (<View className="mt-4">
        <Label>{activityLevels[activityLevelId - 1]?.name}</Label>
        <Slider
            value={activityLevelId}
            onChange={(val) => setActivityLevelId(val as number)}
            minValue={1}
            maxValue={activityLevels.length}
            step={1}
            className="w-full"
        >
            <Slider.Track>
                <Slider.Fill className="bg-accent" />
                <Slider.Thumb className="bg-foreground" />
            </Slider.Track>
        </Slider>
        <Description>{activityLevels[activityLevelId - 1]?.description}</Description>
    </View>)
}
