import { useWindowDimensions } from 'react-native';

export const useScreenSize = () => {
  return null;
};

export const useIsMobile = () => {
  const { width } = useWindowDimensions();
  return width < 640;
};
