import { useValueRef } from 'hooks/common/use-value-ref';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

type EventHandler = (event: MouseEvent) => 'unhandled' | 'handled';
type RegisterEventHandler = (handler: EventHandler) => (() => void);

const Context = createContext<{
  registerEventHandler: RegisterEventHandler;
} | null>(null);

export const Overlay = ({
  elems,
  onClickOutside,
  children,
}: {
  elems?: HTMLElement[];
  onClickOutside?: () => void;
  children: ReactNode;
}) => {
  const ref = useValueRef({ elems, onClickOutside });
  const parentContext = useContext(Context);

  const registeredHandlers = useRef<EventHandler[]>([]);
  const registerEventHandler = useCallback<RegisterEventHandler>((eventHandler) => {
    registeredHandlers.current.push(eventHandler)
    return () => {
      registeredHandlers.current = registeredHandlers.current.filter((handler) => handler !== eventHandler);
    }
  }, []);
  const contextValues = useMemo(() => ({
    registerEventHandler,
  }), [])

  // setup event listener
  useEffect(() => {
    const currentEventHandler: EventHandler = (event) => {
      // children overlays
      if (registeredHandlers.current.some(handler => handler(event) === 'handled')) {
        return 'handled';
      }

      // current overlay
      if (ref.current.elems?.some(e => e.contains(event.target as Node))) {
        // click inside current overlay
        ref.current.onClickOutside?.();
      }

      return 'handled';
    }

    if (parentContext) {
      return parentContext.registerEventHandler(currentEventHandler);
    }


    const listener = (event: MouseEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (!document.body.contains(event.target as Node)) {
        return;
      }

      currentEventHandler(event);
    };
    window.addEventListener('click', listener);
    return () => {
      window.removeEventListener('click', listener);
    };
  }, []);


  return <Context.Provider value={contextValues}>{children}</Context.Provider>;
};
