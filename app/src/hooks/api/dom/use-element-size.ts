import { useEffect, useState } from 'react';

export const useElementWidth = (elem: HTMLElement | null, enabled = true) => {
  const [width, setWidth] = useState(() => (elem ? elem.clientWidth : 0));

  useEffect(() => {
    if (!enabled || !elem) {
      return;
    }
    console.log({ elem });

    setWidth(elem.clientWidth);
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });

    resizeObserver.observe(elem);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elem, enabled]);

  return width;
};
