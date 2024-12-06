import clsx from 'clsx';
import { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

const variants = {
  default:
    'border border-light bg-light text-white hover:bg-light/80 active:bg-light/60',
  accent:
    'border border-accent bg-accent text-white hover:bg-accent/80 active:bg-accent/60',
  'accent-outline':
    'bg-transparent text-accent border border-accent hover:border-accent/80 hover:text-accent/80 active:border-accent/60 active:text-accent/60',
};

const sizes = {
  default: 'h-[48px]',
  s: 'h-[32px]',
  xs: 'h-[24px]',
};

export const Button = ({
  loading,
  children,
  variant,
  size,
  onPress,
  className,
}: {
  loading?: boolean;
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
} & Pick<ComponentProps<typeof Pressable>, 'onPress'>) => {
  return (
    <Pressable
      role="button"
      onPress={(event) => {
        if (loading) {
          return;
        }

        onPress?.(event);
      }}
      className={clsx(
        'px-2 flex items-center justify-center rounded transition-all',
        variants[variant ?? 'default'],
        sizes[size ?? 'default'],
        className,
      )}
    >
      {loading && <ActivityIndicator />}
      <View>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </View>
    </Pressable>
  );
};
