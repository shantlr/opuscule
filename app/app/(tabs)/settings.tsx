import clsx from 'clsx';
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '@/common/ui/button';
import { Image } from '@/common/ui/image';
import { useLogout } from '@/features/auth/use-auth';
import {
  useSources,
  useSubscribeSource,
  useUnsubscribeSource,
} from '@/features/sources/hooks/use-sources';

export default function Settings() {
  const { data, isLoading } = useSources({});

  const { mutate: subscribe } = useSubscribeSource({});
  const { mutate: unsubscribe } = useUnsubscribeSource({});
  const { mutate: logout } = useLogout();

  return (
    <SafeAreaView className="p-4">
      <Text className="text-lg">Settings</Text>

      <Text className="mt-2 font-bold">Sources</Text>
      {isLoading && <ActivityIndicator />}
      <View role="list" className="flex gap-2">
        {data?.map((source) => (
          <View key={source.id} className="flex flex-row items-center gap-4">
            {source.logo_url ? (
              <Image source={source.logo_url} className="w-[48px] h-[48px]" />
            ) : (
              <View className="w-[48px] h-[48px]" />
            )}
            <Text>{source.name}</Text>
            <TouchableOpacity
              role="listitem"
              className={clsx('p-2 rounded border', {
                'bg-accent border-accent': source.subscribed,
              })}
              onPress={() => {
                if (source.subscribed) {
                  unsubscribe({ id: source.id });
                } else {
                  subscribe({ id: source.id });
                }
              }}
            >
              <Text
                className={clsx({
                  'text-white': source.subscribed,
                })}
              >
                {source.subscribed ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Button
        className="mt-8"
        variant="accent"
        onPress={() => {
          logout({});
        }}
      >
        LOGOUT
      </Button>
    </SafeAreaView>
  );
}
