import {Button, Card, PressableFeedback} from "heroui-native";
import {useEffect, useMemo, useState} from "react";
import {Text, View} from "react-native";
import Svg, {Defs, RadialGradient, Rect, Stop} from "react-native-svg";
import {useStore} from "@/contexts/useStore";
import { timeToDate } from "@/lib/dateTime";

interface TimeCardProps {
    bedTime?: Date;
    wakeUpTime?: Date;
}

type Keyframe = {
    hour: number; bg: string; orb: string; y: number; scale: number;
};

type Greeting = {
    hour: number; message: string;
};

const TIMELINE: Keyframe[] = [{hour: 0, bg: '#0f172a', orb: '#e2e8f0', y: 20, scale: 0.4}, {
    hour: 5, bg: '#312e81', orb: '#e2e8f0', y: 80, scale: 0.4
}, {hour: 7, bg: '#818cf8', orb: '#fdba74', y: 80, scale: 0.6}, {
    hour: 12, bg: '#06b6d4', orb: '#fef08a', y: 25, scale: 0.9
}, {hour: 17, bg: '#3b82f6', orb: '#fdba74', y: 40, scale: 0.7}, {
    hour: 20, bg: '#4c1d95', orb: '#f43f5e', y: 100, scale: 1.0
}, {hour: 24, bg: '#0f172a', orb: '#e2e8f0', y: 20, scale: 0.4},];

const GREETINGS: Greeting[] = [{hour: 0, message: 'Up late?'}, {hour: 5, message: 'Good morning.'}, {
    hour: 12, message: 'Good afternoon.'
}, {hour: 18, message: 'Good evening.'}, {hour: 21, message: 'Good night.'},];

const interpolateColor = (color1: string, color2: string, factor: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color1);
    const result2 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color2);
    if (!result || !result2) return color1;

    const r1 = parseInt(result[1], 16), g1 = parseInt(result[2], 16), b1 = parseInt(result[3], 16);
    const r2 = parseInt(result2[1], 16), g2 = parseInt(result2[2], 16), b2 = parseInt(result2[3], 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const getHourDistance = (h1: number, h2: number) => {
    const diff = Math.abs(h1 - h2);
    return Math.min(diff, 24 - diff);
};

const getSmartGreeting = (currentDate: Date, wakeDate: Date, bedDate: Date) => {
    const currentH = currentDate.getHours() + currentDate.getMinutes() / 60;
    const wakeH = wakeDate.getHours() + wakeDate.getMinutes() / 60;
    const bedH = bedDate.getHours() + bedDate.getMinutes() / 60;

    if (getHourDistance(currentH, bedH) <= 2) return "Time to sleep.";
    if (getHourDistance(currentH, wakeH) <= 2) return "Time to wake up.";

    const match = [...GREETINGS].reverse().find(g => currentH >= g.hour);
    return match ? match.message : 'Hello.';
};

export const useDayCycle = (currentHour: number) => {
    return useMemo(() => {
        const nextIndex = TIMELINE.findIndex(k => k.hour > currentHour);
        const endIndex = nextIndex === -1 ? TIMELINE.length - 1 : nextIndex;
        const startIndex = Math.max(0, endIndex - 1);

        const start = TIMELINE[startIndex];
        const end = TIMELINE[endIndex];

        const range = end.hour - start.hour;
        const progress = range === 0 ? 0 : (currentHour - start.hour) / range;

        return {
            bg: interpolateColor(start.bg, end.bg, progress),
            orb: interpolateColor(start.orb, end.orb, progress),
            y: start.y + (end.y - start.y) * progress,
            scale: start.scale + (end.scale - start.scale) * progress,
        };
    }, [currentHour]);
};

const getSleepDurationText = (startDate: Date | undefined, currentDate: Date) => {
    if (!startDate) return "Sleeping..."

    const diffMs = currentDate.getTime() - startDate.getTime();
    if (diffMs < 60000) return "Good night"; 

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    return `Sleeping for ${timeString}`;
};

export const TimeCard = ({
                             bedTime = new Date(new Date().setHours(22, 0, 0, 0)),
                             wakeUpTime = new Date(new Date().setHours(7, 0, 0, 0)),
                         }: TimeCardProps) => {
    const {ongoingSleepSession, startSleep, endSleep} = useStore();

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let intervalId: NodeJS.Timeout;

        const syncToMinute = () => {
            const now = new Date();
            const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

            timeoutId = setTimeout(() => {
                setCurrentTime(new Date());
                intervalId = setInterval(() => {
                    setCurrentTime(new Date());
                }, 60000);
            }, msToNextMinute);
        };

        syncToMinute();

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, []);

    const fractionalTime = currentTime.getHours() + (currentTime.getMinutes() / 60);
    const {bg, orb, y, scale} = useDayCycle(fractionalTime);

    const greeting = getSmartGreeting(currentTime, wakeUpTime, bedTime);
    const displayTime = currentTime.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit',});

    const sleepDurationSubtitle = ongoingSleepSession ? getSleepDurationText(timeToDate(ongoingSleepSession?.startAt), currentTime) : `Bedtime goal: ${bedTime.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
    })}`;

    const footerData = ongoingSleepSession ? {
        title: "Sweet dreams",
        subtitle: sleepDurationSubtitle,
        buttonLabel: "Wake Up",
        action: endSleep,
        variant: "danger" as const
    } : {
        title: "Ready to sleep?",
        subtitle: sleepDurationSubtitle,
        buttonLabel: "Start Sleep",
        action: startSleep,
        variant: "default" as const
    };

    return (<PressableFeedback>
        <Card className="overflow-hidden aspect-square rounded-3xl">
            <View className="absolute inset-0">
                <Svg height="100%" width="100%">
                    <Defs>
                        <RadialGradient
                            id="dynamicSun"
                            cx="50%"
                            cy={`${y}%`}
                            rx={`${50 * scale}%`}
                            ry={`${50 * scale}%`}
                            gradientUnits="userSpaceOnUse"
                        >
                            <Stop offset="0" stopColor={orb} stopOpacity="1"/>
                            <Stop offset="1" stopColor={orb} stopOpacity="0"/>
                        </RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill={bg}/>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#dynamicSun)"/>
                </Svg>
            </View>
            <Card.Header>
                <Card.Title className="text-2xl font-bold text-white">{greeting}</Card.Title>
                <Card.Description className="text-white/75">{displayTime}</Card.Description>
            </Card.Header>
            <Card.Body className="flex-1"/>
            <Card.Footer>
                <View className="p-4 border bg-white/10 rounded-2xl backdrop-blur-md border-foreground/5">
                    <View className="flex-row items-center justify-between w-full">
                        <View>
                            <Text className="text-base font-semibold text-white">{footerData.title}</Text>
                            <Text className="text-sm text-white/75">
                                {footerData.subtitle}
                            </Text>
                        </View>

                        <Button
                            size="sm"
                            className={footerData.variant === 'danger' ? "bg-danger-soft" : "bg-white"}
                            onPress={footerData.action}
                            pressableFeedbackVariant="ripple"
                        >
                            <Button.Label
                                className={footerData.variant === 'danger' ? "text-white" : "text-black"}>
                                {footerData.buttonLabel}
                            </Button.Label>
                        </Button>
                    </View>
                </View>
            </Card.Footer>
        </Card>
    </PressableFeedback>);
};