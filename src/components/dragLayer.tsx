import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

type DropHandler = (payload: unknown) => void;

interface DragContextValue {
  startDrag: (
    e: ReactPointerEvent,
    payload: unknown,
    ghost: ReactNode,
    onTap: () => void,
    sourceKey: string,
  ) => void;
  registerDropTarget: (id: string, handler: DropHandler) => () => void;
  isDragging: boolean;
  draggingFromKey: string | null;
  activeHoverId: string | null;
}

const DragContext = createContext<DragContextValue | null>(null);

export function useDrag(): DragContextValue {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('DragProvider missing');
  return ctx;
}

const DRAG_THRESHOLD_PX = 6;

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  payload: unknown;
  ghost: ReactNode;
  onTap: () => void;
  active: boolean;
  hoverId: string | null;
  sourceKey: string;
}

interface ViewState {
  active: boolean;
  hoverId: string | null;
  sourceKey: string | null;
  x: number;
  y: number;
  ghost: ReactNode;
}

const INITIAL_VIEW: ViewState = {
  active: false,
  hoverId: null,
  sourceKey: null,
  x: 0,
  y: 0,
  ghost: null,
};

export function DragProvider({ children }: { children: ReactNode }) {
  const dropTargets = useRef<Map<string, DropHandler>>(new Map());
  const sessionRef = useRef<DragSession | null>(null);
  const [view, setView] = useState<ViewState>(INITIAL_VIEW);

  const registerDropTarget = useCallback((id: string, handler: DropHandler) => {
    dropTargets.current.set(id, handler);
    return () => {
      const cur = dropTargets.current.get(id);
      if (cur === handler) dropTargets.current.delete(id);
    };
  }, []);

  const findHoverId = useCallback((x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y);
    let cur: Element | null = el;
    while (cur) {
      const id = cur.getAttribute?.('data-drop-id');
      if (id) return id;
      cur = cur.parentElement;
    }
    return null;
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const s = sessionRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      if (!s.active) {
        const dx = e.clientX - s.startX;
        const dy = e.clientY - s.startY;
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
        s.active = true;
      }
      const hover = findHoverId(e.clientX, e.clientY);
      s.hoverId = hover;
      setView({
        active: true,
        hoverId: hover,
        sourceKey: s.sourceKey,
        x: e.clientX,
        y: e.clientY,
        ghost: s.ghost,
      });
    }

    function onUp(e: PointerEvent) {
      const s = sessionRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      if (s.active) {
        if (s.hoverId) {
          const handler = dropTargets.current.get(s.hoverId);
          if (handler) handler(s.payload);
        }
      } else {
        s.onTap();
      }
      sessionRef.current = null;
      setView(INITIAL_VIEW);
    }

    function onCancel(e: PointerEvent) {
      const s = sessionRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      sessionRef.current = null;
      setView(INITIAL_VIEW);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [findHoverId]);

  const startDrag = useCallback<DragContextValue['startDrag']>(
    (e, payload, ghost, onTap, sourceKey) => {
      sessionRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        payload,
        ghost,
        onTap,
        active: false,
        hoverId: null,
        sourceKey,
      };
    },
    [],
  );

  return (
    <DragContext.Provider
      value={{
        startDrag,
        registerDropTarget,
        isDragging: view.active,
        draggingFromKey: view.sourceKey,
        activeHoverId: view.hoverId,
      }}
    >
      {children}
      {view.active && view.ghost && (
        <div
          className="drag-ghost"
          style={{
            position: 'fixed',
            left: view.x,
            top: view.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          {view.ghost}
        </div>
      )}
    </DragContext.Provider>
  );
}
