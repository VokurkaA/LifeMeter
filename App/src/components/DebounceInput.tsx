import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { TextInput } from 'react-native';
import { Input, type InputProps } from './ui/Input';

export interface DebounceInputProps extends Omit<InputProps, 'onChangeText' | 'value'> {
  value?: string;
  defaultValue?: string;
  delay?: number;
  onChangeText?: (text: string) => void;
  onDebouncedChange?: (text: string) => void;
  leading?: boolean;
}

export interface DebounceInputHandle {
  focus: () => void;
  clear: () => void;
  flush: () => void;
  getValue: () => string;
}

export const DebounceInput = forwardRef<DebounceInputHandle, DebounceInputProps>(
  (
    { value, defaultValue, delay = 400, onChangeText, onDebouncedChange, leading = false, ...rest },
    ref,
  ) => {
    const inputRef = useRef<TextInput | null>(null);
    const [inner, setInner] = useState<string>(() => value ?? defaultValue ?? '');
    const lastEmittedRef = useRef<string>(inner);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasLedRef = useRef(false);

    useEffect(() => {
      if (value !== undefined && value !== inner) {
        setInner(value);
      }
    }, [inner, value]);

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const flush = useCallback(() => {
      clearTimer();
      if (onDebouncedChange && lastEmittedRef.current !== inner) {
        lastEmittedRef.current = inner;
        onDebouncedChange(inner);
      }
    }, [inner, onDebouncedChange]);

    useEffect(() => {
      return () => {
        clearTimer();
      };
    }, []);

    const handleChange = (text: string) => {
      setInner(text);
      onChangeText?.(text);

      clearTimer();

      if (leading && !hasLedRef.current && onDebouncedChange) {
        hasLedRef.current = true;
        lastEmittedRef.current = text;
        onDebouncedChange(text);
        return;
      }

      timerRef.current = setTimeout(() => {
        if (onDebouncedChange && lastEmittedRef.current !== text) {
          lastEmittedRef.current = text;
          onDebouncedChange(text);
        }
      }, delay);
    };

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => {
          setInner('');
          clearTimer();
        },
        flush,
        getValue: () => inner,
      }),
      [inner, flush],
    );

    return <Input ref={inputRef} value={inner} onChangeText={handleChange} {...rest} />;
  },
);

DebounceInput.displayName = 'DebounceInput';
