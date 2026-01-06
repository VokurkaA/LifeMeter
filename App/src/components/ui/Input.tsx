import { Eye, EyeOff } from 'lucide-react-native';
import React, { forwardRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from './Text'; // Ensure path matches your project
import { cn } from '@/lib/utils';
import { InputKind, typeDefaults } from '@/types/input.types'; // Ensure path matches

type ReturnFocus = (() => void) | { current: TextInput | null };

export interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
  onReturnFocus?: ReturnFocus;
  type?: InputKind;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    {
      className,
      label,
      labelClasses,
      inputClasses,
      onReturnFocus,
      onSubmitEditing,
      type,
      accessibilityLabel,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password' || type === 'confirmPassword';

    const handleSubmitEditing: typeof onSubmitEditing = (e) => {
      onSubmitEditing?.(e);
      if (typeof onReturnFocus === 'function') {
        onReturnFocus();
      } else {
        onReturnFocus?.current?.focus();
      }
    };

    const defaults = type ? typeDefaults[type] : {};
    const mergedProps = { ...defaults, ...props } as React.ComponentPropsWithoutRef<
      typeof TextInput
    >;
    const mergedA11yLabel =
      accessibilityLabel ?? label ?? (defaults.accessibilityLabel as string | undefined);

    const hasRightElement = isPasswordType || !!rightIcon;

    return (
      <View className="flex flex-col gap-1.5">
        {label && <Text className={cn('text-input-label', labelClasses)}>{label}</Text>}

        <View className="relative">
          <TextInput
            ref={ref}
            className={cn(
              inputClasses,
              'rounded-lg border border-input-border px-4 py-2.5 text-input-foreground placeholder:text-input-placeholder',
              hasRightElement && 'pr-10',
              className,
            )}
            {...mergedProps}
            accessibilityLabel={mergedA11yLabel}
            onSubmitEditing={handleSubmitEditing}
            secureTextEntry={
              isPasswordType ? !showPassword : (mergedProps.secureTextEntry as boolean | undefined)
            }
          />

          {isPasswordType ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
              className="absolute top-0 bottom-0 justify-center right-3"
            >
              {showPassword ? (
                <EyeOff size={20} color="#8E8E93" />
              ) : (
                <Eye size={20} color="#8E8E93" />
              )}
            </Pressable>
          ) : (
            rightIcon && (
              <View className="absolute top-0 bottom-0 justify-center right-3">{rightIcon}</View>
            )
          )}
        </View>
      </View>
    );
  },
);

Input.displayName = 'Input';

export { Input };
