import { useRef } from 'react';

export const useLastValue = <T>(value: T | null | undefined) => {
  const ref = useRef<T | null | undefined>(value);

  if (value) {
    ref.current = value;
  }

  return ref.current;
};
