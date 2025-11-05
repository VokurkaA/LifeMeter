import React, {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Modal as RNModal, TouchableOpacity, View } from 'react-native';
import { cn } from '@/lib/utils';
import { H3, Text } from './Text';

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const ModalContext = createContext<Ctx | null>(null);

export interface ModalRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Modal({ open, defaultOpen, onOpenChange, children }: ModalRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(!!defaultOpen);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? !!open : uncontrolledOpen;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolledOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange],
  );

  const value = useMemo<Ctx>(() => ({ open: actualOpen, setOpen }), [actualOpen, setOpen]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal components must be used within <Modal>');
  return ctx;
}

export interface ModalTriggerProps {
  asChild?: boolean;
  children: React.ReactElement | React.ReactNode;
}

function ModalTrigger({ asChild, children }: ModalTriggerProps) {
  const { setOpen } = useModal();

  if (asChild && React.isValidElement(children)) {
    return cloneElement(children as React.ReactElement, {
      onPress: () => setOpen(true),
      ...(children as any).props,
    });
  }

  return (
    <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.9}>
      {children}
    </TouchableOpacity>
  );
}

export interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  size?: 'sm' | 'md' | 'lg';
  dismissOnBackdropPress?: boolean;
  showClose?: boolean;
}

function ModalContent({
  className,
  children,
  size = 'md',
  dismissOnBackdropPress = true,
  showClose = false,
  ...props
}: ModalContentProps) {
  const { open, setOpen } = useModal();

  const maxWidth = size === 'sm' ? 360 : size === 'lg' ? 720 : 520;

  return (
    <RNModal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
      <TouchableOpacity
        className="h-full w-full"
        activeOpacity={1}
        onPress={() => {
          if (dismissOnBackdropPress) setOpen(false);
        }}
      >
        <View className="flex flex-1 items-center justify-center bg-black/60 dark:bg-black/75">
          <TouchableOpacity
            activeOpacity={1}
            className={cn(
              'w-[92%] rounded-lg border border-border bg-card p-6 shadow-lg',
              className,
            )}
            style={{ maxWidth }}
            onPress={() => {}}
            {...props}
          >
            {showClose && (
              <View className="absolute right-3 top-3">
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                  onPress={() => setOpen(false)}
                  className="h-8 w-8 items-center justify-center rounded-md bg-muted/40"
                >
                  <Text className="text-base text-foreground">×</Text>
                </TouchableOpacity>
              </View>
            )}
            {children}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </RNModal>
  );
}

function ModalHeader({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('mb-4', className)} {...props} />;
}

function ModalTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
  return <H3 className={cn('text-foreground', className)} {...props} />;
}

function ModalDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof Text>) {
  return <Text variant="muted" className={className} {...props} />;
}

function ModalFooter({ className, ...props }: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('mt-6 flex flex-row justify-end gap-2', className)} {...props} />;
}

function ModalClose({
  children,
  ...rest
}: React.ComponentPropsWithoutRef<typeof TouchableOpacity>) {
  const { setOpen } = useModal();
  return (
    <TouchableOpacity onPress={() => setOpen(false)} {...rest}>
      {children}
    </TouchableOpacity>
  );
}

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
};
