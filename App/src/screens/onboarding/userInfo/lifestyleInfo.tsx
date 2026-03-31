import {useUserStore} from "@/contexts/useUserStore";
import {ActivityLevel} from "@/types/user.profile.types";
import {Description, Label, Slider} from "heroui-native";
import {useEffect, useMemo, useState} from "react";
import {View} from "react-native";

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
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!activityLevels.length) return;

        const initialId = initialData?.activityLevel?.id;
        if (initialId == null) {
            setSelectedIndex(0);
            return;
        }

        const matchedIndex = activityLevels.findIndex((level) => level.id === initialId);
        setSelectedIndex(matchedIndex >= 0 ? matchedIndex : 0);
    }, [activityLevels, initialData?.activityLevel?.id]);

    const selectedLevel = useMemo(
        () => activityLevels[selectedIndex],
        [activityLevels, selectedIndex],
    );

    useEffect(() => {
        onDraftChange?.(selectedLevel ? {activityLevel: selectedLevel} : {});

        setNextEnabled(Boolean(selectedLevel));
        if (!selectedLevel) {
            registerOnNext(null);
            return;
        }
        registerOnNext(() => {
            onSubmit({activityLevel: selectedLevel});
        });
    }, [onDraftChange, onSubmit, registerOnNext, selectedLevel, setNextEnabled]);

    return (<View className="mt-4">
        <Label>{selectedLevel?.name || 'Loading activity levels...'}</Label>
        <Slider
            value={activityLevels.length ? selectedIndex + 1 : 1}
            onChange={(val) => setSelectedIndex(Math.max(0, Number(val) - 1))}
            minValue={1}
            maxValue={Math.max(activityLevels.length, 1)}
            step={1}
            isDisabled={!activityLevels.length}
            className="w-full"
        >
            <Slider.Track>
                <Slider.Fill className="bg-accent" />
                <Slider.Thumb className="bg-foreground" />
            </Slider.Track>
        </Slider>
        <Description>{selectedLevel?.description || 'Please wait while we fetch the options.'}</Description>
    </View>)
}
