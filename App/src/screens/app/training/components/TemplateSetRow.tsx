import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useThemeColor, PressableFeedback } from 'heroui-native';
import { Text } from '@/components/Text';
import { CircleIcon, Trash2 } from 'lucide-react-native';
import { SetStyle, SetType, TemplateWorkoutSet } from '@/types/workout.types';
import SetInput from './SetInput';
import SetPopover from './SetPopover';

type Props = {
    set: TemplateWorkoutSet;
    setIndex: number;
    onUpdate: (setId: string, updates: Partial<TemplateWorkoutSet>) => void;
    onDelete: (setId: string) => void;
    setStyles: SetStyle[];
    setTypes: SetType[];
    accentColor: string;
};

const TemplateSetRow = React.memo(({
    set,
    setIndex,
    onUpdate,
    onDelete,
    setStyles,
    setTypes,
    accentColor,
}: Props) => {
    const dangerColor = useThemeColor('danger');

    const [local, setLocal] = useState({
        reps: String(set.repetitions ?? ''),
        rir: String(set.rir ?? ''),
        rest: set.restTime || '',
    });

    useEffect(() => {
        setLocal({
            reps: String(set.repetitions ?? ''),
            rir: String(set.rir ?? ''),
            rest: set.restTime || '',
        });
    }, [set.repetitions, set.rir, set.restTime]);

    const handleUpdate = (key: string, val: string) => {
        if (key === 'rest') {
            if (val !== set.restTime) onUpdate(set.id, { restTime: val || undefined });
            return;
        }
        const numeric = parseInt(val);
        const field = key === 'reps' ? 'repetitions' : key;
        if (numeric !== (set as any)[field])
            onUpdate(set.id, { [field]: isNaN(numeric) ? undefined : numeric });
    };

    return (
        <View className="flex flex-row items-center my-2">
            <SetPopover
                set={set}
                setStyles={setStyles}
                setTypes={setTypes}
                onUpdate={(id, updates) => onUpdate(id, updates as Partial<TemplateWorkoutSet>)}
            >
                <PressableFeedback className="aspect-square items-center justify-center mr-2">
                    <View className="w-7 aspect-square rounded-full items-center justify-center border border-muted">
                        <Text className="text-xs font-bold">{setIndex + 1}.</Text>
                    </View>
                    {set.notes && (
                        <View className="absolute top-0 right-0">
                            <CircleIcon size={12} fill={accentColor} />
                        </View>
                    )}
                </PressableFeedback>
            </SetPopover>

            <View className="flex-1 flex-row gap-2">
                <SetInput
                    value={local.reps}
                    onChange={(v: string) => setLocal(l => ({ ...l, reps: v }))}
                    onBlur={() => handleUpdate('reps', local.reps)}
                    placeholder="Reps"
                />
                <SetInput
                    value={local.rir}
                    onChange={(v: string) => setLocal(l => ({ ...l, rir: v }))}
                    onBlur={() => handleUpdate('rir', local.rir)}
                    placeholder="RIR"
                />
                <SetInput
                    value={local.rest}
                    onChange={(v: string) => setLocal(l => ({ ...l, rest: v }))}
                    onBlur={() => handleUpdate('rest', local.rest)}
                    placeholder="0:00"
                />
                <View className="w-8 items-center justify-center">
                    <PressableFeedback onPress={() => onDelete(set.id)}>
                        <Trash2 size={18} color={dangerColor} />
                    </PressableFeedback>
                </View>
            </View>
        </View>
    );
});

export default TemplateSetRow;
