import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

import { cn } from '@/lib/utils';

const toastVariants = {
    default: 'bg-foreground', destructive: 'bg-destructive', success: 'bg-green-500', info: 'bg-blue-500',
};

interface ToastProps {
    id: number;
    message: string;
    onHide: (id: number) => void;
    variant?: keyof typeof toastVariants;
    duration?: number;
    showProgress?: boolean;
    position?: 'top' | 'bottom';
}

function Toast({ id, message, onHide, variant = 'default', duration = 3000, showProgress = true, position = 'top' }: ToastProps) {
    const opacity = useRef(new Animated.Value(0)).current;
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([Animated.timing(opacity, {
            toValue: 1, duration: 500, useNativeDriver: true,
        }), Animated.timing(progress, {
            toValue: 1, duration: duration - 1000, useNativeDriver: false,
        }), Animated.timing(opacity, {
            toValue: 0, duration: 500, useNativeDriver: true,
        }),]).start(() => onHide(id));
    }, [duration, id, onHide, opacity, progress]);

    return (<Animated.View
        className={cn(
            'absolute left-4 right-4 p-4 rounded-xl shadow-md transform transition-all',
            toastVariants[variant],
            {
                'top-[45px]': position === 'top',
                'bottom-4': position === 'bottom',
            }
        )}
        style={{
            opacity, transform: [{
                translateY: opacity.interpolate({
                    inputRange: [0, 1], outputRange: [-20, 0],
                }),
            },],
        }}
    >
        <Text className="font-semibold text-left text-primary-foreground">{message}</Text>
        {showProgress && (<View className="mt-2 rounded-full">
            <Animated.View
                className="h-1.5 bg-primary-foreground rounded-full opacity-40"
                style={{
                    width: progress.interpolate({
                        inputRange: [0, 1], outputRange: ['0%', '100%'],
                    }),
                }}
            />
        </View>)}
    </Animated.View>);
}

type ToastVariant = keyof typeof toastVariants;

interface ToastMessage {
    id: number;
    text: string;
    variant: ToastVariant;
    duration?: number;
    position?: 'top' | 'bottom';
    showProgress?: boolean;
}

interface ToastContextProps {
    toast: (message: string, variant?: keyof typeof toastVariants, duration?: number, position?: 'top' | 'bottom', showProgress?: boolean) => void;
    removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

interface ToastProviderProps {
    children: React.ReactNode;
    position?: 'top' | 'bottom';
}

function ToastProvider({ children, position: defaultPosition = 'top' }: ToastProviderProps) {
    const [messages, setMessages] = useState<ToastMessage[]>([]);

    const toast: ToastContextProps['toast'] = (message: string, variant: ToastVariant = 'default', duration: number = 3000, position: 'top' | 'bottom' = defaultPosition, showProgress: boolean = true) => {
        setMessages(prev => [...prev, {
            id: Date.now(), text: message, variant, duration, position, showProgress,
        },]);
    };

    const removeToast = (id: number) => {
        setMessages(prev => prev.filter(message => message.id !== id));
    };

    return (<ToastContext.Provider value={{ toast, removeToast }}>
        {children}
        {messages.map(message => (<Toast
            key={message.id}
            id={message.id}
            message={message.text}
            variant={message.variant}
            duration={message.duration}
            showProgress={message.showProgress}
            position={message.position}
            onHide={removeToast}
        />))}
    </ToastContext.Provider>);
}

function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export { Toast, ToastProvider, ToastVariant, toastVariants, useToast };

