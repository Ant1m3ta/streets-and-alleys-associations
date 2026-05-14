import type { AppAction, LevelData } from '../types';

interface Props {
  movesUsed: number;
  movesLimit: number;
  canRollback: boolean;
  levels: LevelData[];
  currentLevelIdx: number;
  onLevelChange: (idx: number) => void;
  dispatch: React.Dispatch<AppAction>;
}

export function Header({
  movesUsed,
  movesLimit,
  canRollback,
  levels,
  currentLevelIdx,
  onLevelChange,
  dispatch,
}: Props) {
  return (
    <header className="app-header">
      <select
        className="level-select"
        value={currentLevelIdx}
        onChange={(e) => onLevelChange(Number(e.target.value))}
      >
        {levels.map((lvl, i) => (
          <option key={lvl.levelId} value={i}>
            {lvl.levelId}
          </option>
        ))}
      </select>
      <div className="moves">
        Moves{' '}
        <strong>
          {movesUsed}
          {movesLimit >= 0 ? ` / ${movesLimit}` : ''}
        </strong>
      </div>
      <button
        type="button"
        className="rollback-btn"
        disabled={!canRollback}
        onClick={() => dispatch({ type: 'ROLLBACK' })}
      >
        Undo
      </button>
    </header>
  );
}
