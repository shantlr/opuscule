import { useForm } from '@tanstack/react-form';
import clsx from 'clsx';
import { useRouter } from 'expo-router';
import { reduce } from 'lodash';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/common/ui/button';
import {
  useRefetchSourceMany,
  useSources,
  useSubscribeSourceMany,
} from '@/features/sources/hooks/use-sources';

const SubscribeForm = ({
  data,
  isSubmitting,
  onSubmit,
}: {
  data: NonNullable<ReturnType<typeof useSources>['data']>;
  isSubmitting: boolean;
  onSubmit: (values: { sourceIds: string[] }) => void;
}) => {
  const form = useForm<{ selected: Record<string, boolean> }>({
    defaultValues: {
      selected: Object.fromEntries(data.map((d) => [d.id, d.subscribed])),
    },
    onSubmit: ({ value }) => {
      onSubmit({
        sourceIds: reduce(
          value.selected,
          (acc, checked, key) => {
            if (checked) {
              acc.push(key);
            }
            return acc;
          },
          [] as string[],
        ),
      });
    },
  });

  // cleanup any non existing from data
  useEffect(() => {
    if (!data) {
      return;
    }

    Object.entries(form.state.values.selected).forEach(([key]) => {
      if (!data.find((source) => source.id === key)) {
        form.setFieldValue(`selected.${key}`, false);
      }
    });
  }, [data]);

  return (
    <View role="form">
      <View role="list" className="gap-2">
        {data.map((source) => (
          <form.Field key={source.id} name={`selected.${source.id}`}>
            {(field) => (
              <View role="listitem">
                <Pressable
                  className={clsx(
                    'p-2 rounded border hover:border-accent transition-all',
                    {
                      'border-light': !field.state.value,
                      'bg-accent border-transparent group': !!field.state.value,
                    },
                  )}
                  onPress={() => {
                    field.handleChange(!field.state.value);
                  }}
                >
                  <View className="">
                    <Text
                      className={clsx('transition-all', {
                        'text-white': !!field.state.value,
                      })}
                    >
                      {source.name}
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}
          </form.Field>
        ))}
        <Button
          loading={isSubmitting}
          onPress={() => {
            form.handleSubmit();
          }}
        >
          SUBMIT
        </Button>
      </View>
    </View>
  );
};

export default function Welcome() {
  const { data, isLoading } = useSources({});
  const router = useRouter();
  const { mutate: refetchSources, isLoading: isRefetching } =
    useRefetchSourceMany({
      onSuccess() {
        router.replace('/');
      },
    });
  const { mutate, isLoading: isSubmitting } = useSubscribeSourceMany({
    onSuccess(data, { source_ids }) {
      refetchSources({
        source_ids,
      });
    },
  });

  return (
    <View className="flex top-[15%] items-center">
      <Text role="heading" className="text-xl">
        Welcome
      </Text>
      <View>
        <Text className="mt-8 mb-4">
          Select the sources you want to subscribed to:
        </Text>
        <View>
          {isLoading && <ActivityIndicator />}
          {data?.length === 0 && (
            <Text>No sources found, please try again later</Text>
          )}
          {!!data && data?.length > 0 && (
            <SubscribeForm
              data={data}
              isSubmitting={isSubmitting || isRefetching}
              onSubmit={(values) => {
                mutate({ source_ids: values.sourceIds });
              }}
            />
          )}
        </View>
      </View>
    </View>
  );
}
