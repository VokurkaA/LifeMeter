import React, { useEffect, useState } from 'react';

type TickerProps = {
  interval?: number; // ms
  children: (tick: number) => React.ReactNode;
};

export default function Ticker({ interval = 1000, children }: TickerProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000_000), interval);
    return () => clearInterval(id);
  }, [interval]);

  return <>{children(tick)}</>;
}
