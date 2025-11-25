import { cssInterop } from 'nativewind';
import React from 'react';
import Svg, { Line, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Props = Omit<SvgProps, 'width' | 'height' | 'stroke'> & {
  size?: number;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
};

export default function XIcon({
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
      className={className ?? 'h-6 w-6 text-foreground'}
      {...sizeProps}
      {...rest}
    >
      <Line
        x1="6"
        y1="6"
        x2="18"
        y2="18"
        stroke={strokeValue}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1="6"
        y1="18"
        x2="18"
        y2="6"
        stroke={strokeValue}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
