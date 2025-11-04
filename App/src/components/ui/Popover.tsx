import React, {
    cloneElement,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Modal,
    Pressable,
    View,
    type LayoutChangeEvent,
    useWindowDimensions,
} from 'react-native';
import { cn } from '@/lib/utils';

type Align = 'start' | 'center' | 'end';
type Side = 'top' | 'bottom' | 'left' | 'right';

type Rect = { x: number; y: number; width: number; height: number };

interface Ctx {
    open: boolean;
    setOpen: (v: boolean) => void;
    anchor: Rect | null;
    setAnchor: (r: Rect | null) => void;
}

const PopoverContext = createContext<Ctx | null>(null);

export interface PopoverProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

function Popover({ open, defaultOpen, onOpenChange, children }: PopoverProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(!!defaultOpen);
    const isControlled = open !== undefined;
    const actualOpen = isControlled ? !!open : uncontrolledOpen;
    const [anchor, setAnchor] = useState<Rect | null>(null);

    const setOpen = useCallback((v: boolean) => {
        if (!isControlled) setUncontrolledOpen(v);
        onOpenChange?.(v);
    }, [isControlled, onOpenChange]);

    const value = useMemo<Ctx>(
        () => ({ open: actualOpen, setOpen, anchor, setAnchor }),
        [actualOpen, anchor, setOpen]
    );

    return (
        <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
    );
}

function usePopover() {
    const ctx = useContext(PopoverContext);
    if (!ctx) throw new Error('Popover components must be used within <Popover>');
    return ctx;
}

export interface PopoverTriggerProps
    extends React.ComponentPropsWithoutRef<typeof Pressable> {
    asChild?: boolean;
    children: React.ReactElement | React.ReactNode;
}

function PopoverTrigger({ asChild, children, onPress, ...rest }: PopoverTriggerProps) {
    const { open, setOpen, setAnchor } = usePopover();
    const wrapperRef = useRef<View>(null);

    const measure = () => {
        wrapperRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
        });
    };

    const handlePress = (e: any) => {
        measure();
        onPress?.(e);
        setOpen(!open);
    };

    if (asChild && React.isValidElement(children)) {
        return (
            <View ref={wrapperRef} collapsable={false} onLayout={measure}>
                {cloneElement(children as React.ReactElement, {
                    onPress: handlePress,
                    ...(children as any).props,
                })}
            </View>
        );
    }

    return (
        <View ref={wrapperRef} collapsable={false} onLayout={measure}>
            <Pressable onPress={handlePress} {...rest}>
                {children}
            </Pressable>
        </View>
    );
}

type PopoverAnchorProps = React.ComponentPropsWithoutRef<typeof View>

function PopoverAnchor({ onLayout, ...props }: PopoverAnchorProps) {
    const { setAnchor } = usePopover();
    const ref = useRef<View>(null);

    const handleLayout = (e: LayoutChangeEvent) => {
        ref.current?.measureInWindow((x, y, width, height) =>
            setAnchor({ x, y, width, height })
        );
        onLayout?.(e);
    };

    return <View ref={ref} collapsable={false} onLayout={handleLayout} {...props} />;
}

export interface PopoverContentProps
    extends React.ComponentPropsWithoutRef<typeof View> {
    className?: string;
    align?: Align;
    side?: Side;
    sideOffset?: number;
}

function PopoverContent({
    className,
    align = 'center',
    side = 'bottom',
    sideOffset = 4,
    style,
    ...props
}: PopoverContentProps) {
    const { open, setOpen, anchor } = usePopover();
    const { width: screenW, height: screenH } = useWindowDimensions();
    const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

    if (!open || !anchor) return null;

    const computePosition = () => {
        const { x, y, width: aw, height: ah } = anchor;
        const cw = contentSize.width;
        const ch = contentSize.height;

        let top = y;
        let left = x;

        if (side === 'bottom') {
            top = y + ah + sideOffset;
            if (align === 'start') left = x;
            if (align === 'center') left = x + (aw - cw) / 2;
            if (align === 'end') left = x + aw - cw;
        } else if (side === 'top') {
            top = y - ch - sideOffset;
            if (align === 'start') left = x;
            if (align === 'center') left = x + (aw - cw) / 2;
            if (align === 'end') left = x + aw - cw;
        } else if (side === 'left') {
            left = x - cw - sideOffset;
            if (align === 'start') top = y;
            if (align === 'center') top = y + (ah - ch) / 2;
            if (align === 'end') top = y + ah - ch;
        } else if (side === 'right') {
            left = x + aw + sideOffset;
            if (align === 'start') top = y;
            if (align === 'center') top = y + (ah - ch) / 2;
            if (align === 'end') top = y + ah - ch;
        }

        // Clamp within the screen
        left = Math.max(8, Math.min(left, screenW - cw - 8));
        top = Math.max(8, Math.min(top, screenH - ch - 8));

        return { top, left };
    };

    const { top, left } = computePosition();

    return (
        <Modal
            visible={open}
            transparent
            animationType="fade"
            onRequestClose={() => setOpen(false)}
        >
            <Pressable
                className="flex-1 bg-black/20 dark:bg-black/40"
                onPress={() => setOpen(false)}
            >
                <View className="flex-1">
                    <View
                        pointerEvents="box-none"
                        style={[
                            { position: 'absolute', top, left, maxWidth: screenW - 16 },
                        ]}
                    >
                        <View
                            onLayout={(e) =>
                                setContentSize({
                                    width: e.nativeEvent.layout.width,
                                    height: e.nativeEvent.layout.height,
                                })
                            }
                            className={cn(
                                'z-50 w-72 rounded-md border bg-popover p-4 shadow-md',
                                'text-popover-foreground',
                                className
                            )}
                            style={style}
                            {...props}
                        />
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };