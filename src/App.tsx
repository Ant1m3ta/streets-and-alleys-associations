import { useEffect, useReducer, useState } from 'react';
import { LEVELS } from './levels';
import { makeInitialAppState, reduce } from './game/reducer';
import { DragProvider } from './components/dragLayer';
import { FlipProvider } from './components/flipLayer';
import { FlyProvider, useFlyLayer } from './components/FlyLayer';
import { Header } from './components/Header';
import { Reserve } from './components/Reserve';
import { Row } from './components/Row';
import { Overlay } from './components/Overlay';

export function App() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [appState, dispatch] = useReducer(reduce, LEVELS[0], makeInitialAppState);

  useEffect(() => {
    if (appState.lastError) {
      console.warn('Move rejected:', appState.lastError);
    }
  }, [appState.lastError]);

  const blocked = appState.outcome !== 'playing';

  function handleLevelChange(idx: number) {
    setLevelIdx(idx);
    dispatch({ type: 'RESET', level: LEVELS[idx] });
  }
  function handleRestart() {
    dispatch({ type: 'RESET', level: LEVELS[levelIdx] });
  }
  function handleNext() {
    handleLevelChange((levelIdx + 1) % LEVELS.length);
  }

  return (
    <FlyProvider>
      <FlipProvider trigger={appState}>
        <DragProvider>
          <div className="app">
            <Header
              movesUsed={appState.state.movesUsed}
              movesLimit={appState.state.movesLimit}
              canRollback={appState.history.length > 0}
              canShuffle={!blocked}
              levels={LEVELS}
              currentLevelIdx={levelIdx}
              onLevelChange={handleLevelChange}
              dispatch={dispatch}
            />
            <div className="rows">
              {appState.state.rows.map((row, idx) => (
                <Row
                  key={idx}
                  row={row}
                  rowIdx={idx}
                  disabled={blocked}
                  level={appState.state.level}
                  dispatch={dispatch}
                />
              ))}
            </div>
            <Reserve count={appState.state.reserve.length} />
            <OverlayGate
              outcome={appState.outcome}
              movesUsed={appState.state.movesUsed}
              onNext={handleNext}
              onRestart={handleRestart}
            />
          </div>
        </DragProvider>
      </FlipProvider>
    </FlyProvider>
  );
}

function OverlayGate({
  outcome,
  movesUsed,
  onNext,
  onRestart,
}: {
  outcome: 'playing' | 'won' | 'lost';
  movesUsed: number;
  onNext: () => void;
  onRestart: () => void;
}) {
  const { hasActiveAnimations } = useFlyLayer();
  if (hasActiveAnimations) return null;
  if (outcome === 'won') {
    return (
      <Overlay
        title="You won!"
        subtitle={`Cleared in ${movesUsed} moves`}
        primaryLabel="Next level"
        onPrimary={onNext}
        secondaryLabel="Play again"
        onSecondary={onRestart}
      />
    );
  }
  if (outcome === 'lost') {
    return (
      <Overlay
        title="Out of moves"
        primaryLabel="Restart"
        onPrimary={onRestart}
      />
    );
  }
  return null;
}
