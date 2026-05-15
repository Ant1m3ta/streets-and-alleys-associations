import { useEffect, useRef } from 'react';
import type { AppAction, Card, CategorySlot, StackSide } from '../types';
import { canPlaceInFoundation } from '../game/moves';
import { CardView } from './CardView';
import { useDrag } from './dragLayer';
import { useFlyLayer } from './FlyLayer';

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
  const { flyCards } = useFlyLayer();
  const id = `foundation-${rowIdx}`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef(slot);
  slotRef.current = slot;

  useEffect(() => {
    if (disabled) return;
    return registerDropTarget(id, (payload) => {
      const p = payload as {
        fromRowIdx: number;
        fromSide: StackSide;
        pileCards?: Card[];
      };
      const pile = p.pileCards ?? [];
      if (pile.length >= 2 && pileWouldClear(pile, slotRef.current)) {
        const targetRect = rootRef.current?.getBoundingClientRect();
        if (targetRect) {
          const ghosts = pile
            .map((card) => {
              const el = document.querySelector<HTMLElement>(
                `[data-card-uid="${card.uid}"]`,
              );
              if (!el) return null;
              return { uid: card.uid, card, sourceRect: el.getBoundingClientRect() };
            })
            .filter((g): g is { uid: string; card: Card; sourceRect: DOMRect } => g !== null);
          flyCards({ ghosts, targetRect });
        }
        dispatch({
          type: 'DROP_PILE_TO_FOUNDATION',
          fromRowIdx: p.fromRowIdx,
          fromSide: p.fromSide,
          toRowIdx: rowIdx,
        });
        return;
      }
      dispatch({
        type: 'DROP_TO_FOUNDATION',
        fromRowIdx: p.fromRowIdx,
        fromSide: p.fromSide,
        toRowIdx: rowIdx,
      });
    });
  }, [id, registerDropTarget, dispatch, rowIdx, disabled, flyCards]);

  const isHovered = activeHoverId === id;
  const classes = [
    'foundation',
    slot.lockedCategory ? 'locked' : '',
    isHovered ? 'drop-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={rootRef} data-drop-id={id} className={classes}>
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

function pileWouldClear(pile: Card[], slot: CategorySlot): boolean {
  let simulated = slot;
  for (const card of pile) {
    if (!canPlaceInFoundation(card, simulated)) return false;
    simulated =
      simulated.lockedCategory === null
        ? { lockedCategory: card.category, displayedCard: card, cardsConsumed: 0 }
        : { ...simulated, displayedCard: card, cardsConsumed: simulated.cardsConsumed + 1 };
  }
  return true;
}
