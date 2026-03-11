import React, { useState, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { Text } from '@/components/Text';
import { cn } from '@/lib/utils';
type DatePickerProps = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};
export default function DatePicker({ selectedDate, setSelectedDate }: DatePickerProps) {
  const foregroundColor = useThemeColor('foreground');
  const mutedColor = useThemeColor('muted');

  const getToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

  const today = useMemo(() => getToday(), []);

  const [startDate, setStartDate] = useState(() => addDays(today, -6));

  const visibleDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  const handlePrev = useCallback(() => {
    const newDate = addDays(selectedDate, -1);
    setSelectedDate(newDate);
    const diffTime = newDate.getTime() - startDate.getTime();
    const indexInWindow = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (indexInWindow <= 0) {
      setStartDate(addDays(newDate, -1));
    }
  }, [selectedDate, startDate]);

  const isTodaySelected = isSameDay(selectedDate, today);

  const handleNext = useCallback(() => {
    if (isTodaySelected) return;

    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);

    const diffTime = newDate.getTime() - startDate.getTime();
    const indexInWindow = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (indexInWindow >= 6) {
      if (isSameDay(newDate, today)) {
        setStartDate(addDays(today, -6));
      } else {
        setStartDate(addDays(newDate, -5));
      }
    }
  }, [selectedDate, startDate, today, isTodaySelected]);


  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <View className="flex-row items-center justify-between w-full bg-surface p-2 rounded-2xl">
      <Container
        className="bg-border"
        onPress={handlePrev}
      >
        <ChevronLeft size={20} color={foregroundColor} />
      </Container>

      {visibleDates.map((date) => {
        const isSelected = isSameDay(date, selectedDate);
        const dayNumber = date.getDate();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' });

        return (
          <Container
            key={date.toDateString()}
            className={isSelected ? "bg-foreground" : "bg-transparent"}
            onPress={() => handleDatePress(date)}
          >
            <View className="items-center">
              <Text className={`text-xs ${isSelected ? 'text-background' : 'text-muted'}`}>
                {dayName}
              </Text> 
              <Text className={`text-lg ${isSelected ? 'text-background font-black' : 'text-foreground font-bold'}`}>
                {dayNumber}
              </Text>
            </View>
          </Container>
        );
      })}

      <Container
        className="bg-border"
        isDisabled={isTodaySelected}
        onPress={handleNext}
      >
        <ChevronRight
          size={20}
          color={isTodaySelected ? mutedColor : foregroundColor}
        />
      </Container>
    </View>
  );
};


interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
  onPress?: () => void;
}

const Container = ({ children, className = '', isDisabled = false, onPress }: ContainerProps) => {
  return (
    <PressableFeedback
      isAnimatedStyleActive={false}
      onPress={isDisabled ? undefined : onPress}
      isDisabled={isDisabled}
      className={cn(
        "items-center justify-center w-8 h-16 rounded-xl",
        isDisabled ? "opacity-50" : "",
        className
      )}
    >
      <PressableFeedback.Highlight />
      {children}
    </PressableFeedback>
  );
}