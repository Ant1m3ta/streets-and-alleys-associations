import type { GameState, LevelData, Row } from '../types';
import { createCardFromId, resetUidForLevel } from './cards';

export function buildInitialState(level: LevelData): GameState {
  resetUidForLevel();

  const rows: Row[] = level.rows.map((rowData) => ({
    left: {
      cards: rowData.left.map((id) => createCardFromId(level, id)),
      position: 0,
    },
    right: {
      cards: rowData.right.map((id) => createCardFromId(level, id)),
      position: 0,
    },
    foundation: { lockedCategory: null, displayedCard: null, cardsConsumed: 0 },
  }));

  return {
    level,
    rows,
    consumedSimple: [],
    movesUsed: 0,
    movesLimit: level.movesLimit,
  };
}
