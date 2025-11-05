import Ticker from '@/components/Ticker';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { H1, Text } from '@/components/ui/Text';
import { useStore } from '@/contexts/useStore';
import { Time } from '@/lib/Time';

export default function SleepControls() {
  const { ongoingSleepSession } = useStore();
  return ongoingSleepSession ? <EndSleepSessionCard /> : <NewSleepSessionCard />;
}

function NewSleepSessionCard() {
  const { startSleep } = useStore();
  return (
    <Button className="mb-4 h-16" label="Sleep now" size="lg" onPress={async () => startSleep()} />
  );
}

function EndSleepSessionCard() {
  const { endSleep, ongoingSleepSession } = useStore();

  return (
    <Ticker interval={1000}>
      {() => (
        <Card className="mb-4">
          <CardHeader>
            <H1 className="my-8 text-center">
              {Time.since(ongoingSleepSession?.startAt).format('HH:mm:ss')}
            </H1>
          </CardHeader>
          <CardContent>
            <Text>
              Sleeping from {Time.from(ongoingSleepSession?.startAt).format('dddd, h:mm A')}
            </Text>
            <Button className="h-16" size="lg" label="End sleep" onPress={async () => endSleep()} />
          </CardContent>
        </Card>
      )}
    </Ticker>
  );
}
