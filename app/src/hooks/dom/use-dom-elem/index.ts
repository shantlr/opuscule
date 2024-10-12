import { useState } from 'react';

export const useDomElem = <T = HTMLElement>() => {
  const [elem, setElem] = useState<T | null>(null);

  return [elem, setElem] as const;
};
