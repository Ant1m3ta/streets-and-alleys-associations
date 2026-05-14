import type { AppAction, LevelData, Row as RowData } from '../types';
import { countSimpleInCategory } from '../game/cards';
import { Stack } from './Stack';
import { Foundation } from './Foundation';

interface Props {
  row: RowData;
  rowIdx: number;
  disabled: boolean;
  level: LevelData;
  dispatch: React.Dispatch<AppAction>;
}

export function Row({ row, rowIdx, disabled, level, dispatch }: Props) {
  const totalForCategory = row.foundation.lockedCategory
    ? countSimpleInCategory(level, row.foundation.lockedCategory)
    : 0;

  return (
    <div className="row">
      <Stack
        stack={row.left}
        rowIdx={rowIdx}
        side="left"
        disabled={disabled}
        dispatch={dispatch}
      />
      <Foundation
        slot={row.foundation}
        rowIdx={rowIdx}
        disabled={disabled}
        totalForCategory={totalForCategory}
        dispatch={dispatch}
      />
      <Stack
        stack={row.right}
        rowIdx={rowIdx}
        side="right"
        disabled={disabled}
        dispatch={dispatch}
      />
    </div>
  );
}
