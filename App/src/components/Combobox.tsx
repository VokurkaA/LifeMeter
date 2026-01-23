import { Select, TextField } from "heroui-native"; // Removed Button, ensure Icon is imported if needed
import { Pressable, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useState, useEffect } from "react";
import { Text } from "@/components/Text";
import { KeyboardController } from "react-native-keyboard-controller";
import { ChevronDown } from "lucide-react-native"; // Or your preferred icon library
import { foodService } from "@/services/food.service";

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
};

export default function ComboBox({ items, onValueChange, selectedOption, onSearchQueryChange }: ComboBoxProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const displayValue = selectedOption ? selectedOption.label : "";

  const filteredItems = onSearchQueryChange
    ? items
    : items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchQueryChange?.(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchQueryChange]);

  const handleOnChange = (option: SelectOption | undefined) => {
    onValueChange?.(option);
    foodService.getFoodById(Number(option?.value)).then((res) => {
      console.log("Selected food item:", JSON.stringify(res));
    });
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
            {filteredItems.map((item) => (
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

            {filteredItems.length === 0 && (
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