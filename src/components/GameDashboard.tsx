import React, { useState } from 'react';
import type { GameState, GameAction, LevelDefinition } from '../engine/types';
import ArchitecturePanel from './ArchitecturePanel';
import TerminalEditor from './TerminalEditor';
import EvaluationResultComponent from './EvaluationResult';
import LevelBriefing from './LevelBriefing';

interface GameDashboardProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  currentLevelDef: LevelDefinition;
  onEvaluate: () => void;
}

const TOTAL_LEVELS = 24;

const GameDashboard: React.FC<GameDashboardProps> = ({
  state,
  dispatch,
  currentLevelDef,
  onEvaluate,
}) => {
  const [showHint, setShowHint] = useState(false);

  const handleCodeChange = (code: string) => {
    dispatch({ type: 'SET_CODE', code });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_LEVEL' });
    setShowHint(false);
  };

  const handleRetry = () => {
    dispatch({ type: 'CLEAR_RESULT' });
  };

  const handleNextLevel = () => {
    dispatch({ type: 'NEXT_LEVEL' });
    setShowHint(false);
  };

  const isLastLevel = state.currentLevel >= TOTAL_LEVELS;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#0d1117] border-b border-gray-800/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch({ type: 'GO_TO_TITLE' })}
            className="text-gray-500 hover:text-[#00d4ff] transition-colors text-xs font-mono tracking-wider flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Levels</span>
          </button>
          <div className="w-px h-5 bg-gray-800" />
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {currentLevelDef.title}
            </h1>
            <p className="text-[10px] text-gray-500 font-mono">{currentLevelDef.subtitle}</p>
          </div>
        </div>

        {/* Level Progress Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((lvl) => (
            <div
              key={lvl}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                state.completedLevels.includes(lvl)
                  ? 'bg-[#00ff41] shadow-[0_0_6px_rgba(0,255,65,0.5)]'
                  : lvl === state.currentLevel
                    ? 'bg-[#00d4ff] shadow-[0_0_6px_rgba(0,212,255,0.5)]'
                    : 'bg-gray-700'
              }`}
              title={`Level ${lvl}`}
            />
          ))}
        </div>
      </header>

      {/* Main Content — Split Panels */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Top/Left: Architecture Panel */}
        <div className="w-full lg:w-[45%] p-4 lg:overflow-hidden flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800/30 shrink-0 lg:shrink min-h-[40vh] lg:min-h-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
              Architecture
            </span>
            <div className="flex-1 h-px bg-gray-800/50" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ArchitecturePanel
              architecture={currentLevelDef.architecture}
              removedFromGroup={state.removedFromGroup}
            />
          </div>
        </div>

        {/* Bottom/Right: Editor + Actions */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-[60vh] lg:min-h-0">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
              Policy Editor
            </span>
            <div className="flex-1 h-px bg-gray-800/50" />
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0 border border-gray-800 rounded-lg overflow-hidden">
            <TerminalEditor
              code={state.currentCode}
              onChange={handleCodeChange}
            />
          </div>

          {/* Hint Section */}
          {showHint && (
            <div className="mt-3 bg-[#161b22] border border-yellow-600/20 rounded-lg px-4 py-3 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-500">💡</span>
                <span className="text-[10px] text-yellow-500/80 uppercase tracking-widest font-bold">
                  Hint
                </span>
              </div>
              <p className="text-yellow-200/60 text-xs font-mono leading-relaxed mb-2">
                {currentLevelDef.hint}
              </p>
              {currentLevelDef.example && (
                <div className="mt-2 pt-2 border-t border-yellow-600/20">
                  <div className="text-[10px] text-yellow-500/80 uppercase tracking-widest font-bold mb-1">
                    Example
                  </div>
                  <pre className="text-[11px] text-gray-300 font-mono bg-[#0d1117] p-2 rounded border border-gray-800/50 overflow-x-auto whitespace-pre-wrap">
                    {currentLevelDef.example}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Special Actions (Level 2) */}
          {currentLevelDef.specialActions && currentLevelDef.specialActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {currentLevelDef.specialActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.id === 'remove-temp') {
                      dispatch({ type: 'REMOVE_FROM_GROUP', groupName: 'TempContractors' });
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30
                             rounded-lg text-orange-400 text-xs font-mono
                             hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-200"
                  title={action.description}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Evaluation Result */}
          {state.evaluationResult && (
            <div className="mt-3">
              <EvaluationResultComponent
                result={state.evaluationResult}
                onRetry={handleRetry}
                onNextLevel={handleNextLevel}
                isLastLevel={isLastLevel}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Bar */}
      <footer className="flex items-center justify-between px-6 py-3 bg-[#0d1117] border-t border-gray-800/50">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-500 text-xs font-mono hover:text-white
                       transition-colors border border-gray-800 rounded-lg hover:border-gray-600"
          >
            ↺ Reset
          </button>
          <button
            onClick={() => setShowHint((v) => !v)}
            className={`px-4 py-2 text-xs font-mono transition-all duration-200 border rounded-lg ${
              showHint
                ? 'text-yellow-500 border-yellow-600/30 bg-yellow-900/10'
                : 'text-gray-500 border-gray-800 hover:text-yellow-500 hover:border-yellow-600/30'
            }`}
          >
            💡 Hint
          </button>
        </div>

        <button
          onClick={onEvaluate}
          disabled={state.isEvaluating}
          className="px-8 py-2.5 bg-[#00ff41] text-[#0a0a0f] font-bold text-sm rounded-lg
                     shadow-[0_0_15px_rgba(0,255,65,0.3)]
                     hover:shadow-[0_0_25px_rgba(0,255,65,0.5)] hover:bg-[#00ff41]/90
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 tracking-wider uppercase flex items-center gap-2"
        >
          {state.isEvaluating ? (
            <>
              <span className="animate-spin">⟳</span>
              Evaluating...
            </>
          ) : (
            <>
              Run Evaluation
              <span>▶</span>
            </>
          )}
        </button>
      </footer>

      {/* Briefing Modal */}
      {state.showBriefing && (
        <LevelBriefing
          level={currentLevelDef}
          onCancel={() => dispatch({ type: 'CANCEL_LEVEL_SELECT' })}
          onAccept={() => dispatch({ type: 'DISMISS_BRIEFING' })}
        />
      )}
    </div>
  );
};

export { GameDashboard };
export default GameDashboard;
