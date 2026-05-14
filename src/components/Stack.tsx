import type { PointerEvent } from 'react';
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
const VISIBLE_DEPTH = 5;

export function Stack({ stack, rowIdx, side, disabled, dispatch }: Props) {
  const { startDrag, draggingFromKey } = useDrag();
  const sourceKey = `stack-${rowIdx}-${side}`;
  const top = stack.cards[0] ?? null;
  const isDraggingFromHere = draggingFromKey === sourceKey;

  const buriedDepth = Math.min(stack.cards.length - 1, VISIBLE_DEPTH - 1);
  const direction = side === 'left' ? -1 : 1;

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

  return (
    <div className={`stack stack-${side}`}>
      {Array.from({ length: buriedDepth }).map((_, i) => {
        const depth = buriedDepth - i;
        const offset = depth * FAN_OFFSET_PX * direction;
        return (
          <div
            key={`buried-${i}`}
            className="stack-card buried"
            style={{ transform: `translateX(${offset}px)`, zIndex: i }}
          >
            <CardView card={null} faceDown />
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
