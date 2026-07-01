import React from 'react';
import type { LevelArchitecture, IAMPolicy, IAMStatement } from '../engine/types';

interface ArchitecturePanelProps {
  architecture: LevelArchitecture;
  removedFromGroup?: string;
}

/** Summarize a policy's statements into human-readable lines. */
function summarizeStatements(statements: IAMStatement[]): { effect: string; text: string }[] {
  return statements.map((s) => {
    const actions = Array.isArray(s.Action) ? s.Action.join(', ') : s.Action;
    const resources = Array.isArray(s.Resource) ? s.Resource.join(', ') : s.Resource;
    return {
      effect: s.Effect,
      text: `${actions} on ${resources}`,
    };
  });
}

function summarizePolicies(policies: IAMPolicy[]): { effect: string; text: string }[] {
  return policies.flatMap((p) => summarizeStatements(p.Statement));
}

const ArchitecturePanel: React.FC<ArchitecturePanelProps> = ({ architecture, removedFromGroup }) => {
  const {
    userName,
    userArn,
    roleName,
    roleArn,
    groups,
    userPolicies,
    permissionsBoundary,
    scps,
    targetAction,
    targetResource,
    targetResourceName,
    targetServiceIcon,
  } = architecture;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2 scrollbar-thin">
      {/* SCP Ceiling */}
      {scps && scps.length > 0 && (
        <div className="border border-amber-500/50 rounded-lg bg-amber-900/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400 text-lg">🏛️</span>
            <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">
              Organization SCP Ceiling
            </h3>
          </div>
          <div className="border-t border-amber-500/20 pt-2 space-y-1">
            {scps.flatMap((scp) =>
              summarizeStatements(scp.Statement).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs font-mono">
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      s.effect === 'Allow'
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-red-900/40 text-red-400'
                    }`}
                  >
                    {s.effect.toUpperCase()}
                  </span>
                  <span className="text-gray-300 break-all">{s.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Permissions Boundary Ceiling */}
      {permissionsBoundary && (
        <div className="border border-purple-500/50 rounded-lg bg-purple-900/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400 text-lg">🛡️</span>
            <h3 className="text-purple-400 font-bold text-sm uppercase tracking-wider">
              Permissions Boundary
            </h3>
          </div>
          <div className="border-t border-purple-500/20 pt-2 space-y-1">
            {summarizeStatements(permissionsBoundary.Statement).map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono">
                <span
                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    s.effect === 'Allow'
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-red-900/40 text-red-400'
                  }`}
                >
                  {s.effect.toUpperCase()}
                </span>
                <span className="text-gray-300 break-all">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Identity Card */}
      <div className="border border-[#00d4ff]/30 rounded-lg bg-[#0d1117] p-3 shadow-[0_0_10px_rgba(0,212,255,0.1)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#00d4ff] text-lg">👤</span>
          <h3 className="text-[#00d4ff] font-bold text-sm">
            {roleName ? `Role: ${roleName}` : `User: ${userName}`}
          </h3>
        </div>
        <div className="bg-[#161b22] rounded px-2 py-1.5 font-mono text-[11px] text-gray-400 break-all">
          {roleArn || userArn}
        </div>
        {/* Inline User Policies */}
        {userPolicies.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#00d4ff]/10 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              Inline Policies
            </span>
            {summarizePolicies(userPolicies).map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono">
                <span
                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    s.effect === 'Allow'
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-red-900/40 text-red-400'
                  }`}
                >
                  {s.effect.toUpperCase()}
                </span>
                <span className="text-gray-300 break-all">{s.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flow Arrow */}
      <div className="flex justify-center text-[#00ff41]/40 text-2xl select-none">↓</div>

      {/* Groups */}
      {groups.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 px-1">
            Group Memberships
          </span>
          {groups.map((group) => {
            const isRemoved = removedFromGroup === group.name;
            return (
              <div
                key={group.name}
                className={`border rounded-lg p-3 transition-all duration-300 ${
                  isRemoved
                    ? 'border-gray-700 bg-gray-900/30 opacity-40'
                    : 'border-[#00ff41]/20 bg-[#0d1117]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <h4
                    className={`font-bold text-sm ${
                      isRemoved ? 'line-through text-gray-600' : 'text-[#00ff41]'
                    }`}
                  >
                    {group.name}
                  </h4>
                  {isRemoved && (
                    <span className="ml-auto text-[10px] text-red-400 uppercase tracking-wider">
                      Removed
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {summarizePolicies(group.policies).map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 text-xs font-mono ${
                        isRemoved ? 'line-through' : ''
                      }`}
                    >
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.effect === 'Allow'
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-red-900/40 text-red-400'
                        }`}
                      >
                        {s.effect.toUpperCase()}
                      </span>
                      <span className="text-gray-300 break-all">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flow Arrow */}
      <div className="flex justify-center text-[#00ff41]/40 text-2xl select-none">↓</div>

      {/* Target Resource */}
      <div className="border border-[#00ff41]/30 rounded-lg bg-[#0d1117] p-3 shadow-[0_0_10px_rgba(0,255,65,0.1)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{targetServiceIcon}</span>
          <h3 className="text-[#00ff41] font-bold text-sm">{targetResourceName}</h3>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 w-14 shrink-0">Action:</span>
            <span className="text-yellow-300 bg-yellow-900/20 px-1.5 py-0.5 rounded">
              {targetAction}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-500 w-14 shrink-0">Resource:</span>
            <span className="text-gray-300 break-all">{targetResource}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitecturePanel;
