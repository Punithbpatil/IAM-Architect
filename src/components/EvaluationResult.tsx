import React from 'react';
import type { EvaluationResult as EvaluationResultType } from '../engine/types';

interface EvaluationResultProps {
  result: EvaluationResultType;
  onRetry: () => void;
  onNextLevel: () => void;
  isLastLevel: boolean;
}

/** Map evaluation stages to human-readable labels. */
function stageToLabel(stage: string): string {
  const labels: Record<string, string> = {
    ExplicitDeny: 'Explicit Deny in Policy',
    SCPDeny: 'Service Control Policy (SCP)',
    PermissionsBoundaryDeny: 'Permissions Boundary',
    IdentityAllow: 'Identity-Based Policy',
    ImplicitDeny: 'Implicit Deny (No Matching Allow)',
    TrustPolicyAllow: 'Trust Policy',
    TrustPolicyDeny: 'Trust Policy Deny',
  };
  return labels[stage] || stage;
}

const EvaluationResultComponent: React.FC<EvaluationResultProps> = ({
  result,
  onRetry,
  onNextLevel,
  isLastLevel,
}) => {
  if (result.allowed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onRetry}>
        <div className="animate-[fadeIn_0.3s_ease-out] w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="border border-[#00ff41]/40 rounded-xl bg-[#0a0a0f]/95 backdrop-blur-sm p-6 shadow-[0_0_30px_rgba(0,255,65,0.2)] animate-pulse-slow">
            {/* Success Header */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl">🔓</span>
              <h2 className="text-3xl font-black text-[#00ff41] tracking-widest drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">
                ACCESS GRANTED
              </h2>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#00ff41]/40 to-transparent my-4" />

            {/* Success Message */}
            <div className="text-center space-y-3">
              <p className="text-[#00ff41]/80 font-mono text-sm">{result.message}</p>
              <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 rounded-lg px-4 py-3">
                <p className="text-gray-300 text-xs font-mono leading-relaxed">{result.details}</p>
              </div>
            </div>

            {/* Action */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={onNextLevel}
                className="px-8 py-3 bg-[#00ff41] text-[#0a0a0f] font-bold rounded-lg
                           hover:bg-[#00ff41]/90 hover:shadow-[0_0_20px_rgba(0,255,65,0.4)]
                           transition-all duration-200 text-sm tracking-wider uppercase"
              >
                {isLastLevel ? '🎉 Game Complete!' : 'Next Level →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onRetry}>
      <div className="animate-[shakeX_0.4s_ease-out] w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="border border-red-500/40 rounded-xl bg-[#0a0a0f]/95 backdrop-blur-sm p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          {/* Denied Header */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🔒</span>
            <h2 className="text-3xl font-black text-red-500 tracking-widest">ACCESS DENIED</h2>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent my-4" />

          {/* Error Details */}
          <div className="space-y-3">
            {/* Error Code */}
            <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/30 rounded-lg px-4 py-2.5">
              <span className="text-red-400 text-xs font-mono font-bold shrink-0">
                AccessDeniedException
              </span>
              <span className="text-gray-600 text-xs">|</span>
              <span className="text-red-300/80 text-xs font-mono">
                Blocked by: {stageToLabel(result.stage)}
              </span>
            </div>

            {/* Message */}
            <p className="text-red-300/70 font-mono text-sm text-center">{result.message}</p>

            {/* Detailed Explanation */}
            <div className="bg-[#161b22] border border-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  Evaluation Details
                </span>
              </div>
              <p className="text-gray-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {result.details}
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={onRetry}
              className="px-8 py-3 bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/30
                         hover:bg-red-500/30 hover:border-red-500/50
                         transition-all duration-200 text-sm tracking-wider uppercase"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationResultComponent;
