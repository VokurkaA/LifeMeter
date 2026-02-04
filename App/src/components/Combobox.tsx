import { LinearGradient } from 'expo-linear-gradient';
import { BlurView, type BlurViewProps } from 'expo-blur';
import { cn, ScrollShadow, Select, useThemeColor, useSelect, useSelectAnimation, Input, } from 'heroui-native';
import React, { type FC, type ReactNode, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, useWindowDimensions, View, } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { KeyboardAvoidingView, KeyboardController, } from 'react-native-keyboard-controller';
import Animated, { Easing, FadeInDown, FadeOutDown, interpolate, type SharedValue, useAnimatedProps, useDerivedValue, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';
import { Text } from '@/components/Text';
import { useDebounce } from '@/lib/useDebounce';

KeyboardController.preload();

type SelectValue = { value: string; label: string };

export type ComboboxProps<TOption> = {
    options: readonly TOption[];
    value?: TOption;
    defaultValue?: TOption;
    onChange?: (next?: TOption) => void;
    getOptionValue: (option: TOption) => string;
    getOptionLabel: (option: TOption) => string;
    dialogTitle?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    filterOption?: (option: TOption, query: string) => boolean;
    renderTrigger?: (selected?: TOption) => ReactNode;
    renderOption?: (option: TOption, ctx: { selected: boolean }) => ReactNode;
    maxBackdropBlurIntensity?: number;

    onSearchQueryChange?: (query: string) => void;
    debounceMs?: number;
    searchQuery?: string;
    setSearchQuery?: (q: string) => void;

    isLoading?: boolean;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    resetSearchOnSelect?: boolean;
    emptyText?: string;
};

export function Combobox<TOption>(props: ComboboxProps<TOption>) {
    const {
        options,
        value,
        defaultValue,
        onChange,
        getOptionValue,
        getOptionLabel,
        dialogTitle = 'Select',
        placeholder = 'Select…',
        searchPlaceholder = 'Search…',
        filterOption,
        renderTrigger,
        renderOption,
        maxBackdropBlurIntensity,

        onSearchQueryChange,
        debounceMs = 300,
        searchQuery,
        setSearchQuery,

        isLoading,
        onEndReached,
        onEndReachedThreshold = 0.5,
        resetSearchOnSelect = true,
        emptyText = 'No results',
    } = props;

    const { theme } = useUniwind();
    const isDark = theme === 'dark';

    const [uncontrolledValue, setUncontrolledValue] = useState<TOption | undefined>(defaultValue);
    const selectedOption = value ?? uncontrolledValue;

    const selectedSelectValue: SelectValue | undefined = selectedOption
        ? { value: getOptionValue(selectedOption), label: getOptionLabel(selectedOption) }
        : undefined;

    const handleValueChange = (newValue?: SelectValue) => {
        const next = newValue
            ? options.find((o) => getOptionValue(o) === newValue.value)
            : undefined;

        if (value === undefined) setUncontrolledValue(next);
        onChange?.(next);
    };

    return (
        <Select presentation="dialog" value={selectedSelectValue} onValueChange={handleValueChange}>
            <Select.Trigger asChild>
                <Pressable>
                    {renderTrigger ? (
                        renderTrigger(selectedOption)
                    ) : (
                        <Input
                            variant="secondary"
                            editable={false}
                            pointerEvents="none"
                            placeholder={placeholder ?? "Select an option..."}
                            value={selectedSelectValue?.label}
                        />
                    )}
                </Pressable>
            </Select.Trigger>

            <Select.Portal>
                <SelectBlurBackdrop isDark={isDark} maxIntensity={maxBackdropBlurIntensity} />
                <ComboboxContent
                    isDark={isDark}
                    options={options}
                    selectedValue={selectedSelectValue?.value}
                    dialogTitle={dialogTitle}
                    searchPlaceholder={searchPlaceholder}
                    getOptionValue={getOptionValue}
                    getOptionLabel={getOptionLabel}
                    filterOption={filterOption}
                    renderOption={renderOption}
                    onSearchQueryChange={onSearchQueryChange}
                    debounceMs={debounceMs}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isLoading={isLoading}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={onEndReachedThreshold}
                    resetSearchOnSelect={resetSearchOnSelect}
                    emptyText={emptyText}
                />
            </Select.Portal>
        </Select>
    );
}

type ComboboxContentProps<TOption> = {
    isDark: boolean;
    options: readonly TOption[];
    selectedValue?: string;

    dialogTitle: string;
    searchPlaceholder: string;

    getOptionValue: (option: TOption) => string;
    getOptionLabel: (option: TOption) => string;
    filterOption?: (option: TOption, query: string) => boolean;
    renderOption?: (option: TOption, ctx: { selected: boolean }) => ReactNode;

    onSearchQueryChange?: (query: string) => void;
    debounceMs: number;

    searchQuery?: string;
    setSearchQuery?: (q: string) => void;

    isLoading?: boolean;
    onEndReached?: () => void;
    onEndReachedThreshold: number;

    resetSearchOnSelect: boolean;
    emptyText: string;
};

function ComboboxContent<TOption>(props: ComboboxContentProps<TOption>) {
    const {
        isDark,
        options,
        selectedValue,
        dialogTitle,
        searchPlaceholder,
        getOptionValue,
        getOptionLabel,
        filterOption,
        renderOption,

        onSearchQueryChange,
        debounceMs,
        searchQuery: controlledQuery,
        setSearchQuery: controlledSetQuery,

        isLoading,
        onEndReached,
        onEndReachedThreshold,

        resetSearchOnSelect,
        emptyText,
    } = props;

    const [localSearchQuery, setLocalSearchQuery] = useState("");
    const query = controlledQuery !== undefined ? controlledQuery : localSearchQuery;
    const setQuery = controlledSetQuery ?? setLocalSearchQuery;

    const debouncedQuery = useDebounce(query, debounceMs);

    const [themeColorMuted, themeColorOverlay, themeColorSurface] = useThemeColor([
        'muted',
        'overlay',
        'surface',
    ]);

    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const insetTop = insets.top + 12;
    const maxDialogHeight = (height - insetTop) / 2;

    const displayOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (onSearchQueryChange) return options;

        if (!q) return options;

        const defaultFilter = (opt: TOption, qq: string) =>
            getOptionLabel(opt).toLowerCase().includes(qq);

        const fn = filterOption ?? defaultFilter;
        return options.filter((opt) => fn(opt, q));
    }, [options, query, onSearchQueryChange, filterOption, getOptionLabel]);

    useEffect(() => {
        onSearchQueryChange?.(debouncedQuery);
    }, [debouncedQuery, onSearchQueryChange]);

    const resetSearch = () => setQuery("");

    return (
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={24}>
            <Select.Content
                presentation="dialog"
                classNames={{
                    content: cn('gap-2 rounded-3xl', isDark && 'bg-surface'),
                }}
                style={{ marginTop: insetTop, height: maxDialogHeight }}
                animation={{
                    entering: FadeInDown.duration(250).easing(Easing.out(Easing.ease)),
                    exiting: FadeOutDown.duration(200).easing(Easing.in(Easing.ease)),
                }}
            >
                <View className="flex-row items-center justify-between mb-2">
                    <Select.ListLabel>{dialogTitle}</Select.ListLabel>
                    <Select.Close variant="ghost" />
                </View>

                <View className="w-full mb-2">
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder={searchPlaceholder}
                        placeholderTextColor={themeColorMuted}
                        className="p-3 rounded-xl bg-surface-secondary/80 text-foreground"
                        autoFocus
                    />
                </View>

                <ScrollShadow
                    className="flex-1"
                    LinearGradientComponent={LinearGradient}
                    color={isDark ? themeColorSurface : themeColorOverlay}
                >
                    <FlatList
                        data={displayOptions as TOption[]}
                        keyExtractor={(opt) => getOptionValue(opt)}
                        keyboardShouldPersistTaps="handled"
                        onEndReached={onEndReached}
                        onEndReachedThreshold={onEndReachedThreshold}
                        renderItem={({ item: opt }) => {
                            const v = getOptionValue(opt);
                            const label = getOptionLabel(opt);
                            const isSelected = v === selectedValue;

                            return (
                                <Select.Item
                                    key={v}
                                    value={v}
                                    label={label}
                                    onPress={() => {
                                        KeyboardController.dismiss();
                                        if (resetSearchOnSelect) resetSearch();
                                    }}
                                >
                                    <View className="flex-row items-center gap-3 flex-1">
                                        {renderOption ? (
                                            renderOption(opt, { selected: isSelected })
                                        ) : (
                                            <Text className="text-base text-foreground flex-1">{label}</Text>
                                        )}
                                    </View>
                                    <Select.ItemIndicator />
                                </Select.Item>
                            );
                        }}
                        ListFooterComponent={
                            isLoading ? (
                                <View className="p-4 items-center">
                                    <ActivityIndicator />
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={
                            !isLoading ? (
                                <View className="p-4 items-center opacity-60">
                                    <Text className="text-muted text-center">{emptyText}</Text>
                                </View>
                            ) : null
                        }
                    />
                </ScrollShadow>
            </Select.Content>
        </KeyboardAvoidingView>
    );
}

const SelectBlurBackdrop = ({
    maxIntensity,
    isDark,
}: {
    maxIntensity?: number;
    isDark?: boolean;
}) => {
    const { onOpenChange } = useSelect();
    const { progress, isDragging, isGestureReleaseAnimationRunning } = useSelectAnimation();

    const blurIntensity = useDerivedValue(() => {
        const defaultMaxIntensityValue = isDark ? 75 : 50;
        const computedMaxIntensityValue = maxIntensity ?? defaultMaxIntensityValue;

        if ((isDragging.get() || isGestureReleaseAnimationRunning.get()) && progress.get() <= 1) {
            return computedMaxIntensityValue;
        }

        return interpolate(progress.get(), [0, 1, 2], [0, computedMaxIntensityValue, 0]);
    });

    return (
        <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
                KeyboardController.dismiss();
                onOpenChange(false);
            }}
        >
            <AnimatedBlurView
                blurIntensity={blurIntensity}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
            />
        </Pressable>
    );
};

const RBlurView = Animated.createAnimatedComponent(BlurView);

interface AnimatedBlurViewProps extends BlurViewProps {
    blurIntensity: SharedValue<number>;
}

const AnimatedBlurView: FC<AnimatedBlurViewProps> = ({ blurIntensity, ...props }) => {
    const animatedProps = useAnimatedProps(() => ({ intensity: blurIntensity.get() }));
    return <RBlurView animatedProps={animatedProps} {...props} />;
};
