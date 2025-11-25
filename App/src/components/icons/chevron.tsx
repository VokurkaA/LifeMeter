import { cn } from '@/lib/utils';
import { cssInterop } from 'nativewind';
import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Direction = 'down' | 'up' | 'left' | 'right';

type Props = Omit<SvgProps, 'width' | 'height' | 'stroke'> & {
  size?: number; // fallback if no Tailwind sizing is provided
  className?: string; // e.g. "h-4 w-4 text-muted-foreground"
  stroke?: string; // overrides currentColor
  strokeWidth?: number;
  direction?: Direction;
};

export function ChevronIcon({
  size = 24,
  className,
  stroke,
  strokeWidth = 2,
  direction = 'down',
  ...rest
}: Props) {
  const sizeProps = className ? {} : { width: size, height: size };
  const strokeValue = stroke ?? 'currentColor';

  // Rotation for each direction
  const rotation: Record<Direction, string> = {
    down: 'rotate-0',
    up: 'rotate-180',
    left: '-rotate-90',
    right: 'rotate-90',
  };

  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className ?? 'h-4 w-4 text-foreground', rotation[direction])}
      {...sizeProps}
      {...rest}
    >
      <Path
        d="M6 9l6 6 6-6"
        stroke={strokeValue}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default ChevronIcon;
