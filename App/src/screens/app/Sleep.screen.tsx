import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { H1, Text } from "@/components/ui/Text";
import { useStore } from "@/contexts/useStore";
import { formatDateLike } from "@/lib/utils";
import { SleepSession } from "@/types";
import { ScrollView } from "react-native";

export default function SleepScreen() {
  const { sleepSessions } = useStore();
  // new sleep / end a sleep
  // last sleep
  // average sleep
  // some sleep stats
  // graphs

  return (
    <ScrollView className="flex flex-1 p-4 bg-background">
      <Card>
        <CardHeader>
          <H1>Sleep</H1>
        </CardHeader>
        {sleepSessions.length === 0 ? (<NewSleepSessionCard />) : sleepSessions[0].endAt === null && <EndSleepSessionCard />}
        <CardContent>
          {sleepSessions.length > 1 && sleepSessions.map((session: SleepSession) => (
            <Text key={session.id} className="mb-2">
              Sleep from {formatDateLike(session.startAt, {format: 'datetime'})} to {session.endAt ? formatDateLike(session.endAt, {format: 'datetime'}) : 'ongoing'}
            </Text>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}

// Use store actions so UI updates immediately
const NewSleepSessionCard = () => {
  const { startSleep } = useStore();
  return (
    <Button label="Track sleep" onPress={async () => startSleep()} />
  );
}

const EndSleepSessionCard = () => {
  const { endSleep } = useStore();
  return (
    <Button label="End sleep" onPress={async () => endSleep()} />
  );
}
