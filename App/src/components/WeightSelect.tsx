import {TextInput, View} from "react-native";
import {TextField, useThemeColor} from "heroui-native";
import {SelectWithTrigger, SelectWithTriggerOption} from "./SelectWithTrigger";
import {useEffect, useRef, useState} from "react";
import {normalizePositiveDecimal} from "@/lib/normalize";
import {Text} from '@/components/Text';

const LB_PER_KG = 2.2046226218;
const LB_PER_ST = 14;

const weightUnitOptions: SelectWithTriggerOption[] = [{label: "kg", value: "kg"}, {
    label: "lbs", value: "lbs"
}, {label: "st", value: "st"},];

type WeightUnit = "kg" | "lbs" | "st";

function findUnitOption(unit: WeightUnit) {
    return weightUnitOptions.find(o => o.value === unit);
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

function kgToLb(kg: number) {
    return kg * LB_PER_KG;
}

function lbToKg(lb: number) {
    return lb / LB_PER_KG;
}

function lbToStLb(lb: number) {
    const rawSt = lb / LB_PER_ST;
    let st = Math.floor(rawSt);
    let remLb = Math.round((rawSt - st) * LB_PER_ST);

    if (remLb === LB_PER_ST) {
        st += 1;
        remLb = 0;
    }

    return {st, lb: remLb};
}

function stToStLb(stones: number) {
    let st = Math.floor(stones);
    let lb = Math.round((stones - st) * LB_PER_ST);

    if (lb === LB_PER_ST) {
        st += 1;
        lb = 0;
    }

    return {st, lb};
}

function stLbToStones(st?: number, lb?: number) {
    const safeSt = st ?? 0;
    const safeLb = lb ?? 0;
    const totalSt = safeSt + (safeLb / LB_PER_ST);
    return totalSt > 0 ? totalSt : undefined;
}

interface WeightSelectProps {
    weight?: number;
    setWeight: (weight: number | undefined) => void;
    weightUnit: WeightUnit;
    setWeightUnit: (unit: WeightUnit) => void;
    required?: boolean;
    label?: string;
}

export default function WeightSelect({
                                         weight,
                                         setWeight,
                                         weightUnit,
                                         setWeightUnit,
                                         required = false,
                                         label = "Enter your weight"
                                     }: WeightSelectProps) {
    const placeholderColor = useThemeColor("field-placeholder");

    const [kgText, setKgText] = useState("");
    const [lbText, setLbText] = useState("");
    const [stText, setStText] = useState("");
    const [stLbText, setStLbText] = useState("");

    const stLbInputRef = useRef<TextInput>(null);

    const prevUnitRef = useRef<WeightUnit>(weightUnit);
    useEffect(() => {
        const prev = prevUnitRef.current;
        const next = weightUnit;

        if (prev === next) return;

        if (weight === undefined) {
            setKgText("");
            setLbText("");
            setStText("");
            setStLbText("");
            prevUnitRef.current = next;
            return;
        }

        const toLb = (unit: WeightUnit, v: number) => {
            if (unit === "kg") return kgToLb(v);
            if (unit === "lbs") return v;
            return v * LB_PER_ST;
        };

        const fromLb = (unit: WeightUnit, lb: number) => {
            if (unit === "kg") return lbToKg(lb);
            if (unit === "lbs") return lb;
            return lb / LB_PER_ST;
        };

        const asLb = toLb(prev, weight);

        if (next === "st") {
            const {st, lb} = lbToStLb(asLb);
            setStText(st > 0 ? String(st) : "");
            setStLbText(String(lb));
            setWeight(stLbToStones(st, lb));
        } else {
            const nextValue = fromLb(next, asLb);
            const {text: nextText, value} = normalizePositiveDecimal(String(nextValue), {maxDecimals: 1});
            if (next === "kg") setKgText(nextText);
            if (next === "lbs") setLbText(nextText);
            setWeight(value);
        }

        prevUnitRef.current = next;
    }, [weightUnit, weight, setWeight]);

    useEffect(() => {
        if (weight === undefined) {
            setKgText("");
            setLbText("");
            setStText("");
            setStLbText("");
            return;
        }

        if (weightUnit === "kg") {
            if (kgText !== "") return;
            const {text} = normalizePositiveDecimal(String(weight), {maxDecimals: 1});
            setKgText(text);
            return;
        }

        if (weightUnit === "lbs") {
            if (lbText !== "") return;
            const {text} = normalizePositiveDecimal(String(weight), {maxDecimals: 1});
            setLbText(text);
            return;
        }

        if (stText !== "" || stLbText !== "") return;
        const {st, lb} = stToStLb(weight);
        setStText(st > 0 ? String(st) : "");
        setStLbText(String(lb));
    }, [weight, weightUnit, kgText, lbText, stText, stLbText]);

    const unitOption = findUnitOption(weightUnit);

    return (<View className="flex-row gap-3">
        {weightUnit === "st" ? (<View className="flex-1">
            <Text className="ml-1 mb-1">
                {label} {required && <Text className="text-danger">*</Text>}
            </Text>

            <View className="flex-row gap-3 items-center">
                <TextField className="flex-1">
                    <TextField.Input
                        value={stText}
                        onChangeText={(text) => {
                            const cleaned = digitsOnly(text);
                            setStText(cleaned);

                            const st = parseOptionalInt(cleaned);
                            const lb = parseOptionalInt(stLbText) ?? 0;
                            setWeight(stLbToStones(st, lb));
                        }}
                        keyboardType="number-pad"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => stLbInputRef.current?.focus()}
                        placeholderTextColor={placeholderColor}
                        placeholder="st"
                        numberOfLines={1}
                    />
                </TextField>

                <TextField className="flex-1">
                    <TextField.Input
                        ref={stLbInputRef}
                        value={stLbText}
                        onChangeText={(text) => {
                            const cleaned = digitsOnly(text);
                            const rawLb = parseOptionalInt(cleaned);

                            if (rawLb === undefined) {
                                setStLbText("");
                                const st = parseOptionalInt(stText);
                                setWeight(stLbToStones(st, 0));
                                return;
                            }

                            const safeLb = Math.max(0, Math.floor(rawLb));
                            const overflowSt = Math.floor(safeLb / LB_PER_ST);
                            const remainderLb = safeLb % LB_PER_ST;

                            const currentSt = parseOptionalInt(stText) ?? 0;
                            const nextSt = currentSt + overflowSt;

                            if (overflowSt > 0) {
                                setStText(nextSt > 0 ? String(nextSt) : "");
                            }

                            setStLbText(String(remainderLb));
                            setWeight(stLbToStones(nextSt, remainderLb));
                        }}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        placeholderTextColor={placeholderColor}
                        placeholder="lb"
                        numberOfLines={1}
                    />
                </TextField>
            </View>
        </View>) : (<TextField isRequired={required} className="flex-1">
            <TextField.Label>{label}</TextField.Label>
            <TextField.Input
                value={weightUnit === "kg" ? kgText : lbText}
                onChangeText={(text) => {
                    const {text: nextText, value} = normalizePositiveDecimal(text, {maxDecimals: 1});
                    if (weightUnit === "kg") setKgText(nextText); else setLbText(nextText);
                    setWeight(value);
                }}
                keyboardType="decimal-pad"
                placeholderTextColor={placeholderColor}
                placeholder={weightUnit}
                numberOfLines={1}
            />
        </TextField>)}

        <SelectWithTrigger
            className="w-28"
            label="Unit"
            options={weightUnitOptions}
            value={unitOption}
            initialValue={unitOption}
            onValueChange={(val) => setWeightUnit((val?.value as WeightUnit) ?? "kg")}
        />
    </View>);
}