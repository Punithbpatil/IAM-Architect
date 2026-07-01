// ─────────────────────────────────────────────────────────────
// IAM Architect: Escape the Cloud — Type Definitions
// These types mirror real AWS IAM structures so players
// learn authentic policy shapes while playing.
// ─────────────────────────────────────────────────────────────

/** The two possible effects in an IAM policy statement. */
export type Effect = 'Allow' | 'Deny';

/**
 * Condition operators supported by our engine.
 * We support the most common ones used in SCPs and policies.
 */
export type ConditionOperator =
  | 'StringEquals'
  | 'StringNotEquals'
  | 'StringLike'
  | 'ArnEquals'
  | 'ArnLike';

/**
 * A condition block in an IAM statement.
 * Structure: { "StringEquals": { "aws:RequestedRegion": "us-east-1" } }
 */
export type ConditionBlock = {
  [operator in ConditionOperator]?: {
    [key: string]: string | string[];
  };
};

/** A single IAM policy statement. */
export interface IAMStatement {
  Sid?: string;
  Effect: Effect;
  Action: string | string[];
  Resource: string | string[];
  Condition?: ConditionBlock;
  Principal?: string | { AWS: string | string[] } | { Service: string | string[] };
}

/** A complete IAM policy document. */
export interface IAMPolicy {
  Version?: string;
  Statement: IAMStatement[];
}

/** A trust policy (used for sts:AssumeRole). */
export interface TrustPolicy {
  Version?: string;
  Statement: IAMStatement[];
}

// ─────────────────────────────────────────────────────────────
// Evaluation Types
// ─────────────────────────────────────────────────────────────

/** The stage of IAM evaluation that produced the result. */
export type EvaluationStage =
  | 'ExplicitDeny'
  | 'SCPDeny'
  | 'PermissionsBoundaryDeny'
  | 'IdentityAllow'
  | 'ImplicitDeny'
  | 'TrustPolicyAllow'
  | 'TrustPolicyDeny';

/** The result of running the IAM evaluation engine. */
export interface EvaluationResult {
  allowed: boolean;
  stage: EvaluationStage;
  message: string;
  details: string;
}

/** Context for the evaluation — what action is being attempted. */
export interface EvaluationContext {
  principal: string;        // e.g., "arn:aws:iam::123456789012:user/dev-intern"
  action: string;           // e.g., "s3:GetObject"
  resource: string;         // e.g., "arn:aws:s3:::mission-data/secret.txt"
  sourceAccount?: string;   // For cross-account scenarios
  targetAccount?: string;
  region?: string;          // e.g., "us-east-1"
  conditions?: Record<string, string>; // Runtime condition values
}

// ─────────────────────────────────────────────────────────────
// Game / Level Types
// ─────────────────────────────────────────────────────────────

/** A group the user belongs to, with its attached policy. */
export interface IAMGroup {
  name: string;
  policies: IAMPolicy[];
  color: string; // For UI display
}

/** The architecture state for a level. */
export interface LevelArchitecture {
  userName: string;
  userArn: string;
  roleName?: string;
  roleArn?: string;
  groups: IAMGroup[];
  userPolicies: IAMPolicy[];         // Inline policies on the user
  permissionsBoundary?: IAMPolicy;   // If set, acts as a ceiling
  scps?: IAMPolicy[];                // If set, acts as org ceiling
  trustPolicy?: TrustPolicy;        // For cross-account levels
  targetAction: string;
  targetResource: string;
  targetResourceName: string;        // Human-readable name, e.g., "S3 Bucket: mission-data"
  targetServiceIcon: string;         // Emoji for the service
  accountId: string;
  region?: string;
}

/** What the player needs to produce for a level. */
export type PolicyTarget =
  | 'identity-policy'
  | 'trust-policy'
  | 'permissions-boundary'
  | 'scp'
  | 'group-action'
  | 'iam-gauntlet'
  | 'rds-explicit-deny'
  | 'lambda-passrole'
  | 'sqs-kms';

/** A game level definition. */
export interface LevelDefinition {
  id: number;
  title: string;
  subtitle: string;
  briefing: string;          // Story/scenario text
  objective: string;         // What the player must do
  hint: string;              // Help text
  example?: string;          // Example code to help user
  difficulty: 'Easy' | 'Moderate' | 'Hard'; // Category for Level Select
  architecture: LevelArchitecture;
  policyTarget: PolicyTarget;
  starterCode: string;       // Pre-populated JSON in the editor
  solutionExplanation: string;
  // For Level 2 — special actions the player can take
  specialActions?: SpecialAction[];
  // For complex levels — custom evaluation logic
  customEvaluator?: (
    playerPolicy: any,
    context: EvaluationContext,
    architecture: LevelArchitecture
  ) => EvaluationResult;
}

/** A special non-JSON action the player can take (e.g., remove from group). */
export interface SpecialAction {
  id: string;
  label: string;
  description: string;
  icon: string;
}

// ─────────────────────────────────────────────────────────────
// Game State Types
// ─────────────────────────────────────────────────────────────

export type GamePhase = 'title' | 'level-select' | 'playing' | 'briefing';

export interface GameState {
  phase: GamePhase;
  currentLevel: number;
  completedLevels: number[];
  currentCode: string;
  evaluationResult: EvaluationResult | null;
  isEvaluating: boolean;
  showBriefing: boolean;
  // Level 2 special state
  removedFromGroup?: string;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SELECT_LEVEL'; level: number }
  | { type: 'SET_CODE'; code: string }
  | { type: 'START_EVALUATION' }
  | { type: 'SET_RESULT'; result: EvaluationResult }
  | { type: 'CLEAR_RESULT' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'RESET_LEVEL' }
  | { type: 'SHOW_BRIEFING' }
  | { type: 'DISMISS_BRIEFING' }
  | { type: 'CANCEL_LEVEL_SELECT' }
  | { type: 'REMOVE_FROM_GROUP'; groupName: string }
  | { type: 'GO_TO_TITLE' };
