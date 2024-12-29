import { Image as BaseImage, ImageProps } from 'expo-image';
import { cssInterop } from 'nativewind';

cssInterop(BaseImage, {
  className: 'style',
});

export const Image = (props: ImageProps) => {
  return <BaseImage {...props} />;
};
