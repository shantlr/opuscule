import { isEqual, pick } from 'lodash';
import { useEffect, useState } from 'react';

export const useElementWidth = (
  elem: HTMLElement | undefined | null,
  enabled = true,
) => {
  const [width, setWidth] = useState(() => (elem ? elem.clientWidth : 0));

  useEffect(() => {
    if (!enabled || !elem) {
      setWidth(0);
      return;
    }

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

export const useElementRect = (
  elem: HTMLElement | null | undefined,
  enabled = true,
) => {
  const [rect, setRect] = useState(() =>
    enabled
      ? pick(elem?.getBoundingClientRect(), ['top', 'left', 'width', 'height'])
      : null,
  );

  useEffect(() => {
    if (!enabled || !elem) {
      setRect(null);
      return;
    }

    const setElemRect = (rect: DOMRect) => {
      const r = pick(rect, ['top', 'left', 'width', 'height']);
      setRect((state) => (isEqual(r, state) ? state : r));
    };

    const resizeObserver = new ResizeObserver(() => {
      setElemRect(elem.getBoundingClientRect());
    });
    resizeObserver.observe(elem);

    const scrollListener = () => {
      setElemRect(elem.getBoundingClientRect());
    };

    window.addEventListener('scroll', scrollListener);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', scrollListener);
    };
  }, [enabled, elem]);

  return rect;
};
