import { ReactNode } from 'react';
import { Text, View } from 'react-native';

export const StatusBar = ({ children }: { children: ReactNode }) => {
  return (
    <View className="py-2 px-4 w-full bg-red-600">
      {typeof children === 'string' ? (
        <Text className="text-white">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};
