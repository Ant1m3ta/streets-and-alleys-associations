import { useEffect } from 'react';
import type { AppAction, CategorySlot, StackSide } from '../types';
import { CardView } from './CardView';
import { useDrag } from './dragLayer';

interface Props {
  slot: CategorySlot;
  rowIdx: number;
  disabled: boolean;
  totalForCategory: number;
  dispatch: React.Dispatch<AppAction>;
}

export function Foundation({
  slot,
  rowIdx,
  disabled,
  totalForCategory,
  dispatch,
}: Props) {
  const { registerDropTarget, activeHoverId } = useDrag();
  const id = `foundation-${rowIdx}`;

  useEffect(() => {
    if (disabled) return;
    return registerDropTarget(id, (payload) => {
      const p = payload as { fromRowIdx: number; fromSide: StackSide };
      dispatch({
        type: 'DROP_TO_FOUNDATION',
        fromRowIdx: p.fromRowIdx,
        fromSide: p.fromSide,
        toRowIdx: rowIdx,
      });
    });
  }, [id, registerDropTarget, dispatch, rowIdx, disabled]);

  const isHovered = activeHoverId === id;
  const classes = [
    'foundation',
    slot.lockedCategory ? 'locked' : '',
    isHovered ? 'drop-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-drop-id={id} className={classes}>
      {slot.displayedCard ? (
        <CardView
          card={slot.displayedCard}
          inFoundation
          counter={
            slot.lockedCategory
              ? { current: slot.cardsConsumed, total: totalForCategory }
              : undefined
          }
        />
      ) : (
        <div className="empty-foundation">+</div>
      )}
    </div>
  );
}
