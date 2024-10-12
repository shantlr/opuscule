import { createPortal } from 'react-dom';
import { Overlay } from '../base';
import { ReactNode } from 'react';
import { usePresence } from 'hooks/common/use-presence';
import clsx from 'clsx';
import { useElementRect } from 'hooks/dom/use-element-size';
import { useDomElem } from 'hooks/dom/use-dom-elem';
import { useLastValue } from 'hooks/common/use-last-value';

const TRANSITION_MS = 300;

export const ModalContent = ({ children }: { children: ReactNode }) => {
  return (
    <div className="rounded-2xl overflow-hidden bg-mainbg p-2 px-4 max-w-[95svw] max-h-[95svh] flex flex-col">
      {children}
    </div>
  );
};

export const Modal = ({
  open,
  trigger,
  children,
  onClose,
}: {
  open: boolean;
  trigger?: HTMLElement;
  children: ReactNode;
  onClose: () => void;
}) => {
  const presence = usePresence(open, TRANSITION_MS);
  const [content, setContent] = useDomElem<HTMLDivElement>();

  const lastTrigger = useLastValue(trigger);
  const triggerRect = useElementRect(lastTrigger);
  const contentRect = useElementRect(content);

  const transitionItemPresence = usePresence(
    (presence === 'initial' ||
      presence === 'entered' ||
      presence === 'entering') &&
      !!triggerRect &&
      !!contentRect,
    TRANSITION_MS,
  );

  if (presence === 'hidden') {
    return null;
  }

  const showContent = transitionItemPresence === 'entered';

  return (
    <Overlay>
      {createPortal(
        <div className="absolute w-full h-full left-0 top-0 flex items-center justify-center">
          {/* backdrop */}
          <div
            className={clsx('absolute w-full h-full transition-all', {
              'bg-black/30': presence === 'entered' || presence === 'entering',
              'bg-black/0': presence === 'initial' || presence === 'leaving',
            })}
            style={{
              transitionDuration: `${TRANSITION_MS}ms`,
            }}
            onClick={onClose}
          />
          {/* transition  */}
          {transitionItemPresence !== 'hidden' && (
            <div
              className="absolute transition-all p-8 rounded-2xl bg-mainbg"
              style={
                transitionItemPresence === 'initial' ||
                transitionItemPresence === 'leaving'
                  ? {
                      top: triggerRect?.top,
                      left: triggerRect?.left,
                      width: triggerRect?.width,
                      height: triggerRect?.height,
                      opacity: 0,
                      transitionDuration: `${TRANSITION_MS}ms`,
                    }
                  : {
                      top: contentRect?.top,
                      left: contentRect?.left,
                      width: contentRect?.width,
                      height: contentRect?.height,
                      opacity: 1,
                      transitionDuration: `${TRANSITION_MS}ms`,
                    }
              }
            />
          )}
          {/* content */}
          <div
            ref={setContent}
            className={clsx('absolute', {
              'opacity-0': !showContent,
              'opacity-100': showContent,
            })}
          >
            {children}
          </div>
        </div>,
        document.body,
      )}
    </Overlay>
  );
};
