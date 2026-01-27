import { Select, TextField } from "heroui-native"; 
import { Pressable, View, ActivityIndicator } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
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
};

export default function ComboBox({ items, onValueChange, selectedOption, onSearchQueryChange, isLoading }: ComboBoxProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 600);

  const displayValue = selectedOption ? selectedOption.label : "";

  const filteredItems = onSearchQueryChange
    ? items
    : items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

  useEffect(() => {
    onSearchQueryChange?.(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearchQueryChange]);

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
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoFocus
            />
          </TextField>

          <ScrollView
            className="h-64"
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {isLoading && (
              <View className="p-4 items-center">
                <ActivityIndicator />
              </View>
            )}

            {!isLoading && filteredItems.map((item) => (
              <Select.Item
                key={item.value}
                value={item.value}
                label={item.label}
                onPress={() => {
                  KeyboardController.dismiss();
                  setSearchQuery(item.label);
                }}
              />
            ))}

            {!isLoading && filteredItems.length === 0 && (
              <View className="p-4 items-center opacity-50">
                <Text>No options found</Text>
              </View>
            )}
          </ScrollView>
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}