import { useGameState } from './hooks/useGameState';
import { GameDashboard } from './components/GameDashboard';
import { LevelSelect } from './components/LevelSelect';
import { LEVELS } from './engine/levels/index';

function App() {
  const { state, dispatch, currentLevelDef, handleEvaluate } = useGameState();

  return (
    <div className="min-h-screen bg-void scan-line-overlay grid-bg">
      {state.phase === 'level-select' && (
        <LevelSelect
          completedLevels={state.completedLevels}
          onSelectLevel={(level) => dispatch({ type: 'SELECT_LEVEL', level })}
          levels={LEVELS}
        />
      )}

      {state.phase === 'playing' && (
        <GameDashboard
          state={state}
          dispatch={dispatch}
          currentLevelDef={currentLevelDef}
          onEvaluate={handleEvaluate}
        />
      )}
    </div>
  );
}

export default App;
