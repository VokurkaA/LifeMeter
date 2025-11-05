import { Text, View } from 'react-native';
import { cn } from '@/lib/utils';

type ViewProps = React.ComponentPropsWithoutRef<typeof View>;
type TextProps = React.ComponentPropsWithoutRef<typeof Text>;
type CardVariant = 'elevated' | 'outline' | 'plain';

function Card({
  className,
  variant = 'elevated',
  ...props
}: ViewProps & { variant?: CardVariant }) {
  const variantClass =
    variant === 'elevated'
      ? 'border border-border/60 shadow-lg shadow-black/5 dark:shadow-black/40 elevation-3'
      : variant === 'outline'
        ? 'border border-border/60'
        : 'border border-transparent';

  return <View className={cn('rounded-2xl bg-card', variantClass, className)} {...props} />;
}

function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('gap-1.5 px-5 py-4', className)} {...props} />;
}

function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn('text-xl font-semibold tracking-tight text-card-foreground', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: TextProps) {
  return <Text className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('px-5 py-4 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex flex-row items-center justify-between gap-3 px-5 py-4 pt-0', className)}
      {...props}
    />
  );
}

interface SimpleCardProps {
  className?: string;
  title?: string;
  description?: string;
  content?: string;
  footer?: string;
  variant?: CardVariant;
}
function SimpleCard({ className, title, description, content, footer, variant }: SimpleCardProps) {
  return (
    <Card className={className} variant={variant}>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      {content && (
        <CardContent>
          <Text className="text-base text-card-foreground">{content}</Text>
        </CardContent>
      )}

      {footer && (
        <CardFooter>
          <Text className="text-sm text-muted-foreground">{footer}</Text>
        </CardFooter>
      )}
    </Card>
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, SimpleCard };
