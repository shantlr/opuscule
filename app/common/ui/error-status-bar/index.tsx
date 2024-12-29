import { ReactNode } from 'react';
import { Text, View } from 'react-native';

export const ErrorStatusBar = ({ children }: { children: ReactNode }) => {
  return (
    <View className="w-full p-2">
      <View className=" py-2 px-4 w-full bg-red-300 rounded border border-red-600">
        {typeof children === 'string' ? (
          <Text className="text-red-800">{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
};
