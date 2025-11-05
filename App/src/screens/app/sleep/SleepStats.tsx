import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/Card';
import { H1, Text } from '@/components/ui/Text';
import { useStore } from '@/contexts/useStore';
import { Time } from '@/lib/Time';
import { averageSleepDurationMs, averageTimeOfDayMinutes, formatMinutesAsTime } from './utils';

export default function SleepStats() {
  const { sleepSessions } = useStore();
  const [days, setDays] = useState(7);

  const avgDurMs = useMemo(
    () => averageSleepDurationMs(sleepSessions, days),
    [sleepSessions, days],
  );
  const avgBedMinutes = useMemo(
    () => averageTimeOfDayMinutes(sleepSessions, days, 'start'),
    [sleepSessions, days],
  );
  const avgWakeMinutes = useMemo(
    () => averageTimeOfDayMinutes(sleepSessions, days, 'end'),
    [sleepSessions, days],
  );

  return (
    <Card className="mb-4">
      <CardHeader>
        <H1>Sleep stats</H1>
        <CardDescription>Averages over the last {days} days</CardDescription>
      </CardHeader>
      <CardContent className="gap-2">
        <View className="mb-2 flex-row gap-2">
          <Button
            label="7d"
            size="sm"
            variant={days === 7 ? 'default' : 'ghost'}
            onPress={() => setDays(7)}
          />
          <Button
            label="14d"
            size="sm"
            variant={days === 14 ? 'default' : 'ghost'}
            onPress={() => setDays(14)}
          />
          <Button
            label="30d"
            size="sm"
            variant={days === 30 ? 'default' : 'ghost'}
            onPress={() => setDays(30)}
          />
        </View>

        <View className="flex-row justify-between">
          <Text className="text-muted-foreground">Avg sleep duration</Text>
          <Text>{avgDurMs == null ? '—' : Time.formatDurationMs(avgDurMs, 'HH:mm')}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-muted-foreground">Avg bedtime</Text>
          <Text>{formatMinutesAsTime(avgBedMinutes)}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-muted-foreground">Avg wake-up</Text>
          <Text>{formatMinutesAsTime(avgWakeMinutes)}</Text>
        </View>
      </CardContent>
    </Card>
  );
}
