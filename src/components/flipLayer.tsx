import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';

interface PendingFlip {
  uid: string;
  fromRect: DOMRect;
}

interface FlipContextValue {
  scheduleFlip: (uid: string) => void;
}

const FlipContext = createContext<FlipContextValue | null>(null);

export function useFlip(): FlipContextValue {
  const ctx = useContext(FlipContext);
  if (!ctx) throw new Error('FlipProvider missing');
  return ctx;
}

const FLIP_DURATION_MS = 320;
const FLIP_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const FLY_Z_INDEX = '10001';

function escapeCardUid(uid: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(uid);
  }
  return uid.replace(/["\\]/g, '\\$&');
}

function findCardElement(uid: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-card-uid="${escapeCardUid(uid)}"]`,
  );
}

export function FlipProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<PendingFlip[]>([]);

  const scheduleFlip = useCallback((uid: string) => {
    const el = findCardElement(uid);
    if (!el) return;
    pendingRef.current.push({ uid, fromRect: el.getBoundingClientRect() });
  }, []);

  useLayoutEffect(() => {
    if (pendingRef.current.length === 0) return;
    const flips = pendingRef.current;
    pendingRef.current = [];
    for (const { uid, fromRect } of flips) {
      const el = findCardElement(uid);
      if (!el) continue;
      const toRect = el.getBoundingClientRect();
      const dx = fromRect.left - toRect.left;
      const dy = fromRect.top - toRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      const originalZ = el.style.zIndex;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.zIndex = FLY_Z_INDEX;
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING}`;
        el.style.transform = '';
      });
      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== 'transform') return;
        el.style.transition = '';
        el.style.transform = '';
        el.style.zIndex = originalZ;
        el.removeEventListener('transitionend', onEnd);
      };
      el.addEventListener('transitionend', onEnd);
    }
  });

  return (
    <FlipContext.Provider value={{ scheduleFlip }}>
      {children}
    </FlipContext.Provider>
  );
}
