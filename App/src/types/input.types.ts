import type { TextInput } from 'react-native';

export type InputKind =
  | 'name'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'date'
  | 'time'
  | 'datetime';

export const typeDefaults: Record<
  InputKind,
  Partial<React.ComponentPropsWithoutRef<typeof TextInput>>
> = {
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
  date: {
    autoCapitalize: 'none',
    autoCorrect: false,
    spellCheck: false,
    keyboardType: 'numbers-and-punctuation',
    textContentType: 'none',
    autoComplete: 'off',
    returnKeyType: 'next',
    enablesReturnKeyAutomatically: true,
    importantForAutofill: 'yes',
    accessibilityLabel: 'Date',
    placeholder: 'YYYY-MM-DD',
    blurOnSubmit: false,
  },
  time: {
    autoCapitalize: 'none',
    autoCorrect: false,
    spellCheck: false,
    keyboardType: 'numbers-and-punctuation',
    textContentType: 'none',
    autoComplete: 'off',
    returnKeyType: 'next',
    enablesReturnKeyAutomatically: true,
    importantForAutofill: 'yes',
    accessibilityLabel: 'Time',
    placeholder: 'HH:mm',
    blurOnSubmit: false,
  },
  datetime: {
    autoCapitalize: 'none',
    autoCorrect: false,
    spellCheck: false,
    keyboardType: 'numbers-and-punctuation',
    textContentType: 'none',
    autoComplete: 'off',
    returnKeyType: 'next',
    enablesReturnKeyAutomatically: true,
    importantForAutofill: 'yes',
    accessibilityLabel: 'Date and time',
    placeholder: 'YYYY-MM-DD HH:mm',
    blurOnSubmit: false,
  },
};
