import React from 'react';
import { FlatList, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function ScrollView({ children, className }: Props) {
  const items = React.Children.toArray(children);

  return (
    <View className={className}>
      <FlatList
        data={items}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => item as React.ReactElement}
        keyExtractor={(_, i) => String(i)}
      />
    </View>
  );
}
