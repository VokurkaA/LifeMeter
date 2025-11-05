import { FlatList, RefreshControl, InteractionManager, ScrollView, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/contexts/useStore';
import { Skeleton } from '@/components/ui/Skeleton';
import SleepControls from './SleepControls';
import SleepStats from './SleepStats';
import SleepSessionCard from './SleepSessionCard';
import { useFocusEffect } from '@react-navigation/native';
import CreateSleep from './CreateSleep.sheet';

export default function SleepScreen() {
  const { sleepSessions, ongoingSleepSession, refreshSleepSessions } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSleepSessions();
    } finally {
      setRefreshing(false);
    }
  }, [refreshSleepSessions]);

  useFocusEffect(
    useCallback(() => {
      refreshSleepSessions().catch(() => void 0);
    }, [refreshSleepSessions]),
  );

  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        if (mounted) setReady(true);
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  const data = useMemo(
    () => (ongoingSleepSession ? sleepSessions.slice(1) : sleepSessions),
    [sleepSessions, ongoingSleepSession],
  );

  if (!ready) {
    return (
      <ScrollView className="flex flex-1 bg-background p-4">
        <SleepControls />
        <SleepStats />
        <View className="mt-4 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </View>
      </ScrollView>
    );
  }

  return (
    <FlatList
      className="flex flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      data={data}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={
        <>
          <SleepControls />
          <SleepStats />
          <CreateSleep />
        </>
      }
      renderItem={({ item }) => <SleepSessionCard session={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      windowSize={5}
      removeClippedSubviews
      updateCellsBatchingPeriod={50}
    />
  );
}
