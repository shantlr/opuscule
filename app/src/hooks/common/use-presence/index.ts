import { useEffect, useState } from 'react';

type PresenceState = 'initial' | 'entering' | 'entered' | 'leaving' | 'hidden';

export const usePresence = (show: boolean, transitionDelayMs = 300) => {
  const [state, setState] = useState<PresenceState>(() =>
    show ? 'initial' : 'hidden',
  );

  useEffect(() => {
    if (show) {
      // to entered
      switch (state) {
        case 'entered': {
          return;
        }
        case 'hidden': {
          setState('initial');
          return;
        }
        case 'initial':
        case 'leaving': {
          const handle = setTimeout(() => {
            setState('entering');
          }, 20);
          return () => clearTimeout(handle);
        }
        case 'entering': {
          const handle = setTimeout(() => {
            setState('entered');
          }, transitionDelayMs);
          return () => {
            clearTimeout(handle);
          };
        }
      }
    } else {
      // to hidden
      switch (state) {
        case 'initial': {
          setState('hidden');
          return;
        }

        case 'entered':
        case 'entering': {
          setState('leaving');
          return;
        }
        case 'leaving': {
          const handle = setTimeout(() => {
            setState('hidden');
          }, transitionDelayMs);
          return () => {
            clearTimeout(handle);
          };
        }
        case 'hidden': {
          return;
        }
      }
    }
  }, [state, show, transitionDelayMs]);

  return state;
};
