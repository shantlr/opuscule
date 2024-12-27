import { useRef } from 'react';

export const useValueRef = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};
