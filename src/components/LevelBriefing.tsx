import React from 'react';
import type { LevelDefinition } from '../engine/types';

interface LevelBriefingProps {
  level: LevelDefinition;
  onCancel: () => void;
  onAccept: () => void;
}

const LevelBriefing: React.FC<LevelBriefingProps> = ({ level, onCancel, onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-2xl animate-[fadeIn_0.3s_ease-out]">
        <div className="border border-[#00d4ff]/30 rounded-xl bg-[#0a0a0f]/95 backdrop-blur-md p-5 md:p-8 shadow-[0_0_40px_rgba(0,212,255,0.15)] max-h-[85vh] flex flex-col">
          {/* Level Number Badge */}
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30">
              <span className="text-[#00d4ff] font-black text-base md:text-lg">{level.id}</span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-wide">{level.title}</h2>
              <p className="text-[#00d4ff]/60 text-[10px] md:text-xs font-mono">{level.subtitle}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent my-5 shrink-0" />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pr-3 scrollbar-thin mb-6 min-h-0">
            {/* Briefing Text */}
            <div className="mb-5">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {level.briefing}
              </p>
            </div>

            {/* Objective */}
            <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[#00ff41]">🎯</span>
                <span className="text-[10px] text-[#00ff41] uppercase tracking-widest font-bold">
                  Objective
                </span>
              </div>
              <p className="text-[#00ff41]/80 text-sm font-mono">{level.objective}</p>
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-center shrink-0">
            <button
              onClick={onAccept}
              className="px-8 py-3 font-bold rounded-lg text-sm tracking-wider uppercase transition-all duration-300 bg-[#00d4ff] text-[#0a0a0f] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:bg-[#00d4ff]/90"
            >
              Begin Mission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelBriefing;
