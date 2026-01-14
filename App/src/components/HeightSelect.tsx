import {TextField, useThemeColor} from "heroui-native";
import {SelectWithTrigger, SelectWithTriggerOption} from "./SelectWithTrigger";
import {useEffect, useRef, useState} from "react";
import {Text, TextInput, View} from "react-native";
import {normalizePositiveDecimal} from "@/lib/normalize";

const CM_PER_INCH = 2.54;

const lengthUnitOptions: SelectWithTriggerOption[] = [{label: "cm", value: "cm"}, {label: "ft", value: "ft"},];

type HeightUnit = "cm" | "ft";

function findUnitOption(unit: HeightUnit) {
    return lengthUnitOptions.find(o => o.value === unit);
}

function digitsOnly(text: string) {
    return (text ?? "").replace(/\D/g, "");
}

function parseOptionalInt(text: string): number | undefined {
    const cleaned = digitsOnly(text);
    if (!cleaned) return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
}

function cmToFtIn(cm: number) {
    const totalInches = cm / CM_PER_INCH;
    const rawFeet = totalInches / 12;

    let ft = Math.floor(rawFeet);
    let inches = Math.round((rawFeet - ft) * 12);

    if (inches === 12) {
        ft += 1;
        inches = 0;
    }

    return {ft, inches};
}

function feetToFtIn(feet: number) {
    let ft = Math.floor(feet);
    let inches = Math.round((feet - ft) * 12);

    if (inches === 12) {
        ft += 1;
        inches = 0;
    }

    return {ft, inches};
}

function ftInToFeet(ft?: number, inches?: number) {
    const safeFt = ft ?? 0;
    const safeIn = inches ?? 0;
    const totalFeet = safeFt + (safeIn / 12);
    return totalFeet > 0 ? totalFeet : undefined;
}

interface HeightSelectProps {
    height?: number;
    setHeight: (height: number | undefined) => void;
    heightUnit: HeightUnit;
    setHeightUnit: (unit: HeightUnit) => void;
}

export default function HeightSelect({height, setHeight, heightUnit, setHeightUnit}: HeightSelectProps) {
    const placeholderColor = useThemeColor("field-placeholder");

    const [cmText, setCmText] = useState("");
    const [ftText, setFtText] = useState("");
    const [inText, setInText] = useState("");

    const inchesInputRef = useRef<TextInput>(null);

    const prevUnitRef = useRef<HeightUnit>(heightUnit);
    useEffect(() => {
        const prev = prevUnitRef.current;
        const next = heightUnit;

        if (prev === next) return;

        if (height === undefined) {
            setCmText("");
            setFtText("");
            setInText("");
            prevUnitRef.current = next;
            return;
        }

        if (prev === "cm" && next === "ft") {
            const {ft, inches} = cmToFtIn(height);
            setFtText(ft > 0 ? String(ft) : "");
            setInText(String(inches));
            setHeight(ftInToFeet(ft, inches));
        } else if (prev === "ft" && next === "cm") {
            const {
                text: nextText, value
            } = normalizePositiveDecimal(String((height * 12) * CM_PER_INCH), {maxDecimals: 1});
            setCmText(nextText);
            setHeight(value);
        }

        prevUnitRef.current = next;
    }, [heightUnit, height, setHeight]);

    useEffect(() => {
        if (height === undefined) {
            setCmText("");
            setFtText("");
            setInText("");
            return;
        }

        if (heightUnit === "cm") {
            if (cmText !== "") return;
            const {text: nextText} = normalizePositiveDecimal(String(height), {maxDecimals: 1});
            setCmText(nextText);
            return;
        }

        // heightUnit === "ft"
        if (ftText !== "" || inText !== "") return;
        const {ft, inches} = feetToFtIn(height);
        setFtText(ft > 0 ? String(ft) : "");
        setInText(String(inches));
    }, [height, heightUnit, cmText, ftText, inText]);

    const unitOption = findUnitOption(heightUnit);

    return (<View className="flex-row gap-3">
        {heightUnit === "cm" ? (<TextField isRequired className="flex-1">
            <TextField.Label>Enter your height</TextField.Label>
            <TextField.Input
                value={cmText}
                onChangeText={(text) => {
                    const {text: nextText, value} = normalizePositiveDecimal(text, {maxDecimals: 1});
                    setCmText(nextText);
                    setHeight(value);
                }}
                keyboardType="decimal-pad"
                placeholderTextColor={placeholderColor}
                placeholder="cm"
                numberOfLines={1}
            />
        </TextField>) : (<View className="flex-1">
            <Text className="text-foreground font-bold text-base ml-1 mb-1">
                Enter your height <Text className="text-danger">*</Text>
            </Text>

            <View className="flex-row gap-3 items-center">
                <TextField className="flex-1">
                    <TextField.Input
                        value={ftText}
                        onChangeText={(text) => {
                            const cleaned = digitsOnly(text);
                            setFtText(cleaned);

                            const ft = parseOptionalInt(cleaned);
                            const inches = parseOptionalInt(inText) ?? 0;
                            setHeight(ftInToFeet(ft, inches));
                        }}
                        keyboardType="number-pad"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => inchesInputRef.current?.focus()}
                        placeholderTextColor={placeholderColor}
                        placeholder="ft"
                        numberOfLines={1}
                    />
                </TextField>

                <TextField className="flex-1">
                    <TextField.Input
                        ref={inchesInputRef}
                        value={inText}
                        onChangeText={(text) => {
                            const cleaned = digitsOnly(text);
                            const rawIn = parseOptionalInt(cleaned);

                            if (rawIn === undefined) {
                                setInText("");
                                const ft = parseOptionalInt(ftText);
                                setHeight(ftInToFeet(ft, 0));
                                return;
                            }

                            const safeIn = Math.max(0, Math.floor(rawIn));
                            const overflowFeet = Math.floor(safeIn / 12);
                            const remainderInches = safeIn % 12;

                            const currentFt = parseOptionalInt(ftText) ?? 0;
                            const nextFt = currentFt + overflowFeet;

                            if (overflowFeet > 0) {
                                setFtText(nextFt > 0 ? String(nextFt) : "");
                            }

                            setInText(String(remainderInches));
                            setHeight(ftInToFeet(nextFt, remainderInches));
                        }}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        placeholderTextColor={placeholderColor}
                        placeholder="in"
                        numberOfLines={1}
                    />
                </TextField>
            </View>
        </View>)}

        <SelectWithTrigger
            className="w-28"
            label="Unit"
            options={lengthUnitOptions}
            value={unitOption}
            initialValue={unitOption}
            onValueChange={(val) => setHeightUnit((val?.value as HeightUnit) ?? "cm")}
        />
    </View>);
}