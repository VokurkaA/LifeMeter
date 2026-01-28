import { Select, TextField } from "heroui-native"; 
import { Pressable, View, ActivityIndicator } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useState, useEffect } from "react";
import { Text } from "@/components/Text";
import { KeyboardController } from "react-native-keyboard-controller";
import { useDebounce } from "@/lib/useDebounce";

KeyboardController.preload();

export type SelectOption = {
  label: string;
  value: string;
};

type ComboBoxProps = {
  items: SelectOption[];
  selectedOption?: SelectOption;
  onValueChange?: (option: SelectOption | undefined) => void;
  onSearchQueryChange?: (query: string) => void;
  isLoading?: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onEndReached?: () => void;
};

export default function ComboBox({ items, onValueChange, selectedOption, onSearchQueryChange, isLoading, searchQuery: controlledQuery, setSearchQuery, onEndReached }: ComboBoxProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const query = controlledQuery !== undefined ? controlledQuery : localSearchQuery;
  const setQuery = setSearchQuery ?? setLocalSearchQuery;

  const debouncedQuery = useDebounce(query, 300);

  const displayValue = selectedOption ? selectedOption.label : "";

  const filteredItems = onSearchQueryChange
    ? items
    : items.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );

  useEffect(() => {
    onSearchQueryChange?.(debouncedQuery);
  }, [debouncedQuery, onSearchQueryChange]);

  const handleOnChange = (option: SelectOption | undefined) => {
    onValueChange?.(option);
  };

  return (
    <Select onValueChange={handleOnChange} value={selectedOption}>
      <Select.Trigger asChild>
        <Pressable>
          <TextField>
            <TextField.Input
              placeholder="Select an option"
              value={displayValue}
              editable={false}
              pointerEvents="none"
            />
          </TextField>
        </Pressable>
      </Select.Trigger>

      <Select.Portal>
        <Select.Overlay onPress={() => KeyboardController.dismiss()} />

        <Select.Content
          isSwipeable={false}
          presentation="dialog"
          className="absolute -bottom-8 w-full rounded-2xl bg-surface p-4"
        >
          <View className="flex flex-row justify-between mb-4">
            <Select.ListLabel>Choose an option</Select.ListLabel>
            <Select.Close />
          </View>

          <TextField className="mb-4">
            <TextField.Input
              placeholder="Search options..."
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoFocus
            />
          </TextField>

          <FlatList
            className="h-64"
            data={filteredItems}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Select.Item
                key={item.value}
                value={item.value}
                label={item.label}
                onPress={() => {
                  KeyboardController.dismiss();
                }}
              />
            )}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isLoading ? (
              <View className="p-4 items-center">
                <ActivityIndicator />
              </View>
            ) : null}
            ListEmptyComponent={!isLoading ? (
              <View className="p-4 items-center opacity-50">
                <Text>No options found</Text>
              </View>
            ) : null}
          />
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}