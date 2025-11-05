import { cssInterop } from 'nativewind';
import React from 'react';
import Svg, { Line, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Props = Omit<SvgProps, 'width' | 'height' | 'stroke'> & {
  size?: number; // fallback if no className sizing provided
  className?: string; // Tailwind classes (e.g., "h-6 w-6 text-white")
  stroke?: string; // explicit stroke color (overrides currentColor)
  strokeWidth?: number; // explicit stroke width
};

export default function PlusIcon({
  size = 24,
  className,
  stroke,
  strokeWidth = 2,
  ...rest
}: Props) {
  const sizeProps = className ? {} : { width: size, height: size };
  const strokeValue = stroke ?? 'currentColor';

  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? 'h-6 w-6 text-white'}
      {...sizeProps}
      {...rest}
    >
      <Line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
        stroke={strokeValue}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
      <Line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke={strokeValue}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}
