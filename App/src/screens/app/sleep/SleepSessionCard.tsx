import React, { memo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { H1, Text } from '@/components/ui/Text';
import { useStore } from '@/contexts/useStore';
import { SleepSession } from '@/types';
import { Time } from '@/lib/Time';
import DeleteIcon from '@/components/icons/delete';
import { useToast } from '@/components/ui/Toast';
import EditSleep from './EditSleep.sheet'; // <— add this

type Props = { session: SleepSession };

function SleepSessionCardBase({ session }: Props) {
  const { deleteSleepSession } = useStore();
  const { toast } = useToast();

  return (
    <Card className="mb-4">
      <CardHeader>
        <H1>{Time.format(session.startAt, 'D.M.YYYY')}</H1>
      </CardHeader>
      <CardContent>
        <Text>
          {Time.from(session.startAt).format('HH:mm')} - {Time.from(session.endAt).format('HH:mm')}
        </Text>
        <Text>{Time.between(session.startAt, session.endAt).format('HH:mm:ss')}</Text>
        {session.note ? (
          <Text className="text-muted-foreground">{session.note}</Text>
        ) : (
          <Text className="italic text-muted-foreground">No note</Text>
        )}
      </CardContent>
      <CardFooter className="flex flex-row">
        <Button
          className="mr-4 flex-1 py-6"
          label=""
          icon={<DeleteIcon />}
          variant="destructive"
          size="sm"
          onPress={async () => {
            try {
              await deleteSleepSession(session.id);
            } catch {
              toast('Failed to delete sleep session', 'destructive', 2500, 'top', true, 'narrow');
            }
          }}
        />
        {/* restore edit trigger */}
        <EditSleep session={session} />
      </CardFooter>
    </Card>
  );
}

const SleepSessionCard = memo(SleepSessionCardBase);
export default SleepSessionCard;
