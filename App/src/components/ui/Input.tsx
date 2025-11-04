import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from './Text';

import { cn } from '@/lib/utils';

type ReturnFocus = (() => void) | { current: TextInput | null };
type InputKind = 'name' | 'email' | 'password' | 'confirmPassword';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
  onReturnFocus?: ReturnFocus;
  type?: InputKind;
}

const typeDefaults: Record<InputKind, Partial<React.ComponentPropsWithoutRef<typeof TextInput>>> = {
  name: {
    autoCapitalize: 'words',
    autoCorrect: false,
    spellCheck: false,
    textContentType: 'name',
    autoComplete: 'name',
    inputMode: 'text',
    returnKeyType: 'next',
    enablesReturnKeyAutomatically: true,
    importantForAutofill: 'yes',
    accessibilityLabel: 'Name',
    blurOnSubmit: false,
  },
  email: {
    autoCapitalize: 'none',
    autoCorrect: false,
    spellCheck: false,
    keyboardType: 'email-address',
    inputMode: 'email',
    textContentType: 'emailAddress',
    autoComplete: 'email',
    returnKeyType: 'next',
    enablesReturnKeyAutomatically: true,
    importantForAutofill: 'yes',
    accessibilityLabel: 'Email',
    blurOnSubmit: false,
  },
  password: {
    secureTextEntry: true,
    autoCapitalize: 'none',
    autoCorrect: false,
    spellCheck: false,
    textContentType: 'newPassword',
    autoComplete: 'new-password',
    inputMode: 'text',
    returnKeyType: 'next',
    enablesReturnKeyAutomatically: true,
    importantForAutofill: 'yes',
    accessibilityLabel: 'Password',
    passwordRules: 'minlength: 6;',
    blurOnSubmit: false,
  },
  confirmPassword: {
    secureTextEntry: true,
    autoCapitalize: 'none',
    autoCorrect: false,
    spellCheck: false,
    textContentType: 'newPassword',
    autoComplete: 'new-password',
    inputMode: 'text',
    returnKeyType: 'done',
    enablesReturnKeyAutomatically: true,
    importantForAutofill: 'yes',
    accessibilityLabel: 'Confirm password',
    passwordRules: 'minlength: 6;',
  },
};

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
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password' || type === 'confirmPassword';

    const handleSubmitEditing: typeof onSubmitEditing = e => {
      onSubmitEditing?.(e);
      if (typeof onReturnFocus === 'function') {
        onReturnFocus();
      } else {
        onReturnFocus?.current?.focus();
      }
    };

    const defaults = type ? typeDefaults[type] : {};
    // Merge defaults with incoming props; incoming props win.
    const mergedProps = { ...defaults, ...props } as React.ComponentPropsWithoutRef<typeof TextInput>;
    const mergedA11yLabel = accessibilityLabel ?? label ?? (defaults.accessibilityLabel as string | undefined);

    return (
      <View className={cn('flex flex-col gap-1.5', className)}>
        {label && <Text className={cn('text-input-label', labelClasses)}>{label}</Text>}

        <View className="relative">
          <TextInput
            ref={ref}
            className={cn(
              inputClasses,
              'border border-input-border text-input-foreground placeholder:text-input-placeholder py-2.5 px-4 rounded-lg',
              isPasswordType && 'pr-10'
            )}
            {...mergedProps}
            accessibilityLabel={mergedA11yLabel}
            onSubmitEditing={handleSubmitEditing}
            secureTextEntry={isPasswordType ? !showPassword : (mergedProps.secureTextEntry as boolean | undefined)}
          />

          {isPasswordType && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword(prev => !prev)}
              hitSlop={8}
              className="absolute top-0 bottom-0 justify-center right-3"
            >
              {showPassword ? <EyeOff size={20} color="#8E8E93" /> : <Eye size={20} color="#8E8E93" />}
            </Pressable>
          )}
        </View>
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
