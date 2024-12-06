import clsx from 'clsx';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { Pressable } from '../pressable';

export const Checkbox = ({
  className,
  checked,
  onChange,
  children,
}: {
  className?: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
  children?: ReactNode;
}) => {
  return (
    <View className={clsx('flex flex-row items-center', className)}>
      <View className="h-input-default w-input-default flex justify-center items-center shrink-0">
        <Pressable
          className={clsx(
            'w-[40%] h-[40%] rounded border-2 border-accent shrink-0',
            {
              'bg-accent': !!checked,
            },
          )}
          role="checkbox"
          aria-checked={checked}
          onPress={() => {
            onChange?.(!checked);
          }}
        >
          <View />
        </Pressable>
      </View>
      {children}
    </View>
  );
};
