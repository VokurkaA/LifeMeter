import {ScrollView, Text, TextInput, View} from "react-native";
import {useEffect, useMemo, useRef, useState} from "react";
import HeightSelect from "@/components/HeightSelect";
import WeightSelect from "@/components/WeightSelect";
import {Divider, TextField, useThemeColor} from "heroui-native";
import {normalizePercentInput} from "@/lib/normalize";

export interface BodyInfoData {
    height: number;
    heightUnit: "cm" | "ft";
    weight: number;
    weightUnit: "kg" | "lbs" | "st";
    bodyFatPercentage?: number;
    leanTissuePercentage?: number;
    waterPercentage?: number;
    boneMassPercentage?: number;
}

interface BodyInfoProps {
    onSubmit: (data: BodyInfoData) => void;
    setNextEnabled: (enabled: boolean) => void;
    registerOnNext: (onNext: null | (() => void)) => void;
    defaultHeightUnit: "cm" | "ft" | undefined;
    defaultWeightUnit: "kg" | "lbs" | "st" | undefined;
    initialData?: BodyInfoData;
}

function initPercentText(v?: number) {
    if (v == null) return "";
    return String(v);
}

export default function BodyInfo({
                                     onSubmit,
                                     setNextEnabled,
                                     registerOnNext,
                                     defaultHeightUnit = "cm",
                                     defaultWeightUnit = "kg",
                                     initialData,
                                 }: BodyInfoProps) {
    const placeholderColor = useThemeColor("field-placeholder");

    const [height, setHeight] = useState<BodyInfoData["height"] | undefined>(initialData?.height);
    const [heightUnit, setHeightUnit] = useState<BodyInfoData["heightUnit"]>(initialData?.heightUnit ?? defaultHeightUnit,);
    const [weight, setWeight] = useState<BodyInfoData["weight"] | undefined>(initialData?.weight);
    const [weightUnit, setWeightUnit] = useState<BodyInfoData["weightUnit"]>(initialData?.weightUnit ?? defaultWeightUnit,);

    const [bodyFatPercentage, setBodyFatPercentage] = useState<BodyInfoData["bodyFatPercentage"] | undefined>(initialData?.bodyFatPercentage);
    const [leanTissuePercentage, setLeanTissuePercentage] = useState<BodyInfoData["leanTissuePercentage"] | undefined>(initialData?.leanTissuePercentage);
    const [waterPercentage, setWaterPercentage] = useState<BodyInfoData["waterPercentage"] | undefined>(initialData?.waterPercentage,);
    const [boneMassPercentage, setBoneMassPercentage] = useState<BodyInfoData["boneMassPercentage"] | undefined>(initialData?.boneMassPercentage);

    const [bfText, setBfText] = useState(() => initPercentText(initialData?.bodyFatPercentage));
    const [leanText, setLeanText] = useState(() => initPercentText(initialData?.leanTissuePercentage));
    const [waterText, setWaterText] = useState(() => initPercentText(initialData?.waterPercentage));
    const [boneText, setBoneText] = useState(() => initPercentText(initialData?.boneMassPercentage));

    const isValid = useMemo(() => {
        if (!height || !weight) return false;

        if (heightUnit === "cm" && (height < 100 || height > 275)) return false;
        if (heightUnit === "ft" && (height < 3 || height > 9)) return false;

        if (weightUnit === "kg" && (weight < 10 || weight > 500)) return false;
        if (weightUnit === "lbs" && (weight < 25 || weight > 1100)) return false;
        if (weightUnit === "st" && (weight < 2 || weight > 80)) return false;

        if (bodyFatPercentage !== undefined && (bodyFatPercentage < 1 || bodyFatPercentage > 70)) return false;
        if (leanTissuePercentage !== undefined && (leanTissuePercentage < 20 || leanTissuePercentage > 90)) return false;
        if (waterPercentage !== undefined && (waterPercentage < 20 || waterPercentage > 80)) return false;
        if (boneMassPercentage !== undefined && (boneMassPercentage < 1 || boneMassPercentage > 15)) return false;

        return true;
    }, [height, weight, heightUnit, weightUnit, bodyFatPercentage, leanTissuePercentage, waterPercentage, boneMassPercentage,]);

    useEffect(() => {
        setNextEnabled(isValid);

        if (!isValid) {
            registerOnNext(null);
            return;
        }

        registerOnNext(() => {
            onSubmit({
                height: height!,
                heightUnit,
                weight: weight!,
                weightUnit,
                bodyFatPercentage,
                leanTissuePercentage,
                waterPercentage,
                boneMassPercentage,
            });
        });

        return () => registerOnNext(null);
    }, [isValid, height, heightUnit, weight, weightUnit, bodyFatPercentage, leanTissuePercentage, waterPercentage, boneMassPercentage, onSubmit, setNextEnabled, registerOnNext,]);

    const bfRef = useRef<TextInput>(null);
    const leanRef = useRef<TextInput>(null);
    const waterRef = useRef<TextInput>(null);
    const boneRef = useRef<TextInput>(null);
    // TODO: Add keyboardAvoidingView
    return (<ScrollView className="gap-4">
        <HeightSelect height={height} setHeight={setHeight} heightUnit={heightUnit} setHeightUnit={setHeightUnit}/>

        <WeightSelect weight={weight} setWeight={setWeight} weightUnit={weightUnit} setWeightUnit={setWeightUnit}
                      label="Enter your weight" required={true}/>
        <View className="flex-row items-center gap-3 my-4">
            <Divider className="w-6"/>
            <Text className="text-sm text-muted">Optional fields</Text>
            <Divider className="flex-1"/>
        </View>

        <View className="gap-3 flex flex-col">
            <View className="flex gap-3 flex-row">
                <TextField className="flex-1">
                    <TextField.Label>Body fat %</TextField.Label>
                    <TextField.Input
                        ref={bfRef}
                        value={bfText}
                        onChangeText={(text) => {
                            const {text: nextText, value} = normalizePercentInput(text, {maxDecimals: 1});
                            setBfText(nextText);
                            setBodyFatPercentage(value);
                        }}
                        keyboardType="decimal-pad"
                        placeholderTextColor={placeholderColor}
                        placeholder="-"
                        numberOfLines={1}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => leanRef.current?.focus()}
                    />
                </TextField>

                <TextField className="flex-1">
                    <TextField.Label>Lean tissue %</TextField.Label>
                    <TextField.Input
                        ref={leanRef}
                        value={leanText}
                        onChangeText={(text) => {
                            const {text: nextText, value} = normalizePercentInput(text, {maxDecimals: 1});
                            setLeanText(nextText);
                            setLeanTissuePercentage(value);
                        }}
                        keyboardType="decimal-pad"
                        placeholderTextColor={placeholderColor}
                        placeholder="-"
                        numberOfLines={1}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => waterRef.current?.focus()}
                    />
                </TextField>
            </View>

            <View className="flex gap-3 flex-row">
                <TextField className="flex-1">
                    <TextField.Label>Water %</TextField.Label>
                    <TextField.Input
                        ref={waterRef}
                        value={waterText}
                        onChangeText={(text) => {
                            const {text: nextText, value} = normalizePercentInput(text, {maxDecimals: 1});
                            setWaterText(nextText);
                            setWaterPercentage(value);
                        }}
                        keyboardType="decimal-pad"
                        placeholderTextColor={placeholderColor}
                        placeholder="-"
                        numberOfLines={1}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => boneRef.current?.focus()}
                    />
                </TextField>

                <TextField className="flex-1">
                    <TextField.Label>Bone mass %</TextField.Label>
                    <TextField.Input
                        ref={boneRef}
                        value={boneText}
                        onChangeText={(text) => {
                            const {text: nextText, value} = normalizePercentInput(text, {maxDecimals: 1});
                            setBoneText(nextText);
                            setBoneMassPercentage(value);
                        }}
                        keyboardType="decimal-pad"
                        placeholderTextColor={placeholderColor}
                        placeholder="-"
                        numberOfLines={1}
                        returnKeyType="done"
                        onSubmitEditing={() => boneRef.current?.blur()}
                    />
                </TextField>
            </View>
        </View>
    </ScrollView>);
}