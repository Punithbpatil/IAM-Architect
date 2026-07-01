import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, EvaluationResult } from '../engine/types';
import { LEVELS } from '../engine/levels/index';
import { evaluatePolicy } from '../engine/evaluator';

const initialState: GameState = {
  phase: 'level-select',
  currentLevel: 1,
  completedLevels: [],
  currentCode: '',
  evaluationResult: null,
  isEvaluating: false,
  showBriefing: true,
  removedFromGroup: undefined,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, phase: 'level-select' };

    case 'SELECT_LEVEL': {
      const levelDef = LEVELS.find(l => l.id === action.level);
      return {
        ...state,
        phase: 'playing',
        currentLevel: action.level,
        currentCode: levelDef?.starterCode ?? '',
        evaluationResult: null,
        showBriefing: true,
        removedFromGroup: undefined,
      };
    }

    case 'SET_CODE':
      return { ...state, currentCode: action.code };

    case 'START_EVALUATION':
      return { ...state, isEvaluating: true, evaluationResult: null };

    case 'SET_RESULT':
      return {
        ...state,
        isEvaluating: false,
        evaluationResult: action.result,
        completedLevels: action.result?.allowed
          ? [...new Set([...state.completedLevels, state.currentLevel])]
          : state.completedLevels,
      };

    case 'CLEAR_RESULT':
      return { ...state, evaluationResult: null };

    case 'NEXT_LEVEL': {
      const nextLevel = state.currentLevel + 1;
      const nextLevelDef = LEVELS.find(l => l.id === nextLevel);
      if (!nextLevelDef) {
        return { ...state, phase: 'level-select', evaluationResult: null };
      }
      return {
        ...state,
        currentLevel: nextLevel,
        currentCode: nextLevelDef.starterCode,
        evaluationResult: null,
        showBriefing: true,
        removedFromGroup: undefined,
      };
    }

    case 'RESET_LEVEL': {
      const levelDef = LEVELS.find(l => l.id === state.currentLevel);
      return {
        ...state,
        currentCode: levelDef?.starterCode ?? '',
        evaluationResult: null,
        removedFromGroup: undefined,
      };
    }

    case 'SHOW_BRIEFING':
      return { ...state, showBriefing: true };

    case 'DISMISS_BRIEFING':
      return { ...state, showBriefing: false };
      
    case 'CANCEL_LEVEL_SELECT':
      return { ...state, showBriefing: false, phase: 'level-select' };

    case 'REMOVE_FROM_GROUP':
      return { ...state, removedFromGroup: action.groupName };

    case 'GO_TO_TITLE':
      return { ...state, phase: 'level-select', evaluationResult: null };

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const currentLevelDef = LEVELS.find(l => l.id === state.currentLevel) ?? LEVELS[0];

  const handleEvaluate = useCallback(() => {
    dispatch({ type: 'START_EVALUATION' });

    // Simulate a short "thinking" delay for dramatic effect
    setTimeout(() => {
      const levelDef = LEVELS.find(l => l.id === state.currentLevel);
      if (!levelDef) return;

      let result: EvaluationResult;

      // Level 2 special case: group-action type
      if (levelDef.policyTarget === 'group-action') {
        if (state.removedFromGroup === 'TempContractors') {
          // User was removed from the deny group — now check if the
          // remaining group policies grant access
          result = evaluatePolicy(
            { Version: '2012-10-17', Statement: [] },
            {
              principal: levelDef.architecture.userArn,
              action: levelDef.architecture.targetAction,
              resource: levelDef.architecture.targetResource,
            },
            levelDef.architecture,
            state.removedFromGroup
          );
        } else {
          // They haven't removed the group yet
          result = evaluatePolicy(
            { Version: '2012-10-17', Statement: [] },
            {
              principal: levelDef.architecture.userArn,
              action: levelDef.architecture.targetAction,
              resource: levelDef.architecture.targetResource,
            },
            levelDef.architecture,
            undefined
          );
        }
      } else {
        // Parse the player's JSON
        let playerPolicy;
        try {
          playerPolicy = JSON.parse(state.currentCode);
        } catch {
          result = {
            allowed: false,
            stage: 'ImplicitDeny',
            message: 'JSON Parse Error',
            details:
              'Your policy JSON is malformed. Please check for missing commas, brackets, or quotes and try again.',
          };
          dispatch({ type: 'SET_RESULT', result });
          return;
        }

        // Validate it has Statement array
        if (!playerPolicy.Statement || !Array.isArray(playerPolicy.Statement)) {
          result = {
            allowed: false,
            stage: 'ImplicitDeny',
            message: 'Invalid Policy Structure',
            details:
              'Your policy must contain a "Statement" array. AWS policies always require at least one statement.',
          };
          dispatch({ type: 'SET_RESULT', result });
          return;
        }

        const context = {
          principal: levelDef.architecture.userArn,
          action: levelDef.architecture.targetAction,
          resource: levelDef.architecture.targetResource,
          sourceAccount: levelDef.architecture.accountId,
          region: levelDef.architecture.region,
          conditions: levelDef.architecture.region
            ? { 'aws:RequestedRegion': levelDef.architecture.region }
            : undefined,
        };

        if (levelDef.customEvaluator) {
          result = levelDef.customEvaluator(playerPolicy, context, levelDef.architecture);
        } else {
          // Standard identity policy evaluation
          result = evaluatePolicy(playerPolicy, context, levelDef.architecture, undefined);
        }
      }

      dispatch({ type: 'SET_RESULT', result });
    }, 800);
  }, [state.currentLevel, state.currentCode, state.removedFromGroup]);

  return { state, dispatch, currentLevelDef, handleEvaluate };
}
