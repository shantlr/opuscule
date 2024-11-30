import clsx from 'clsx';
import { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

const variants = {
  default: 'bg-light text-white',
};

export const Button = ({
  loading,
  children,
  variant,
  onPress,
}: {
  loading?: boolean;
  children: ReactNode;
  variant?: keyof typeof variants;
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
        'w-full h-[48px] flex items-center justify-center rounded',
        variants[variant ?? 'default'],
      )}
    >
      {loading && <ActivityIndicator />}
      <View>{children}</View>
    </Pressable>
  );
};
