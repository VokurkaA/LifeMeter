import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Text } from '@/components/ui/Text';
import { ChevronIcon } from '@/components/icons/chevron';
import { DebounceInput } from '@/components/DebounceInput';
import { cn } from '@/lib/utils';

export type SelectOption = {
  label: string;
  value: string;
};

interface SelectProps {
  title?: string;
  placeholder?: string;
  withSearchbar?: boolean;
  value?: string;
  /**
   * Callback for when the selected value changes (non-search mode)
   * OR when the search text changes immediately (search mode)
   */
  onChange?: (value: string) => void;
  variants: SelectOption[];
  onSelect?: (option: SelectOption) => void;
  className?: string;
  /**
   * Callback specifically for the Debounced search action
   */
  onSearch?: (query: string) => void;
}

export function Select({
  title = 'Select…',
  placeholder = 'Select an option',
  withSearchbar = false,
  value = '',
  onChange,
  variants,
  onSelect,
  className,
  onSearch,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOnSelect = (option: SelectOption) => {
    if (!withSearchbar) {
      onChange?.(option.value);
    }
    onSelect?.(option);
    setIsOpen(false);
  };

  const handleDebouncedSearch = (text: string) => {
    onSearch?.(text);
  };

  return (
    <View className={cn('z-50', className)}>
      {title && <Text className="mb-1 text-input-label">{title}</Text>}

      {withSearchbar ? (
        <DebounceInput
          delay={500}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          onDebouncedChange={handleDebouncedSearch}
          onFocus={() => setIsOpen(true)}
        />
      ) : (
        <Pressable
          className="rounded-lg border border-input-border px-4 py-2.5 text-input-foreground placeholder:text-input-placeholder"
          onPress={() => setIsOpen((prev) => !prev)}
        >
          {value ? (
            <Text>{value || placeholder}</Text>
          ) : (
            <View className="flex flex-row items-center justify-between">
              <Text>Select an option</Text>
              <ChevronIcon />
            </View>
          )}
        </Pressable>
      )}

      {isOpen && variants.length > 0 && (
        <ScrollView
          className="absolute top-full mt-1 max-h-60 w-full rounded-lg border border-input-border bg-card px-4 py-2.5 text-input-foreground shadow-lg"
          style={{ zIndex: 1000, elevation: 5 }}
          waitFor={[]}
          simultaneousHandlers={[]}
          nestedScrollEnabled={true}
        >
          {variants.map((variant) => (
            <Pressable
              key={variant.value}
              onPress={() => handleOnSelect(variant)}
              className="py-2 border-b border-input-border last:border-0"
            >
              <Text>{variant.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
