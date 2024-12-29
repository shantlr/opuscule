import { ActivityIndicator, View } from 'react-native';

export const LoadingScreen = () => {
  return (
    <View className="h-full w-full flex justify-center items-center">
      <ActivityIndicator />
    </View>
  );
};
