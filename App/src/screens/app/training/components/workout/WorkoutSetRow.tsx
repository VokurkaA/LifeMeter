import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useThemeColor, PressableFeedback } from 'heroui-native';
import { Text } from '@/components/Text';
import { CircleIcon, Trash2 } from 'lucide-react-native';
import { SetStyle, SetType, WorkoutSet } from '@/types/workout.types';
import SetInput from '../shared/SetInput';
import SetPopover from '../shared/SetPopover';

type Props = {
    set: WorkoutSet;
    setIndex: number;
    onUpdate: (setId: string, updates: Partial<WorkoutSet>) => void;
    onDelete: (setId: string) => void;
    setStyles: SetStyle[];
    setTypes: SetType[];
    accentColor: string;
};

const WorkoutSetRow = React.memo(({
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
        weight: String(set.weight || ''),
        reps: String(set.repetitions || ''),
        rir: String(set.rir ?? ''),
        rest: set.restTime || ''
    });

    useEffect(() => {
        setLocal({
            weight: String(set.weight || ''),
            reps: String(set.repetitions || ''),
            rir: String(set.rir ?? ''),
            rest: set.restTime || ''
        });
    }, [set.weight, set.repetitions, set.rir, set.restTime]);

    const handleUpdate = (key: string, val: string) => {
        if (key === 'rest') {
            if (val !== set.restTime) onUpdate(set.id, { restTime: val || undefined });
            return;
        }
        const numeric = key === 'weight' ? parseFloat(val) : parseInt(val);
        const field = key === 'reps' ? 'repetitions' : key;
        if (numeric !== (set as any)[field]) onUpdate(set.id, { [field]: isNaN(numeric) ? 0 : numeric });
    };

    return (
        <View className='flex flex-row items-center my-2'>
            <SetPopover
                set={set}
                setStyles={setStyles}
                setTypes={setTypes}
                onUpdate={(id, updates) => onUpdate(id, updates as Partial<WorkoutSet>)}
            >
                <PressableFeedback className="aspect-square items-center justify-center mr-2">
                    <View className='w-7 aspect-square rounded-full items-center justify-center border border-muted'>
                        <Text className='text-xs font-bold'>{setIndex + 1}.</Text>
                    </View>
                    {set.notes && (
                        <View className="absolute top-0 right-0">
                            <CircleIcon size={12} fill={accentColor} />
                        </View>
                    )}
                </PressableFeedback>
            </SetPopover>
            <View className='flex-1 flex-row gap-2'>
                <SetInput value={local.weight} onChange={(v: string) => setLocal({ ...local, weight: v })} onBlur={() => handleUpdate('weight', local.weight)} />
                <SetInput value={local.reps} onChange={(v: string) => setLocal({ ...local, reps: v })} onBlur={() => handleUpdate('reps', local.reps)} />
                <SetInput value={local.rir} onChange={(v: string) => setLocal({ ...local, rir: v })} onBlur={() => handleUpdate('rir', local.rir)} />
                <SetInput value={local.rest} onChange={(v: string) => setLocal({ ...local, rest: v })} onBlur={() => handleUpdate('rest', local.rest)} placeholder="0:00" />
                <View className="w-8 items-center justify-center">
                    <PressableFeedback onPress={() => onDelete(set.id)}>
                        <Trash2 size={18} color={dangerColor} />
                    </PressableFeedback>
                </View>
            </View>
        </View>
    );
});

export default WorkoutSetRow;
