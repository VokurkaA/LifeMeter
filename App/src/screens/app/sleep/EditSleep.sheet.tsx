import { Button } from '@/components/ui/Button';
import { useStore } from '@/contexts/useStore';
import { View, Keyboard } from 'react-native';
import { SleepSession } from '@/types';
import { Time } from '@/lib/Time';
import EditIcon from '@/components/icons/edit';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet';

export default function EditSleep({ session }: { session: SleepSession }) {
  const { editSleepSession } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [startText, setStartText] = useState(Time.format(session.startAt, 'YYYY-MM-DD HH:mm'));
  const [endText, setEndText] = useState(
    session.endAt ? Time.format(session.endAt, 'YYYY-MM-DD HH:mm') : '',
  );
  const [note, setNote] = useState(session.note ?? '');

  const handleSave = async () => {
    try {
      const startIso = Time.parse(startText.replace(' ', 'T'), { assumeUTC: true }).toISOString();
      const endIso = endText.trim()
        ? Time.parse(endText.replace(' ', 'T'), { assumeUTC: true }).toISOString()
        : null;
      await editSleepSession(session.id, {
        startAt: startIso,
        endAt: endIso,
        note: note.trim() || null,
      });
      toast('Sleep updated', 'success', 2000, 'top', false, 'narrow');
      Keyboard.dismiss();
      setOpen(false);
    } catch (e) {
      console.error('Failed to save sleep session', e);
      toast('Failed to save sleep session', 'destructive', 2500, 'top', true, 'narrow');
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>
        <Button className="flex-1 py-6" label="" icon={<EditIcon />} variant="ghost" size="sm" />
      </BottomSheetTrigger>
      <BottomSheetContent className="p-8" minHeightRatio={0.8} maxHeightRatio={0.9}>
        <BottomSheetHeader className="">
          <BottomSheetTitle>Edit sleep session</BottomSheetTitle>
          <BottomSheetDescription>
            {Time.format(session.startAt, 'D.M.YYYY')} ·{' '}
            {Time.between(session.startAt, session.endAt).format('hh:mm:ss')}
          </BottomSheetDescription>
        </BottomSheetHeader>

        <View className="px-2">
          <Input
            type="datetime"
            className="mb-4"
            label="Start"
            value={startText}
            onChangeText={setStartText}
          />
          <Input className="mb-4" label="End" value={endText} onChangeText={setEndText} />
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
          <Button label="Save" onPress={handleSave} />
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
