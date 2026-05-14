import type { Card, GameState, LevelData, Row } from '../types';
import { createCardFromId, resetUidForLevel } from './cards';

const DEFAULT_STACK_CAP = 4;

export function buildInitialState(level: LevelData): GameState {
  resetUidForLevel();

  const defaultCap = level.stackCapDefault ?? DEFAULT_STACK_CAP;
  const reserve: Card[] = [];

  const rows: Row[] = level.rows.map((rowData) => {
    const leftCap = rowData.leftCap ?? defaultCap;
    const rightCap = rowData.rightCap ?? defaultCap;
    const leftAll = rowData.left.map((id) => createCardFromId(level, id));
    const rightAll = rowData.right.map((id) => createCardFromId(level, id));
    reserve.push(...leftAll.slice(leftCap));
    reserve.push(...rightAll.slice(rightCap));
    return {
      left: { cards: leftAll.slice(0, leftCap), position: 0, cap: leftCap },
      right: { cards: rightAll.slice(0, rightCap), position: 0, cap: rightCap },
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
