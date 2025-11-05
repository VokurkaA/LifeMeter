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

export default function ExerciseIcon({
  size = 24,
  className,
  fill,
  stroke,
  strokeWidth = 6, // used when rendering as outline
  ...rest
}: Props) {
  const sizeProps = className ? {} : { width: size, height: size };
  const isOutline = !fill || fill === 'none';
  const strokeColor = stroke ?? 'currentColor';
  const fillValue = fill ?? 'currentColor';

  return (
    <Svg
      viewBox="0 0 60 60"
      className={className ?? 'h-6 w-6 text-foreground'}
      {...sizeProps}
      {...rest}
    >
      <Path
        d="M55.875 22.1633L51.675 17.9633L53.925 15.6383L44.325 6.0383L42 8.2883L37.725 4.0133L39.975 1.6883C41.125 0.538298 42.55 -0.0242021 44.25 0.000797872C45.95 0.0257979 47.375 0.613298 48.525 1.7633L58.2 11.4383C59.35 12.5883 59.925 14.0008 59.925 15.6758C59.925 17.3508 59.35 18.7633 58.2 19.9133L55.875 22.1633ZM19.875 58.2383C18.725 59.3883 17.3125 59.9633 15.6375 59.9633C13.9625 59.9633 12.55 59.3883 11.4 58.2383L1.725 48.5633C0.575 47.4133 0 46.0008 0 44.3258C0 42.6508 0.575 41.2383 1.725 40.0883L3.975 37.8383L8.25 42.1133L5.925 44.3633L15.6 54.0383L17.85 51.7133L22.125 55.9883L19.875 58.2383ZM49.65 33.0383L53.925 28.7633L31.2 6.0383L26.925 10.3133L49.65 33.0383ZM28.65 54.0383L32.925 49.6883L10.275 27.0383L5.925 31.3133L28.65 54.0383ZM28.2 36.4883L36.45 28.3133L31.65 23.5133L23.475 31.7633L28.2 36.4883ZM32.925 58.2383C31.775 59.3883 30.35 59.9633 28.65 59.9633C26.95 59.9633 25.525 59.3883 24.375 58.2383L1.725 35.5883C0.575 34.4383 0 33.0133 0 31.3133C0 29.6133 0.575 28.1883 1.725 27.0383L6 22.7633C7.15 21.6133 8.5625 21.0383 10.2375 21.0383C11.9125 21.0383 13.325 21.6133 14.475 22.7633L19.2 27.4883L27.45 19.2383L22.725 14.5883C21.575 13.4383 21 12.0133 21 10.3133C21 8.6133 21.575 7.1883 22.725 6.0383L27 1.7633C28.15 0.613298 29.5625 0.0382979 31.2375 0.0382979C32.9125 0.0382979 34.325 0.613298 35.475 1.7633L58.2 24.4883C59.35 25.6383 59.925 27.0508 59.925 28.7258C59.925 30.4008 59.35 31.8133 58.2 32.9633L53.925 37.2383C52.775 38.3883 51.35 38.9633 49.65 38.9633C47.95 38.9633 46.525 38.3883 45.375 37.2383L40.725 32.5133L32.475 40.7633L37.2 45.4883C38.35 46.6383 38.925 48.0508 38.925 49.7258C38.925 51.4008 38.35 52.8133 37.2 53.9633L32.925 58.2383Z"
        fill={isOutline ? 'none' : fillValue}
        stroke={isOutline ? strokeColor : 'none'}
        strokeWidth={isOutline ? strokeWidth : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
}
