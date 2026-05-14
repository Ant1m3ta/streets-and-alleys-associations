export interface Card {
  uid: string;
  cardId: string;
  category: string;
  word: string;
  isCategory: boolean;
  isIcon?: boolean;
  imageId?: string;
  // Sticky flag set on both participants of a stack-onto-stack drop. Buried
  // revealed cards render face-up in the visible strip.
  isRevealed?: boolean;
}

export type StackSide = 'left' | 'right';

// Index 0 = top (the exposed, interactive card). Last index = deepest.
// Cycling shifts index 0 to the end.
// `position` is a 0-indexed cycle counter: incremented mod cards.length on
// CYCLE_STACK, reset to 0 when a card leaves the stack (drop) or on shuffle.
export interface Stack {
  cards: Card[];
  position: number;
}

export interface CategorySlot {
  lockedCategory: string | null;
  displayedCard: Card | null;
  cardsConsumed: number;
}

export interface Row {
  left: Stack;
  right: Stack;
  foundation: CategorySlot;
}

export interface GameState {
  level: LevelData;
  rows: Row[];
  consumedSimple: Card[];
  movesUsed: number;
  movesLimit: number;
}

export interface LevelData {
  levelId: string;
  movesLimit: number;
  categories: CategoryData[];
  // Each entry is one row. Card arrays are ordered with index 0 = top.
  rows: LevelRow[];
}

export interface LevelRow {
  left: string[];
  right: string[];
}

export interface CategoryData {
  categoryId: string;
  wordsData: WordData[];
}

export interface WordData {
  wordId: string;
  icon?: boolean;
  imageId?: string;
}

export type Action =
  | { type: 'CYCLE_STACK'; rowIdx: number; side: StackSide }
  | {
      type: 'DROP_TO_FOUNDATION';
      toRowIdx: number;
      fromRowIdx: number;
      fromSide: StackSide;
    }
  | {
      type: 'MOVE_TO_STACK';
      fromRowIdx: number;
      fromSide: StackSide;
      toRowIdx: number;
      toSide: StackSide;
    }
  | { type: 'SHUFFLE' };

export type AppAction =
  | Action
  | { type: 'ROLLBACK' }
  | { type: 'RESET'; level: LevelData };

export type Outcome = 'playing' | 'won' | 'lost';

export interface AppState {
  state: GameState;
  history: GameState[];
  outcome: Outcome;
  lastError: string | null;
}
