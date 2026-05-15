import type { Card, GameState, LevelData, Row } from '../types';
import { createCardFromId, resetUidForLevel } from './cards';
import { STACK_REFILL_SIZE } from './moves';

export function buildInitialState(level: LevelData): GameState {
  resetUidForLevel();

  const reserve: Card[] = [];

  const rows: Row[] = level.rows.map((rowData) => {
    const leftAll = rowData.left.map((id) => createCardFromId(level, id));
    const rightAll = rowData.right.map((id) => createCardFromId(level, id));
    reserve.push(...leftAll.slice(STACK_REFILL_SIZE));
    reserve.push(...rightAll.slice(STACK_REFILL_SIZE));
    return {
      left: { cards: leftAll.slice(0, STACK_REFILL_SIZE), position: 0 },
      right: { cards: rightAll.slice(0, STACK_REFILL_SIZE), position: 0 },
      foundation: { lockedCategory: null, displayedCard: null, cardsConsumed: 0 },
    };
  });

  return {
    level,
    rows,
    reserve,
    consumedSimple: [],
    movesUsed: 0,
    movesLimit: level.movesLimit,
  };
}
