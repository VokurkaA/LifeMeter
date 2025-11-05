import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { cn } from '@/lib/utils';

// TODO: make controlled (optional)
interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof View> {
  label?: string;
  labelClasses?: string;
  checkboxClasses?: string;
}
function Checkbox({ label, labelClasses, checkboxClasses, className, ...props }: CheckboxProps) {
  const [isChecked, setChecked] = useState(false);

  const toggleCheckbox = () => {
    setChecked((prev) => !prev);
  };

  return (
    <View className={cn('flex flex-row items-center gap-2', className)} {...props}>
      <TouchableOpacity onPress={toggleCheckbox}>
        <View
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded border border-gray-700 bg-background',
            {
              'bg-foreground': isChecked,
            },
            checkboxClasses,
          )}
        >
          {isChecked && <Text className="text-xs text-background">✓</Text>}
        </View>
      </TouchableOpacity>
      {label && <Text className={cn('text-primary', labelClasses)}>{label}</Text>}
    </View>
  );
}

export { Checkbox };
