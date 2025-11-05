import { cssInterop } from 'nativewind';
import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Props = Omit<SvgProps, 'width' | 'height'> & {
  size?: number;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export default function HomeIcon({
  size = 24,
  className,
  fill,
  stroke,
  strokeWidth = 2,
  ...rest
}: Props) {
  const sizeProps = className ? {} : { width: size, height: size };
  const isOutline = !fill || fill === 'none';
  const strokeValue = stroke ?? 'currentColor';
  const fillValue = fill ?? 'currentColor';

  return (
    <Svg
      viewBox="0 0 48 54"
      className={className ?? 'h-6 w-6 text-foreground'}
      {...sizeProps}
      {...rest}
    >
      <Path
        d="M6 48H15V30H33V48H42V21L24 7.5L6 21V48ZM0 54V18L24 0L48 18V54H27V36H21V54H0Z"
        fill={isOutline ? 'none' : fillValue}
        stroke={isOutline ? strokeValue : 'none'}
        strokeWidth={isOutline ? strokeWidth : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
}
