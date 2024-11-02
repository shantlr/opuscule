import { Entypo } from '@expo/vector-icons';
import { Href, Link, useNavigation } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function MobileScreenHeader<Back extends object>({
  back,
  title,
}: {
  back?: Href<Back>;
  title: string;
}) {
  const { canGoBack, goBack } = useNavigation();
  const safeArea = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: safeArea.top,
        height: 48 + safeArea.top,
      }}
      className="flex flex-row shrink-0 items-center bg-secondarybg overflow-hidden relative"
    >
      <Text className="w-full flex text-center flex-row justify-center items-center text-lg text-primary">
        {title}
      </Text>
      {back && (
        <Link
          href={back}
          onPress={(event) => {
            if (canGoBack()) {
              event.preventDefault();
              event.stopPropagation();
              goBack();
            }
          }}
        >
          <View className="absolute left-0">
            <Entypo size={24} name="chevron-left" className="text-primary" />
          </View>
        </Link>
      )}
    </View>
  );
}
