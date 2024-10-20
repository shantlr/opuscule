import { KeyboardEvent as ReactKeyboardEvent, useEffect } from 'react';
import { useValueRef } from '../use-value-ref';

type Key =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Enter'
  | 'Escape'
  | 'Espace';

type KeyListenerMap = { [key in Key]?: () => void };

export const keyListener = (listeners: KeyListenerMap) => {
  return (event: ReactKeyboardEvent | KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    if (event.key in listeners) {
      listeners[event.key as Key]?.();
    }
  };
};

export const useListenKey = (
  listener: KeyListenerMap,
  enabled: boolean = true,
) => {
  const listenerRef = useValueRef(keyListener(listener));

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const listener = (event: ReactKeyboardEvent | KeyboardEvent) => {
      listenerRef.current(event);
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, [enabled, listenerRef]);
};
