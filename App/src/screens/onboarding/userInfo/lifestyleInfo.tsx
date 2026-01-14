import {useStore} from "@/contexts/useStore";
import {ActivityLevel} from "@/types/user.profile.types";
import Slider from "@react-native-community/slider";
import {useThemeColor} from "heroui-native";
import {useEffect, useState} from "react";
import {Text, View} from "react-native";

export interface LifestyleData {
    activityLevel: ActivityLevel;
}

interface LifestyleInfoProps {
    onSubmit: (data: LifestyleData) => void;
    setNextEnabled: (enabled: boolean) => void;
    registerOnNext: (onNext: null | (() => void)) => void;
    initialData?: LifestyleData;
}

export default function LifestyleInfo({onSubmit, setNextEnabled, registerOnNext, initialData}: LifestyleInfoProps) {
    const {activityLevels} = useStore();
    const [activityLevelId, setActivityLevelId] = useState<number>(initialData?.activityLevel.id || 1);

    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");
    const accentColor = useThemeColor("accent");

    useEffect(() => {
        setNextEnabled(true);
        registerOnNext(() => {
            const selectedLevel = activityLevels[activityLevelId - 1];
            onSubmit({activityLevel: selectedLevel});
        });
    }, [activityLevelId, onSubmit, registerOnNext, activityLevels]);
    return (<View className="mt-4">
        <Text className="text-foreground text-lg font-semibold">{activityLevels[activityLevelId - 1]?.name}</Text>
        {/* TODO: Replace with heroui-native Slider when available */}
        <Slider
            value={activityLevelId}
            onValueChange={setActivityLevelId}
            minimumValue={1}
            maximumValue={activityLevels.length}
            step={1}
            thumbTintColor={foregroundColor}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor={mutedColor}
            style={{width: '100%', height: 40}}
        />
        <Text className="text-foreground">{activityLevels[activityLevelId - 1]?.description}</Text>
    </View>)
}