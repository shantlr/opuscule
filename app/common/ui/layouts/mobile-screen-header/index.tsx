import { Href } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackNav } from '../back-nav';

export const HEADER_HEIGHT = 48;

export function MobileScreenHeader<Back extends object>({
  back,
  title,
}: {
  back?: Href<Back>;
  title: string;
}) {
  const safeArea = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: safeArea.top,
        height: 48 + safeArea.top,
      }}
      className="flex flex-row shrink-0 items-center bg-secondarybg overflow-hidden relative"
    >
      <Text className="w-full flex text-center flex-row justify-center items-center text-lg">
        {title}
      </Text>
      {back && (
        <View
          className="absolute left-2 flex justify-center"
          style={{
            top: safeArea.top,
            height: 48,
          }}
        >
          <BackNav href={back} />
        </View>
      )}
    </View>
  );
}
