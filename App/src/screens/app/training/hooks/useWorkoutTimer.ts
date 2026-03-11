import { useState, useEffect, useRef } from 'react';

export function useWorkoutTimer(startTime: string) {
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const start = new Date(startTime).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            setSeconds(Math.floor((now - start) / 1000));
        };

        updateTimer();
        intervalRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [startTime]);

    const formatDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return [
            h > 0 ? h : null,
            m.toString().padStart(h > 0 ? 2 : 1, '0'),
            s.toString().padStart(2, '0'),
        ].filter(Boolean).join(':');
    };

    return {
        seconds,
        formattedTime: formatDuration(seconds),
    };
}
