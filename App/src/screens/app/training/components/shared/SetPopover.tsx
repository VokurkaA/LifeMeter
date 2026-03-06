import React, { useState } from 'react';
import { View } from 'react-native';
import {
    Button,
    Input,
    Popover,
    Separator,
    TextField,
} from 'heroui-native';
import { Text } from '@/components/Text';
import { SetStyle, SetType } from '@/types/workout.types';

export interface SetPopoverSet {
    id: string;
    seqNumber: number;
    setTypeId?: string;
    styleId?: string;
    notes?: string;
}

interface Props {
    set: SetPopoverSet;
    setStyles: SetStyle[];
    setTypes: SetType[];
    onUpdate: (setId: string, updates: Partial<SetPopoverSet>) => void;
    children: React.ReactNode;
}

/**
 * Shared popover for set type, style and notes settings.
 * Batches all changes and flushes them when the popover closes.
 */
export default function SetPopover({ set, setStyles, setTypes, onUpdate, children }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [pending, setPending] = useState<Pick<SetPopoverSet, 'setTypeId' | 'styleId' | 'notes'>>({
        setTypeId: set.setTypeId,
        styleId: set.styleId,
        notes: set.notes,
    });

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setPending({ setTypeId: set.setTypeId, styleId: set.styleId, notes: set.notes });
        } else {
            const updates: Partial<SetPopoverSet> = {};
            if (pending.setTypeId !== set.setTypeId) updates.setTypeId = pending.setTypeId;
            if (pending.styleId !== set.styleId) updates.styleId = pending.styleId;
            if (pending.notes !== set.notes) updates.notes = pending.notes;
            if (Object.keys(updates).length > 0) onUpdate(set.id, updates);
        }
        setIsOpen(open);
    };

    return (
        <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
            <Popover.Trigger asChild>
                {children}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Overlay />
                <Popover.Content presentation="popover">
                    <Text className="font-bold uppercase text-xs text-muted">
                        Set Settings (Set {set.seqNumber})
                    </Text>
                    <Separator className="my-2" />

                    <Text className="font-bold uppercase text-xs text-muted">Type</Text>
                    <View className="flex-row flex-wrap gap-2 my-2">
                        <Button
                            variant={!pending.setTypeId ? 'primary' : 'secondary'}
                            size="sm"
                            onPress={() => setPending(p => ({ ...p, setTypeId: undefined }))}
                        >
                            <Button.Label>Normal</Button.Label>
                        </Button>
                        {setTypes.map(t => (
                            <Button
                                key={t.id}
                                variant={pending.setTypeId === t.id ? 'primary' : 'secondary'}
                                size="sm"
                                onPress={() =>
                                    setPending(p => ({
                                        ...p,
                                        setTypeId: p.setTypeId === t.id ? undefined : t.id,
                                    }))
                                }
                            >
                                <Button.Label>{t.name}</Button.Label>
                            </Button>
                        ))}
                    </View>

                    <Text className="font-bold uppercase text-xs text-muted">Style</Text>
                    <View className="flex-row flex-wrap gap-2 my-2">
                        <Button
                            variant={!pending.styleId ? 'primary' : 'secondary'}
                            size="sm"
                            onPress={() => setPending(p => ({ ...p, styleId: undefined }))}
                        >
                            <Button.Label>Normal</Button.Label>
                        </Button>
                        {setStyles.map(s => (
                            <Button
                                key={s.id}
                                variant={pending.styleId === s.id ? 'primary' : 'secondary'}
                                size="sm"
                                onPress={() =>
                                    setPending(p => ({
                                        ...p,
                                        styleId: p.styleId === s.id ? undefined : s.id,
                                    }))
                                }
                            >
                                <Button.Label>{s.name}</Button.Label>
                            </Button>
                        ))}
                    </View>

                    <TextField>
                        <Text className="font-bold uppercase text-xs text-muted">Notes</Text>
                        <Input
                            variant="secondary"
                            placeholder="Add set notes..."
                            value={pending.notes || ''}
                            onChangeText={val =>
                                setPending(p => ({ ...p, notes: val || undefined }))
                            }
                        />
                    </TextField>
                </Popover.Content>
            </Popover.Portal>
        </Popover>
    );
}
