import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFlyLayer } from './FlyLayer';

const FLIP_DURATION_MS = 320;
const FLIP_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const RESERVE_STAGGER_MS = 80;

function applyFlip(
  el: HTMLElement,
  dx: number,
  dy: number,
  delayMs: number,
): void {
  const baseTransform = el.style.transform;
  el.style.transition = 'none';
  el.style.transform = baseTransform
    ? `translate(${dx}px, ${dy}px) ${baseTransform}`
    : `translate(${dx}px, ${dy}px)`;
  void el.offsetHeight;
  const transitionValue =
    delayMs > 0
      ? `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING} ${delayMs}ms`
      : `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING}`;
  requestAnimationFrame(() => {
    el.style.transition = transitionValue;
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

export function FlipProvider({
  children,
  trigger,
}: {
  children: ReactNode;
  trigger: unknown;
}) {
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevReserveRectRef = useRef<DOMRect | null>(null);
  const { getDealDelayMs } = useFlyLayer();

  useLayoutEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[data-card-uid]');
    const prev = prevRectsRef.current;
    const reserveFromRect = prevReserveRectRef.current;
    const next = new Map<string, DOMRect>();
    type Move = {
      el: HTMLElement;
      dx: number;
      dy: number;
      fromReserve: boolean;
    };
    const moves: Move[] = [];
    for (const el of cards) {
      const uid = el.dataset.cardUid;
      if (!uid) continue;
      const rect = el.getBoundingClientRect();
      next.set(uid, rect);
      const fromPrev = prev.get(uid);
      const oldRect = fromPrev ?? reserveFromRect;
      if (!oldRect) continue;
      const dx = oldRect.left - rect.left;
      const dy = oldRect.top - rect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      moves.push({ el, dx, dy, fromReserve: !fromPrev });
    }
    const reserveCount = moves.reduce(
      (n, m) => n + (m.fromReserve ? 1 : 0),
      0,
    );
    const dealOffset = getDealDelayMs();
    let reserveIdx = 0;
    for (const m of moves) {
      const delay = m.fromReserve
        ? dealOffset + (reserveCount - 1 - reserveIdx++) * RESERVE_STAGGER_MS
        : 0;
      applyFlip(m.el, m.dx, m.dy, delay);
    }
    prevRectsRef.current = next;
    const reserveEl = document.querySelector<HTMLElement>(
      '[data-reserve-anchor] .card',
    );
    prevReserveRectRef.current = reserveEl?.getBoundingClientRect() ?? null;
  }, [trigger]);

  return <>{children}</>;
}
