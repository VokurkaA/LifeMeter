import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { TextField } from 'heroui-native';
import { useCallback, useRef } from 'react';
import { TextInput, type FocusEvent, type BlurEvent, findNodeHandle } from 'react-native';

export const BottomSheetTextInput = (props: React.ComponentProps<typeof TextField.Input>) => {
  const { animatedKeyboardState, textInputNodesRef } = useBottomSheetInternal();
  
  const handleOnFocus = useCallback(
    (e: FocusEvent) => {
      animatedKeyboardState.set((state) => ({
        ...state,
        target: e.nativeEvent.target,
      }));
      props.onFocus?.(e);
    },
    [animatedKeyboardState, props.onFocus]
  );

  const handleOnBlur = useCallback(
    (e: BlurEvent) => {
      const keyboardState = animatedKeyboardState.get();
      const currentFocusedInput = findNodeHandle(
        TextInput.State.currentlyFocusedInput() as TextInput | null
      );
      const shouldRemoveCurrentTarget = keyboardState.target === e.nativeEvent.target;
      const shouldIgnoreBlurEvent =
        currentFocusedInput && textInputNodesRef.current.has(currentFocusedInput);

      if (shouldRemoveCurrentTarget && !shouldIgnoreBlurEvent) {
        animatedKeyboardState.set((state) => ({
          ...state,
          target: undefined,
        }));
      }
      props.onBlur?.(e);
    },
    [animatedKeyboardState, textInputNodesRef, props.onBlur]
  );

  return (
    <TextField.Input
      {...props}
      onFocus={handleOnFocus}
      onBlur={handleOnBlur}
    />
  );
};