import React, {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';

import { cn } from '@/lib/utils';
import { H1, H2, H3, Text } from './Text';
import { useTheme } from '@/lib/theme-provider';

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  ref: React.RefObject<ActionSheetRef | null>;
};

const BottomSheetContext = createContext<Ctx | null>(null);

export interface BottomSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function BottomSheet({ open, defaultOpen, onOpenChange, children }: BottomSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(!!defaultOpen);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? !!open : uncontrolledOpen;
  const ref = useRef<ActionSheetRef | null>(null);

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolledOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange],
  );

  const value = useMemo<Ctx>(() => ({ open: actualOpen, setOpen, ref }), [actualOpen, setOpen]);

  return <BottomSheetContext.Provider value={value}>{children}</BottomSheetContext.Provider>;
}

function useBottomSheet() {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) throw new Error('BottomSheet components must be used within <BottomSheet>');
  return ctx;
}

export interface BottomSheetTriggerProps {
  asChild?: boolean;
  children: React.ReactElement | React.ReactNode;
}

function BottomSheetTrigger({ asChild, children }: BottomSheetTriggerProps) {
  const { setOpen } = useBottomSheet();

  if (asChild && React.isValidElement(children)) {
    const originalOnPress = (children as any).props?.onPress;
    return cloneElement(children as React.ReactElement, {
      onPress: (...args: any[]) => {
        originalOnPress?.(...args);
        setOpen(true);
      },
      ...(children as any).props,
    });
  }

  return (
    <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.9}>
      {children}
    </TouchableOpacity>
  );
}

export interface BottomSheetContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  minHeightRatio?: number; // 0..1
  maxHeightRatio?: number; // 0..1
  closeOnTouchBackdrop?: boolean;
  closeOnPressBack?: boolean;
}

function BottomSheetContent({
  className,
  children,
  minHeightRatio = 0.25,
  maxHeightRatio = 0.9,
  closeOnTouchBackdrop = true,
  closeOnPressBack = true,
  ...rest
}: BottomSheetContentProps) {
  const { height: screenH } = useWindowDimensions();
  const minH = Math.max(0, Math.min(1, minHeightRatio)) * screenH;
  const maxH = Math.max(0, Math.min(1, maxHeightRatio)) * screenH;

  const { open, setOpen, ref } = useBottomSheet();
  const { isDark } = useTheme();

  // Reflect controlled state into the sheet instance
  useEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;
    if (open) {
      sheet.show();
    } else {
      sheet.hide();
    }
  }, [open, ref]);

  return (
    <ActionSheet
      ref={ref}
      gestureEnabled
      drawUnderStatusBar={false}
      statusBarTranslucent
      keyboardHandlerEnabled
      closable
      closeOnTouchBackdrop={closeOnTouchBackdrop}
      closeOnPressBack={closeOnPressBack}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      defaultOverlayOpacity={0.4}
      overlayColor="black"
      containerStyle={{
        backgroundColor: isDark ? 'black' : 'white',
      }}
      indicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: isDark ? 'white' : 'black',
      }}
      safeAreaInsets={{ bottom: true } as any}
    >
      <View
        className={cn(
          // Panel styling to match app design
          'rounded-t-2xl border border-border bg-card px-4 pb-6 pt-3',
          className,
        )}
        style={{ minHeight: minH, maxHeight: maxH }}
        {...rest}
      >
        {children}
      </View>
    </ActionSheet>
  );
}

function BottomSheetHeader({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('mb-4', className)} {...props} />;
}

function BottomSheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
  return <H2 className={cn('text-foreground', className)} {...props} />;
}

function BottomSheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return <Text variant="muted" className={className} {...props} />;
}

function BottomSheetFooter({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('mt-6 flex flex-row justify-end gap-2', className)} {...props} />;
}

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
};
