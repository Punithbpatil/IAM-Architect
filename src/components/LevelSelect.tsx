import React from 'react';
import type { LevelDefinition } from '../engine/types';

interface LevelSelectProps {
  completedLevels: number[];
  onSelectLevel: (level: number) => void;
  levels: LevelDefinition[];
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  completedLevels,
  onSelectLevel,
  levels,
}) => {
  const isUnlocked = (_levelId: number) => {
    return true; // All levels unlocked by default per user request
  };

  const isCompleted = (levelId: number) => completedLevels.includes(levelId);

  const renderLevelGroup = (title: string, groupLevels: LevelDefinition[], colorClass: string, lineClass: string) => {
    if (groupLevels.length === 0) return null;
    return (
      <div className="mb-10 w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-4 pl-2">
          <h2 className={`text-lg font-bold uppercase tracking-widest ${colorClass}`}>{title}</h2>
          <div className={`flex-1 h-px bg-gradient-to-r ${lineClass} to-transparent`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupLevels.map((level) => {
            const unlocked = isUnlocked(level.id);
            const completed = isCompleted(level.id);

            return (
              <button
                key={level.id}
                onClick={() => unlocked && onSelectLevel(level.id)}
                disabled={!unlocked}
                className={`group relative text-left p-5 rounded-xl border transition-all duration-300 ${
                  completed
                    ? 'border-[#00ff41]/30 bg-[#00ff41]/5 hover:bg-[#00ff41]/10 hover:border-[#00ff41]/50 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] cursor-pointer'
                    : unlocked
                      ? 'border-[#00d4ff]/20 bg-[#0d1117] hover:bg-[#161b22] hover:border-[#00d4ff]/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.1)] cursor-pointer'
                      : 'border-gray-800/50 bg-[#0d1117]/50 opacity-40 cursor-not-allowed'
                }`}
              >
                {/* Level Number */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border ${
                      completed
                        ? 'bg-[#00ff41]/10 border-[#00ff41]/30 text-[#00ff41]'
                        : unlocked
                          ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]'
                          : 'bg-gray-900 border-gray-800 text-gray-600'
                    }`}
                  >
                    <span className="font-black text-lg">{level.id}</span>
                  </div>
                  {/* Status Icon */}
                  <div className="mt-1">
                    {completed ? (
                      <span className="text-[#00ff41] text-xl">✓</span>
                    ) : !unlocked ? (
                      <span className="text-gray-600 text-lg">🔒</span>
                    ) : null}
                  </div>
                </div>

                {/* Content */}
                <h3
                  className={`font-bold text-base mb-1 ${
                    completed
                      ? 'text-[#00ff41]'
                      : unlocked
                        ? 'text-white'
                        : 'text-gray-600'
                  }`}
                >
                  {level.title}
                </h3>
                <p
                  className={`text-xs font-mono ${
                    completed
                      ? 'text-[#00ff41]/50'
                      : unlocked
                        ? 'text-gray-500'
                        : 'text-gray-700'
                  }`}
                >
                  {level.subtitle}
                </p>

                {/* Completed bar */}
                {completed && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00ff41]/0 via-[#00ff41] to-[#00ff41]/0 rounded-b-xl" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const [activeTab, setActiveTab] = React.useState<'Easy' | 'Moderate' | 'Hard'>('Easy');

  const easyLevels = levels.filter(l => l.difficulty === 'Easy');
  const moderateLevels = levels.filter(l => l.difficulty === 'Moderate');
  const hardLevels = levels.filter(l => l.difficulty === 'Hard');

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] flex flex-col lg:overflow-hidden lg:h-[100dvh]">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 bg-[#0a0a0f]/95 backdrop-blur-md pt-4 pb-2 border-b border-gray-800/50 shadow-lg px-4 md:px-6 shrink-0">
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-black text-[#00ff41] tracking-[0.2em] md:tracking-[0.3em] mb-2 drop-shadow-[0_0_20px_rgba(0,255,65,0.3)]">
            IAM ARCHITECT
          </h1>
          <p className="text-[#00d4ff]/60 font-mono text-xs md:text-sm tracking-widest uppercase">
            Escape the Cloud
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
          {(['Easy', 'Moderate', 'Hard'] as const).map((tab) => {
            const isActive = activeTab === tab;
            let colorClass = '';
            if (tab === 'Easy') colorClass = isActive ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/50' : 'text-[#22c55e]/50 border-transparent hover:border-[#22c55e]/30';
            if (tab === 'Moderate') colorClass = isActive ? 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/50' : 'text-[#eab308]/50 border-transparent hover:border-[#eab308]/30';
            if (tab === 'Hard') colorClass = isActive ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/50' : 'text-[#ef4444]/50 border-transparent hover:border-[#ef4444]/30';

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 md:px-6 py-2 border rounded-full font-bold uppercase tracking-wider text-xs md:text-sm transition-all duration-300 ${colorClass}`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Level Groups Area */}
      <div className="flex-1 lg:overflow-y-auto lg:scrollbar-none flex flex-col min-h-0 p-4 md:p-6 pt-6">
        {activeTab === 'Easy' && renderLevelGroup('Easy', easyLevels, 'text-[#22c55e]', 'from-[#22c55e]/30')}
        {activeTab === 'Moderate' && renderLevelGroup('Moderate', moderateLevels, 'text-[#eab308]', 'from-[#eab308]/30')}
        {activeTab === 'Hard' && renderLevelGroup('Hard', hardLevels, 'text-[#ef4444]', 'from-[#ef4444]/30')}
      </div>

      {/* Progress Footer */}
      <div className="mt-4 mb-2 flex justify-center items-center gap-1 md:gap-2 shrink-0 flex-wrap px-2">
        {levels.map((level) => (
          <div
            key={level.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isCompleted(level.id)
                ? 'bg-[#00ff41] shadow-[0_0_6px_rgba(0,255,65,0.5)]'
                : isUnlocked(level.id)
                  ? 'bg-[#00d4ff]/40'
                  : 'bg-gray-700'
            }`}
          />
        ))}
        <span className="ml-3 text-gray-600 text-xs font-mono">
          {completedLevels.length}/{levels.length} Complete
        </span>
      </div>
    </div>
  );
};

export default LevelSelect;
