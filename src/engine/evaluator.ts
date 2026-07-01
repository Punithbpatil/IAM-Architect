// ─────────────────────────────────────────────────────────────
// IAM Architect: Escape the Cloud — Evaluation Engine
// Implements AWS IAM policy evaluation logic:
//   1. Explicit Deny overrides everything
//   2. SCPs act as organizational ceiling
//   3. Permissions Boundaries act as a ceiling
//   4. Explicit Allow from identity policies grants access
//   5. Default: Implicit Deny
// ─────────────────────────────────────────────────────────────

import type {
  IAMPolicy,
  IAMStatement,
  TrustPolicy,
  ConditionBlock,
  EvaluationContext,
  EvaluationResult,
  LevelArchitecture,
} from './types';

// ─────────────────────────────────────────────────────────────
// Helper: Match an action pattern against a concrete action
// Supports wildcards: "s3:*", "ec2:*", "*", "s3:Get*"
// ─────────────────────────────────────────────────────────────
function matchAction(pattern: string, action: string): boolean {
  const p = pattern.toLowerCase();
  const a = action.toLowerCase();

  // Universal wildcard
  if (p === '*') return true;

  // Convert the pattern to a regex: escape dots, replace * with .*
  const regexStr = '^' + p.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
  const regex = new RegExp(regexStr);
  return regex.test(a);
}

// ─────────────────────────────────────────────────────────────
// Helper: Match a resource pattern against a concrete resource ARN
// Supports wildcards in ARN patterns: "arn:aws:s3:::mission-data/*", "*"
// ─────────────────────────────────────────────────────────────
function matchResource(pattern: string, resource: string): boolean {
  // Universal wildcard
  if (pattern === '*') return true;

  // Convert the pattern to a regex:
  // Escape special regex chars (except *), then replace * with .*
  const regexStr =
    '^' +
    pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex specials except * and ?
      .replace(/\?/g, '.')                    // ? matches single char
      .replace(/\*/g, '.*') +                // * matches any sequence
    '$';
  const regex = new RegExp(regexStr);
  return regex.test(resource);
}

// ─────────────────────────────────────────────────────────────
// Helper: Evaluate a condition block against the evaluation context
// Supports: StringEquals, StringNotEquals, StringLike, ArnEquals, ArnLike
// ─────────────────────────────────────────────────────────────
function evaluateCondition(
  condition: ConditionBlock | undefined,
  context: EvaluationContext,
): boolean {
  if (!condition) return true; // No condition means always matches

  // Build a map of all available context keys
  const contextValues: Record<string, string> = {
    ...(context.conditions || {}),
  };
  // Inject well-known context keys
  if (context.region) {
    contextValues['aws:RequestedRegion'] = context.region;
  }
  if (context.sourceAccount) {
    contextValues['aws:SourceAccount'] = context.sourceAccount;
  }
  if (context.principal) {
    contextValues['aws:PrincipalArn'] = context.principal;
  }

  // ALL condition operators must pass (AND logic between operators)
  for (const [operator, conditionMap] of Object.entries(condition)) {
    if (!conditionMap) continue;

    // ALL keys within an operator must pass (AND logic between keys)
    for (const [condKey, condValue] of Object.entries(conditionMap)) {
      const actualValue = contextValues[condKey];

      // Normalize expected values to an array
      const expectedValues = Array.isArray(condValue) ? condValue : [condValue];

      switch (operator) {
        case 'StringEquals': {
          // At least one expected value must match (OR logic within values)
          if (actualValue === undefined) return false;
          const match = expectedValues.some((v) => v === actualValue);
          if (!match) return false;
          break;
        }

        case 'StringNotEquals': {
          // The actual value must NOT equal any of the expected values
          // If the context key is missing, the condition is satisfied
          // (StringNotEquals with missing key = vacuously true in some interpretations,
          //  but for game purposes, if the key is present it must not match)
          if (actualValue === undefined) return true;
          const anyMatch = expectedValues.some((v) => v === actualValue);
          if (anyMatch) return false;
          break;
        }

        case 'StringLike': {
          if (actualValue === undefined) return false;
          const likeMatch = expectedValues.some((pattern) => {
            const r = new RegExp(
              '^' +
                pattern
                  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                  .replace(/\?/g, '.')
                  .replace(/\*/g, '.*') +
                '$',
            );
            return r.test(actualValue);
          });
          if (!likeMatch) return false;
          break;
        }

        case 'ArnEquals': {
          if (actualValue === undefined) return false;
          const arnMatch = expectedValues.some((v) => v === actualValue);
          if (!arnMatch) return false;
          break;
        }

        case 'ArnLike': {
          if (actualValue === undefined) return false;
          const arnLikeMatch = expectedValues.some((pattern) =>
            matchResource(pattern, actualValue),
          );
          if (!arnLikeMatch) return false;
          break;
        }

        default:
          // Unknown operator — fail closed
          return false;
      }
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// Helper: Check if a single statement matches the action + resource
// ─────────────────────────────────────────────────────────────
function statementMatchesRequest(
  statement: IAMStatement,
  action: string,
  resource: string,
  context: EvaluationContext,
): boolean {
  // Check Action match
  const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
  const actionMatches = actions.some((a) => matchAction(a, action));
  if (!actionMatches) return false;

  // Check Resource match
  const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
  const resourceMatches = resources.some((r) => matchResource(r, resource));
  if (!resourceMatches) return false;

  // Check Condition match
  if (!evaluateCondition(statement.Condition, context)) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────
// Helper: Collect all applicable policies for evaluation
// Returns { allPolicies, scps, permissionsBoundary }
// ─────────────────────────────────────────────────────────────
function collectPolicies(
  playerPolicy: IAMPolicy,
  architecture: LevelArchitecture,
  removedFromGroup?: string,
): {
  identityPolicies: IAMPolicy[];
  scps: IAMPolicy[] | undefined;
  permissionsBoundary: IAMPolicy | undefined;
} {
  const identityPolicies: IAMPolicy[] = [];

  // 1. The player-submitted policy (identity policy on the user)
  identityPolicies.push(playerPolicy);

  // 2. Existing user policies from the architecture
  for (const policy of architecture.userPolicies) {
    identityPolicies.push(policy);
  }

  // 3. Group policies (skip if user was removed from that group)
  for (const group of architecture.groups) {
    if (removedFromGroup && group.name === removedFromGroup) {
      continue; // User was removed from this group
    }
    for (const policy of group.policies) {
      identityPolicies.push(policy);
    }
  }

  return {
    identityPolicies,
    scps: architecture.scps,
    permissionsBoundary: architecture.permissionsBoundary,
  };
}

// ─────────────────────────────────────────────────────────────
// Main Evaluation Function
// Implements the full IAM evaluation order:
//   1. Explicit Deny across all policies → ExplicitDeny
//   2. SCP check → SCPDeny
//   3. Permissions Boundary check → PermissionsBoundaryDeny
//   4. Identity policy Allow → IdentityAllow
//   5. Default → ImplicitDeny
// ─────────────────────────────────────────────────────────────
export function evaluatePolicy(
  policy: IAMPolicy,
  context: EvaluationContext,
  architecture: LevelArchitecture,
  removedFromGroup?: string,
): EvaluationResult {
  const { identityPolicies, scps, permissionsBoundary } = collectPolicies(
    policy,
    architecture,
    removedFromGroup,
  );

  const action = context.action;
  const resource = context.resource;

  // ───── Step 1: Check for Explicit Deny across ALL policies ─────
  for (const pol of identityPolicies) {
    for (const stmt of pol.Statement) {
      if (
        stmt.Effect === 'Deny' &&
        statementMatchesRequest(stmt, action, resource, context)
      ) {
        return {
          allowed: false,
          stage: 'ExplicitDeny',
          message: '🚫 ACCESS DENIED — Explicit Deny',
          details:
            `An explicit Deny statement was found that matches the action "${action}" ` +
            `on resource "${resource}". In AWS IAM, an explicit Deny ALWAYS overrides ` +
            `any Allow — no matter where the Allow comes from. ` +
            `${stmt.Sid ? `(Statement: ${stmt.Sid})` : ''}`,
        };
      }
    }
  }

  // Also check if the permissions boundary has an explicit Deny
  if (permissionsBoundary) {
    for (const stmt of permissionsBoundary.Statement) {
      if (
        stmt.Effect === 'Deny' &&
        statementMatchesRequest(stmt, action, resource, context)
      ) {
        return {
          allowed: false,
          stage: 'ExplicitDeny',
          message: '🚫 ACCESS DENIED — Explicit Deny in Permissions Boundary',
          details:
            `The permissions boundary contains an explicit Deny for "${action}" ` +
            `on "${resource}". Explicit Deny always wins.`,
        };
      }
    }
  }

  // Also check SCPs for explicit Deny
  if (scps) {
    for (const scp of scps) {
      for (const stmt of scp.Statement) {
        if (
          stmt.Effect === 'Deny' &&
          statementMatchesRequest(stmt, action, resource, context)
        ) {
          return {
            allowed: false,
            stage: 'SCPDeny',
            message: '🚫 ACCESS DENIED — SCP Explicit Deny',
            details:
              `A Service Control Policy contains an explicit Deny for "${action}" ` +
              `on "${resource}". SCPs are the ultimate organizational guardrail — ` +
              `even account root users cannot override them.`,
          };
        }
      }
    }
  }

  // ───── Step 2: Check SCPs (if present) — action must be Allowed ─────
  if (scps && scps.length > 0) {
    let allowedByScp = false;

    for (const scp of scps) {
      for (const stmt of scp.Statement) {
        if (
          stmt.Effect === 'Allow' &&
          statementMatchesRequest(stmt, action, resource, context)
        ) {
          allowedByScp = true;
          break;
        }
      }
      if (allowedByScp) break;
    }

    if (!allowedByScp) {
      return {
        allowed: false,
        stage: 'SCPDeny',
        message: '🏛️ ACCESS DENIED — Blocked by SCP',
        details:
          `No Service Control Policy allows the action "${action}" on "${resource}". ` +
          `SCPs act as a ceiling — even if the identity policy allows the action, ` +
          `the SCP must ALSO allow it. Think of SCPs as the maximum permissions ` +
          `an account can use.`,
      };
    }
  }

  // ───── Step 3: Check Permissions Boundary (if present) ─────
  if (permissionsBoundary) {
    let allowedByBoundary = false;

    for (const stmt of permissionsBoundary.Statement) {
      if (
        stmt.Effect === 'Allow' &&
        statementMatchesRequest(stmt, action, resource, context)
      ) {
        allowedByBoundary = true;
        break;
      }
    }

    if (!allowedByBoundary) {
      return {
        allowed: false,
        stage: 'PermissionsBoundaryDeny',
        message: '🔒 ACCESS DENIED — Outside Permissions Boundary',
        details:
          `The permissions boundary does not allow "${action}" on "${resource}". ` +
          `A permissions boundary acts as a ceiling — it limits the MAXIMUM ` +
          `permissions the user can have. The action must be allowed in BOTH ` +
          `the identity policy AND the permissions boundary.`,
      };
    }
  }

  // ───── Step 4: Check identity policies for an Allow ─────
  for (const pol of identityPolicies) {
    for (const stmt of pol.Statement) {
      if (
        stmt.Effect === 'Allow' &&
        statementMatchesRequest(stmt, action, resource, context)
      ) {
        return {
          allowed: true,
          stage: 'IdentityAllow',
          message: '✅ ACCESS GRANTED — Policy allows action',
          details:
            `An identity policy explicitly allows "${action}" on "${resource}". ` +
            `No Deny statements, SCPs, or permissions boundaries blocked this action. ` +
            `${stmt.Sid ? `(Statement: ${stmt.Sid})` : ''}`,
        };
      }
    }
  }

  // ───── Step 5: Default — Implicit Deny ─────
  return {
    allowed: false,
    stage: 'ImplicitDeny',
    message: '⛔ ACCESS DENIED — Implicit Deny (no matching Allow)',
    details:
      `No policy statement explicitly allows "${action}" on "${resource}". ` +
      `In AWS IAM, the default is DENY. You must add an explicit Allow ` +
      `statement that matches both the action and resource.`,
  };
}

// ─────────────────────────────────────────────────────────────
// Trust Policy Evaluator (for cross-account AssumeRole — Level 4)
//
// For sts:AssumeRole, the TRUST POLICY on the target role must
// explicitly allow the source principal to assume the role.
// The player writes the trust policy; we check that it contains
// an Allow for sts:AssumeRole with the correct Principal.
// ─────────────────────────────────────────────────────────────
export function evaluateTrustPolicy(
  trustPolicy: TrustPolicy,
  context: EvaluationContext,
): EvaluationResult {
  // Step 1: Check for explicit Deny in the trust policy
  for (const stmt of trustPolicy.Statement) {
    if (stmt.Effect === 'Deny') {
      const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      const actionMatch = actions.some((a) => matchAction(a, context.action));

      if (actionMatch && isPrincipalMatch(stmt, context)) {
        return {
          allowed: false,
          stage: 'TrustPolicyDeny',
          message: '🚫 ACCESS DENIED — Trust Policy Deny',
          details:
            `The trust policy explicitly denies "${context.action}" for the ` +
            `source principal. Cross-account access requires the trust policy ` +
            `to Allow the assuming principal.`,
        };
      }
    }
  }

  // Step 2: Check for Allow in the trust policy
  for (const stmt of trustPolicy.Statement) {
    if (stmt.Effect === 'Allow') {
      const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      const actionMatch = actions.some((a) => matchAction(a, context.action));

      if (actionMatch && isPrincipalMatch(stmt, context)) {
        // Trust policy allows — now check conditions
        if (!evaluateCondition(stmt.Condition, context)) {
          return {
            allowed: false,
            stage: 'TrustPolicyDeny',
            message: '🚫 ACCESS DENIED — Trust Policy condition not met',
            details:
              `The trust policy has an Allow for "${context.action}" but ` +
              `the condition block did not match the request context.`,
          };
        }

        return {
          allowed: true,
          stage: 'TrustPolicyAllow',
          message: '✅ ACCESS GRANTED — Trust Policy allows cross-account assume',
          details:
            `The trust policy on the target role allows the source account ` +
            `(${context.sourceAccount}) to assume the role via "${context.action}". ` +
            `Cross-account access is established! The production account can now ` +
            `deploy to the deployment account.`,
        };
      }
    }
  }

  // Default: no matching Allow in trust policy
  return {
    allowed: false,
    stage: 'TrustPolicyDeny',
    message: '⛔ ACCESS DENIED — Trust Policy does not allow this principal',
    details:
      `The trust policy does not contain an Allow statement for "${context.action}" ` +
      `from the source account (${context.sourceAccount || 'unknown'}). ` +
      `For cross-account role assumption, the trust policy must include an Allow ` +
      `with the correct Principal (the ARN or account root of the calling account) ` +
      `and Action "sts:AssumeRole".`,
  };
}

// ─────────────────────────────────────────────────────────────
// Helper: Check if a statement's Principal matches the context
// ─────────────────────────────────────────────────────────────
function isPrincipalMatch(
  stmt: IAMStatement,
  context: EvaluationContext,
): boolean {
  if (!stmt.Principal) return false;

  // Principal: "*" — matches everything
  if (stmt.Principal === '*') return true;

  // Principal: { AWS: "arn:..." } or { AWS: ["arn:...", ...] }
  if (typeof stmt.Principal === 'object' && 'AWS' in stmt.Principal) {
    const awsPrincipals = Array.isArray(stmt.Principal.AWS)
      ? stmt.Principal.AWS
      : [stmt.Principal.AWS];

    for (const principal of awsPrincipals) {
      // Match against exact principal ARN
      if (principal === context.principal) return true;

      // Match against account root: "arn:aws:iam::111111111111:root"
      if (context.sourceAccount) {
        const accountRootArn = `arn:aws:iam::${context.sourceAccount}:root`;
        if (principal === accountRootArn) return true;
      }

      // Wildcard match
      if (principal === '*') return true;
    }
  }

  // Principal: { Service: "..." } — service principal (not used in game yet)
  if (typeof stmt.Principal === 'object' && 'Service' in stmt.Principal) {
    return false; // Service principals don't match IAM user contexts
  }

  return false;
}
