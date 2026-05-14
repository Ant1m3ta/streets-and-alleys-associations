import { useLayoutEffect, useRef, type ReactNode } from 'react';

const FLIP_DURATION_MS = 320;
const FLIP_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

function applyFlip(el: HTMLElement, dx: number, dy: number): void {
  const baseTransform = el.style.transform;
  el.style.transition = 'none';
  el.style.transform = baseTransform
    ? `translate(${dx}px, ${dy}px) ${baseTransform}`
    : `translate(${dx}px, ${dy}px)`;
  void el.offsetHeight;
  requestAnimationFrame(() => {
    el.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING}`;
    el.style.transform = baseTransform;
  });
  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'transform') return;
    el.style.transition = '';
    el.style.transform = baseTransform;
    el.removeEventListener('transitionend', onEnd);
  };
  el.addEventListener('transitionend', onEnd);
}

export function FlipProvider({ children }: { children: ReactNode }) {
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());

  useLayoutEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-card-uid]');
    const prev = prevRectsRef.current;
    const next = new Map<string, DOMRect>();
    for (const el of cards) {
      const uid = el.dataset.cardUid;
      if (!uid) continue;
      const rect = el.getBoundingClientRect();
      next.set(uid, rect);
      const oldRect = prev.get(uid);
      if (!oldRect) continue;
      const dx = oldRect.left - rect.left;
      const dy = oldRect.top - rect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      applyFlip(el, dx, dy);
    }
    prevRectsRef.current = next;
  });

  return <>{children}</>;
}
