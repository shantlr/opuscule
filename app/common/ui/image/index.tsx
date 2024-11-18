import { Image as BaseImage } from 'expo-image';
import { cssInterop } from 'nativewind';
import { ComponentProps } from 'react';

cssInterop(BaseImage, {
  className: 'style',
});

export const Image = (props: ComponentProps<typeof BaseImage>) => {
  return <BaseImage {...props} />;
};
