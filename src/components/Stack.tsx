import { useEffect, type PointerEvent } from 'react';
import type { AppAction, Stack as StackData, StackSide } from '../types';
import { CardView } from './CardView';
import { useDrag } from './dragLayer';

interface Props {
  stack: StackData;
  rowIdx: number;
  side: StackSide;
  disabled: boolean;
  dispatch: React.Dispatch<AppAction>;
}

const FAN_OFFSET_PX = 14;
const VISIBLE_DEPTH = 99;

export function Stack({ stack, rowIdx, side, disabled, dispatch }: Props) {
  const { startDrag, draggingFromKey, registerDropTarget, activeHoverId } = useDrag();
  const sourceKey = `stack-${rowIdx}-${side}`;
  const dropId = sourceKey;
  const top = stack.cards[0] ?? null;
  const isDraggingFromHere = draggingFromKey === sourceKey;
  const isHovered = activeHoverId === dropId && draggingFromKey !== sourceKey;

  useEffect(() => {
    if (disabled) return;
    return registerDropTarget(dropId, (payload) => {
      const p = payload as { fromRowIdx: number; fromSide: StackSide };
      if (p.fromRowIdx === rowIdx && p.fromSide === side) return;
      dispatch({
        type: 'MOVE_TO_STACK',
        fromRowIdx: p.fromRowIdx,
        fromSide: p.fromSide,
        toRowIdx: rowIdx,
        toSide: side,
      });
    });
  }, [dropId, registerDropTarget, dispatch, rowIdx, side, disabled]);

  const buriedDepth = Math.min(stack.cards.length - 1, VISIBLE_DEPTH - 1);
  const direction = side === 'left' ? -1 : 1;
  const isLocked = stack.cards.some((c) => c.isPileCard);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || !top) return;
    e.preventDefault();
    startDrag(
      e,
      { fromRowIdx: rowIdx, fromSide: side },
      <CardView card={top} />,
      () => dispatch({ type: 'CYCLE_STACK', rowIdx, side }),
      sourceKey,
    );
  };

  const stackClasses = [
    'stack',
    `stack-${side}`,
    isHovered ? 'drop-target' : '',
    isLocked ? 'locked' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={stackClasses} data-drop-id={dropId}>
      {Array.from({ length: buriedDepth }).map((_, i) => {
        const depth = buriedDepth - i;
        const offset = depth * FAN_OFFSET_PX * direction;
        const buriedCard = stack.cards[depth];
        const revealed = !!buriedCard?.isRevealed;
        return (
          <div
            key={buriedCard?.uid ?? `buried-${i}`}
            className="stack-card buried"
            style={{ transform: `translateX(${offset}px)`, zIndex: i }}
          >
            <CardView
              card={revealed ? buriedCard : null}
              faceDown={!revealed}
              buriedRevealedSide={revealed ? side : undefined}
            />
          </div>
        );
      })}
      {top ? (
        <div className="stack-card top" style={{ zIndex: VISIBLE_DEPTH }}>
          <CardView
            card={top}
            draggable={!disabled}
            isDragging={isDraggingFromHere}
            onPointerDown={handlePointerDown}
          />
        </div>
      ) : (
        <div className="stack-card empty">
          <div className="stack-empty-slot" />
        </div>
      )}
    </div>
  );
}
