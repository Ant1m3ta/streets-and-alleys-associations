import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Card } from '../types';
import { CardView } from './CardView';

interface FlyGhost {
  uid: string;
  card: Card;
  sourceRect: DOMRect;
}

interface FlyRequest {
  ghosts: FlyGhost[];
  targetRect: DOMRect;
}

interface Flight {
  id: number;
  ghosts: FlyGhost[];
  targetRect: DOMRect;
}

interface FlyContextValue {
  flyCards: (req: FlyRequest) => void;
  hasActiveAnimations: boolean;
  getDealDelayMs: () => number;
}

const FlyContext = createContext<FlyContextValue | null>(null);

export function useFlyLayer(): FlyContextValue {
  const ctx = useContext(FlyContext);
  if (!ctx) throw new Error('FlyProvider missing');
  return ctx;
}

const FLY_DURATION_MS = 280;
const FLY_STAGGER_MS = 90;
const FLY_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

export function FlyProvider({ children }: { children: ReactNode }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextId = useRef(0);
  const latestEndRef = useRef(0);

  const flyCards = useCallback((req: FlyRequest) => {
    if (req.ghosts.length === 0) return;
    const id = nextId.current++;
    setFlights((prev) => [...prev, { id, ghosts: req.ghosts, targetRect: req.targetRect }]);
    const totalMs = FLY_DURATION_MS + (req.ghosts.length - 1) * FLY_STAGGER_MS + 40;
    latestEndRef.current = Math.max(latestEndRef.current, Date.now() + totalMs);
    window.setTimeout(() => {
      setFlights((prev) => prev.filter((f) => f.id !== id));
    }, totalMs);
  }, []);

  const getDealDelayMs = useCallback(() => {
    return Math.max(0, latestEndRef.current - Date.now());
  }, []);

  return (
    <FlyContext.Provider
      value={{ flyCards, hasActiveAnimations: flights.length > 0, getDealDelayMs }}
    >
      {children}
      {flights.map((f) =>
        f.ghosts.map((g, i) => (
          <Ghost key={`${f.id}-${g.uid}`} ghost={g} target={f.targetRect} index={i} />
        )),
      )}
    </FlyContext.Provider>
  );
}

function Ghost({
  ghost,
  target,
  index,
}: {
  ghost: FlyGhost;
  target: DOMRect;
  index: number;
}) {
  const dx = target.left - ghost.sourceRect.left;
  const dy = target.top - ghost.sourceRect.top;
  const instant = index === 0;
  const [armed, setArmed] = useState(instant);

  useEffect(() => {
    if (instant) return;
    const raf = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(raf);
  }, [instant]);

  const transition = instant
    ? 'none'
    : `transform ${FLY_DURATION_MS}ms ${FLY_EASING} ${index * FLY_STAGGER_MS}ms`;
  const transform = armed ? `translate(${dx}px, ${dy}px)` : 'none';

  return (
    <div
      className="fly-ghost"
      style={{
        position: 'fixed',
        left: ghost.sourceRect.left,
        top: ghost.sourceRect.top,
        width: ghost.sourceRect.width,
        height: ghost.sourceRect.height,
        transform,
        transition,
        pointerEvents: 'none',
        zIndex: 9000 + index,
      }}
    >
      <CardView card={ghost.card} />
    </div>
  );
}
