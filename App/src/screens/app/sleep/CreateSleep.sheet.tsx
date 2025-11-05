import { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/contexts/useStore';
import { Time } from '@/lib/Time';
import PlusIcon from '@/components/icons/plus';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet';

export default function CreateSleep() {
  const { createSleepSession } = useStore();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [startText, setStartText] = useState(Time.format(new Date(), 'YYYY-MM-DD HH:mm'));
  const [endText, setEndText] = useState('');
  const [note, setNote] = useState('');

  const handleCreate = async () => {
    try {
      if (!startText.trim() || !endText.trim()) {
        toast('Start and end are required', 'destructive', 2500, 'top', true, 'narrow');
        return;
      }

      const startIso = Time.parse(startText.replace(' ', 'T'), { assumeUTC: true }).toISOString();
      const endIso = Time.parse(endText.replace(' ', 'T'), { assumeUTC: true }).toISOString();

      await createSleepSession(startIso, endIso, note.trim() || undefined);
      toast('Sleep created', 'success', 2000, 'top', false, 'narrow');
      Keyboard.dismiss();
      setOpen(false);
    } catch (e) {
      console.error('Failed to create sleep session', e);
      toast('Failed to create sleep session', 'destructive', 2500, 'top', true, 'narrow');
    }
  };

  const isDisabled = !startText.trim() || !endText.trim();

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>
        <Button
          className="mb-4 h-12"
          label="Add a new sleep entry"
          icon={<PlusIcon />}
          variant="ghost"
        />
      </BottomSheetTrigger>

      <BottomSheetContent className="p-8" minHeightRatio={0.8} maxHeightRatio={0.9}>
        <BottomSheetHeader>
          <BottomSheetTitle>New sleep session</BottomSheetTitle>
          <BottomSheetDescription>Set start/end and an optional note</BottomSheetDescription>
        </BottomSheetHeader>

        <View className="px-2">
          <Input
            type="datetime"
            className="mb-4"
            label="Start"
            value={startText}
            onChangeText={setStartText}
          />
          <Input
            type="datetime"
            className="mb-4"
            label="End"
            value={endText}
            onChangeText={setEndText}
          />
          <Input
            className="mb-2"
            label="Note"
            placeholder="Optional note"
            value={note}
            onChangeText={setNote}
            multiline
            returnKeyType="done"
          />
        </View>

        <BottomSheetFooter>
          <Button label="Create" onPress={handleCreate} disabled={isDisabled} />
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
