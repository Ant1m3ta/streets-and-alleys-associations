import type {
  Action,
  Card,
  CategorySlot,
  GameState,
  Row,
  StackSide,
} from '../types';
import { countSimpleInCategory, totalSimpleInLevel } from './cards';

export function isWon(state: GameState): boolean {
  return state.consumedSimple.length >= totalSimpleInLevel(state.level);
}

export function hasMovesLeft(state: GameState): boolean {
  return state.movesLimit < 0 || state.movesUsed < state.movesLimit;
}

export function isLost(state: GameState): boolean {
  if (isWon(state)) return false;
  return !hasMovesLeft(state);
}

export function canPlaceInFoundation(card: Card, slot: CategorySlot): boolean {
  if (slot.lockedCategory === null) return card.isCategory;
  if (card.category !== slot.lockedCategory) return false;
  return !card.isCategory;
}

export function hasValidMoveForStackTop(card: Card, state: GameState): boolean {
  for (const row of state.rows) {
    if (canPlaceInFoundation(card, row.foundation)) return true;
  }
  return false;
}

export function applyAction(state: GameState, action: Action): GameState {
  if (!hasMovesLeft(state)) {
    throw new Error('No moves left');
  }
  switch (action.type) {
    case 'CYCLE_STACK':
      return applyCycle(state, action.rowIdx, action.side);
    case 'DROP_TO_FOUNDATION':
      return applyDropToFoundation(
        state,
        action.fromRowIdx,
        action.fromSide,
        action.toRowIdx,
      );
    case 'MOVE_TO_STACK':
      return applyMoveToStack(
        state,
        action.fromRowIdx,
        action.fromSide,
        action.toRowIdx,
        action.toSide,
      );
    case 'SHUFFLE':
      return applyShuffle(state);
  }
}

const MIN_CARDS_PER_STACK_ON_SHUFFLE = 3;

function applyShuffle(state: GameState): GameState {
  const all: Card[] = [];
  for (const row of state.rows) {
    all.push(...row.left.cards, ...row.right.cards);
  }
  if (all.length < 2) {
    throw new Error('Nothing to shuffle');
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  const totalSlots = state.rows.length * 2;
  let participating = totalSlots;
  while (
    participating > 1 &&
    all.length < MIN_CARDS_PER_STACK_ON_SHUFFLE * participating
  ) {
    participating--;
  }

  const slotIndices = Array.from({ length: totalSlots }, (_, i) => i);
  for (let i = slotIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slotIndices[i], slotIndices[j]] = [slotIndices[j], slotIndices[i]];
  }
  const chosenSlots = slotIndices.slice(0, participating);

  const sizes = new Array<number>(totalSlots).fill(0);
  if (all.length >= MIN_CARDS_PER_STACK_ON_SHUFFLE * participating) {
    for (const slot of chosenSlots) {
      sizes[slot] = MIN_CARDS_PER_STACK_ON_SHUFFLE;
    }
    let remaining = all.length - MIN_CARDS_PER_STACK_ON_SHUFFLE * participating;
    while (remaining > 0) {
      const slot = chosenSlots[Math.floor(Math.random() * chosenSlots.length)];
      sizes[slot]++;
      remaining--;
    }
  } else {
    // Not enough cards to give even a single stack the minimum — dump all into one.
    sizes[chosenSlots[0]] = all.length;
  }

  let idx = 0;
  const newRows = state.rows.map((row, rowIdx) => {
    const leftCount = sizes[rowIdx * 2];
    const rightCount = sizes[rowIdx * 2 + 1];
    const left = all.slice(idx, idx + leftCount);
    idx += leftCount;
    const right = all.slice(idx, idx + rightCount);
    idx += rightCount;
    return {
      ...row,
      left: { cards: left, position: 0 },
      right: { cards: right, position: 0 },
    };
  });
  return {
    ...state,
    rows: newRows,
    movesUsed: state.movesUsed + 1,
  };
}

function applyCycle(state: GameState, rowIdx: number, side: StackSide): GameState {
  const row = state.rows[rowIdx];
  if (!row) throw new Error('Invalid row');
  const stack = row[side];
  if (stack.cards.length < 2) {
    throw new Error('Nothing to cycle');
  }
  const [top, ...rest] = stack.cards;
  const cycled = [...rest, top];
  const newRow: Row = {
    ...row,
    [side]: { cards: cycled, position: (stack.position + 1) % cycled.length },
  };
  return {
    ...state,
    rows: state.rows.map((r, i) => (i === rowIdx ? newRow : r)),
    movesUsed: state.movesUsed + 1,
  };
}

function applyMoveToStack(
  state: GameState,
  fromRowIdx: number,
  fromSide: StackSide,
  toRowIdx: number,
  toSide: StackSide,
): GameState {
  if (fromRowIdx === toRowIdx && fromSide === toSide) {
    throw new Error('Cannot move onto the same stack');
  }
  const sourceRow = state.rows[fromRowIdx];
  if (!sourceRow) throw new Error('Invalid source row');
  const targetRow = state.rows[toRowIdx];
  if (!targetRow) throw new Error('Invalid target row');
  const sourceStack = sourceRow[fromSide];
  const targetStack = targetRow[toSide];
  if (sourceStack.cards.length === 0) throw new Error('Source stack empty');

  const movingCard = sourceStack.cards[0];
  const targetTop = targetStack.cards[0];
  if (targetTop && movingCard.category !== targetTop.category) {
    throw new Error('Categories do not match');
  }

  const newSourceCards = sourceStack.cards.slice(1);
  const revealedMoving = { ...movingCard, isRevealed: true };
  const newTargetCards = targetTop
    ? [revealedMoving, { ...targetTop, isRevealed: true }, ...targetStack.cards.slice(1)]
    : [revealedMoving];

  const newRows = state.rows.map((r, i) => {
    if (i === fromRowIdx && i === toRowIdx) {
      return {
        ...r,
        [fromSide]: { cards: newSourceCards, position: 0 },
        [toSide]: { cards: newTargetCards, position: 0 },
      };
    }
    if (i === fromRowIdx) {
      return { ...r, [fromSide]: { cards: newSourceCards, position: 0 } };
    }
    if (i === toRowIdx) {
      return { ...r, [toSide]: { cards: newTargetCards, position: 0 } };
    }
    return r;
  });

  return {
    ...state,
    rows: newRows,
    movesUsed: state.movesUsed + 1,
  };
}

function applyDropToFoundation(
  state: GameState,
  fromRowIdx: number,
  fromSide: StackSide,
  toRowIdx: number,
): GameState {
  const sourceRow = state.rows[fromRowIdx];
  if (!sourceRow) throw new Error('Invalid source row');
  const sourceStack = sourceRow[fromSide];
  if (sourceStack.cards.length === 0) throw new Error('Source stack empty');
  const card = sourceStack.cards[0];

  const targetRow = state.rows[toRowIdx];
  if (!targetRow) throw new Error('Invalid target row');
  if (!canPlaceInFoundation(card, targetRow.foundation)) {
    throw new Error('Cannot place this card in this foundation');
  }

  const newSourceRow: Row = {
    ...sourceRow,
    [fromSide]: { cards: sourceStack.cards.slice(1), position: 0 },
  };
  const rowsAfterPull = state.rows.map((r, i) =>
    i === fromRowIdx ? newSourceRow : r,
  );

  return placeCardInFoundation(
    { ...state, rows: rowsAfterPull },
    toRowIdx,
    card,
  );
}

function placeCardInFoundation(
  state: GameState,
  rowIdx: number,
  card: Card,
): GameState {
  const row = state.rows[rowIdx];
  const slot = row.foundation;
  let newSlot: CategorySlot;
  let newConsumed = state.consumedSimple;

  if (slot.lockedCategory === null) {
    // Empty foundation: card must be a category (caller already validated).
    newSlot = {
      lockedCategory: card.category,
      displayedCard: card,
      cardsConsumed: 0,
    };
  } else {
    // Locked foundation: card is a matching simple (caller already validated).
    newSlot = {
      ...slot,
      displayedCard: card,
      cardsConsumed: slot.cardsConsumed + 1,
    };
    newConsumed = [...state.consumedSimple, card];
  }

  let newRows = state.rows.map((r, i) =>
    i === rowIdx ? { ...r, foundation: newSlot } : r,
  );

  // Auto-clear: when all simples for the locked category are globally consumed,
  // every foundation locked to that category clears. Mirrors the rule from the
  // sibling word-solitaire project.
  if (newSlot.lockedCategory !== null) {
    const total = countSimpleInCategory(state.level, newSlot.lockedCategory);
    const consumedForCategory = newConsumed.filter(
      (c) => c.category === newSlot.lockedCategory,
    ).length;
    if (consumedForCategory >= total) {
      newRows = newRows.map((r) =>
        r.foundation.lockedCategory === newSlot.lockedCategory
          ? {
              ...r,
              foundation: {
                lockedCategory: null,
                displayedCard: null,
                cardsConsumed: 0,
              },
            }
          : r,
      );
    }
  }

  return {
    ...state,
    rows: newRows,
    consumedSimple: newConsumed,
    movesUsed: state.movesUsed + 1,
  };
}
