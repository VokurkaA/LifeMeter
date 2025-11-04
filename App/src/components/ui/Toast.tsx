import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { cn } from '@/lib/utils';

const toastVariants = {
  default: 'bg-foreground/90',
  destructive: 'bg-destructive/90',
  success: 'bg-green-500/90',
  info: 'bg-blue-500/90',
};

interface ToastProps {
  id: number;
  message: string;
  onHide: (id: number) => void;
  variant?: keyof typeof toastVariants;
  duration?: number;
  showProgress?: boolean;
  size?: 'full' | 'narrow';
}
function Toast({
  id,
  message,
  onHide,
  variant = 'default',
  duration = 3000,
  showProgress = true,
  size = 'full',
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  // Subtle timing and motion
  const fadeInMs = 250;
  const fadeOutMs = 250;
  const progressDuration = Math.max(0, duration - (fadeInMs + fadeOutMs));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: fadeInMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: progressDuration,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: fadeOutMs,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onHide(id));
  }, [duration, id, onHide, opacity, progress, fadeInMs, fadeOutMs, progressDuration]);

  const isNarrow = size === 'narrow';

  return (
    <Animated.View
      className={`
      ${toastVariants[variant]}
      m-2 mb-1 p-3 rounded-md shadow-sm border border-black/10 dark:border-white/10
      `}
      style={{
      opacity,
      transform: [
        {
        translateY: opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [-6, 0],
        }),
        },
      ],
      alignSelf: isNarrow ? 'center' : 'flex-start',
      // maxWidth: isNarrow ? 420 : undefined,
      }}
    >
      <Text className={`${isNarrow ? 'text-center' : 'text-left'} font-medium text-background/90`}>{message}</Text>
      {showProgress && (
      <View className="mt-2 rounded">
        <Animated.View
        className="h-1.5 bg-white/60 dark:bg-white/30 rounded-full"
        style={{
          width: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', '100%'],
          }),
        }}
        />
      </View>
      )}
    </Animated.View>
  );
}

type ToastVariant = keyof typeof toastVariants;
type ToastSize = 'full' | 'narrow';

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
  duration?: number;
  position?: string;
  showProgress?: boolean;
  size?: ToastSize;
}
interface ToastContextProps {
  toast: (
    message: string,
    variant?: keyof typeof toastVariants,
    duration?: number,
    position?: 'top' | 'bottom',
    showProgress?: boolean,
    size?: ToastSize
  ) => void;
  removeToast: (id: number) => void;
}
const ToastContext = createContext<ToastContextProps | undefined>(undefined);

// TODO: refactor to pass position to Toast instead of ToastProvider
function ToastProvider({
  children,
  position = 'top',
}: {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast: ToastContextProps['toast'] = (
    message: string,
    variant: ToastVariant = 'default',
    duration: number = 3000,
    position: 'top' | 'bottom' = 'top',
    showProgress: boolean = true,
    size: ToastSize = 'full'
  ) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        text: message,
        variant,
        duration,
        position,
        showProgress,
        size,
      },
    ]);
  };

  const removeToast = (id: number) => {
    setMessages(prev => prev.filter(message => message.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <View
        className={cn('absolute left-0 right-0', {
          'top-[45px]': position === 'top',
          'bottom-0': position === 'bottom',
        })}
      >
        {messages.map(message => (
          <Toast
            key={message.id}
            id={message.id}
            message={message.text}
            variant={message.variant}
            duration={message.duration}
            showProgress={message.showProgress}
            size={message.size}
            onHide={removeToast}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export { Toast, ToastProvider, ToastVariant, toastVariants, useToast };

