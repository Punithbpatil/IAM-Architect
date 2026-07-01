import type { LevelDefinition } from '../types';
import { evaluatePolicy } from '../evaluator';

export const HARD_LEVELS: LevelDefinition[] = [
  {
    id: 7,
    title: 'The Malicious Insider',
    subtitle: 'Even admins can be leashed',
    difficulty: 'Hard',
    briefing: `## 📋 MISSION BRIEFING — Level 7\n\n**Agent**, we have a security crisis.\n\nA developer named **rogue-dev** has been granted **AdministratorAccess** — full \`*\` permissions on all resources. Intelligence suggests they may be exfiltrating data from services they shouldn't access.\n\nWe can't revoke their admin policy right now, but we CAN attach a **Permissions Boundary** to restrict what they can actually do.\n\n### 🔍 The Situation\n\nA **Permissions Boundary** acts as a ceiling on permissions. Even if a user's identity policy says "Allow everything", the boundary limits what they can *actually* use.\n\nYour mission: Write a permissions boundary that restricts rogue-dev to **only DynamoDB actions**.\n\n### 🎯 Target (should be ALLOWED)\n- **Action:** \`dynamodb:PutItem\`\n- **Resource:** \`arn:aws:dynamodb:us-east-1:123456789012:table/ProjectData\`\n\nAll other services should be blocked by the boundary.\n\n> *"The cage isn't about removing power — it's about defining its edges."*`,
    objective: 'Write a Permissions Boundary that restricts the user to only DynamoDB actions, blocking all other services.',
    hint: `💡 **Permissions Boundaries**\n\nWrite a policy that allows \`dynamodb:*\` on \`*\` (or the specific table ARN). This boundary will intersect with the admin policy, effectively limiting rogue-dev to only DynamoDB.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Sid": "PermissionsBoundary",\n      "Effect": "Allow",\n      "Action": "dynamodb:*",\n      "Resource": "*"\n    }\n  ]\n}`,
    architecture: {
      userName: 'rogue-dev',
      userArn: 'arn:aws:iam::123456789012:user/rogue-dev',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Sid: 'AdministratorAccess', Effect: 'Allow', Action: '*', Resource: '*' }] }],
      targetAction: 'dynamodb:PutItem',
      targetResource: 'arn:aws:dynamodb:us-east-1:123456789012:table/ProjectData',
      targetResourceName: 'DynamoDB Table: ProjectData',
      targetServiceIcon: '📊',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'permissions-boundary',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Sid: 'PermissionsBoundary', Effect: 'Allow', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: DynamoDB-Only Boundary**\n\nThe correct permissions boundary allows only DynamoDB actions, restricting the Admin.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const modifiedArch = {
        ...architecture,
        permissionsBoundary: playerPolicy,
      };
      return evaluatePolicy(
        { Version: '2012-10-17', Statement: [] },
        context,
        modifiedArch,
        undefined
      );
    }
  },
  {
    id: 8,
    title: 'The Ultimate SCP',
    subtitle: 'Organizational guardrails that even admins obey',
    difficulty: 'Hard',
    briefing: `## 📋 MISSION BRIEFING — Level 8\n\n**Agent**, this is a Code Red.\n\nOur threat intelligence team has detected an attacker launching **EC2 instances in ap-southeast-1** (Singapore) for cryptocurrency mining. They've compromised an admin account and are racking up massive charges.\n\nWe need an **organizational-level defense** — a **Service Control Policy (SCP)** that prevents EC2 instance launches in any region outside **us-east-1**.\n\n### 🔍 The Situation\n\nSCPs apply to **every single IAM entity** in the account — including the root user.\n\nYour mission: Write an SCP that **denies ec2:RunInstances** in any region that is NOT us-east-1.\n\n### 🎯 Target (should be DENIED by your SCP)\n- **Action:** \`ec2:RunInstances\`\n- **Region:** \`ap-southeast-1\` (the attacker's region)\n- **Resource:** \`arn:aws:ec2:ap-southeast-1:999888777666:instance/*\`\n\n### 🔧 Required Condition\nUse \`StringNotEquals\` on \`aws:RequestedRegion\` to target non-us-east-1 regions.\n\n> *"An SCP is the constitution of your cloud. Even the president must obey it."*`,
    objective: 'Write an SCP that denies ec2:RunInstances outside us-east-1 using a StringNotEquals condition on aws:RequestedRegion.',
    hint: `💡 **Service Control Policies (SCPs)**\n\nFor this level, you need a Deny statement with a condition on aws:RequestedRegion.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": "ec2:RunInstances",\n      "Resource": "*",\n      "Condition": {\n        "StringNotEquals": {\n          "aws:RequestedRegion": "us-east-1"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'compromised-admin',
      userArn: 'arn:aws:iam::999888777666:user/compromised-admin',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Sid: 'AdministratorAccess', Effect: 'Allow', Action: '*', Resource: '*' }] }],
      targetAction: 'ec2:RunInstances',
      targetResource: 'arn:aws:ec2:ap-southeast-1:999888777666:instance/*',
      targetResourceName: 'EC2 Instance (ap-southeast-1)',
      targetServiceIcon: '⛏️',
      accountId: '999888777666',
      region: 'ap-southeast-1',
    },
    policyTarget: 'scp',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Sid: 'DenyNonApprovedRegions', Effect: '', Action: '', Resource: '*', Condition: { StringNotEquals: { 'aws:RequestedRegion': '' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: Region-Locked SCP**\n\nThe correct SCP denies EC2 launches outside the approved region.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const modifiedArch = {
        ...architecture,
        scps: [playerPolicy],
      };
      
      const attackerContext = {
        ...context,
        region: 'ap-southeast-1',
        conditions: { 'aws:RequestedRegion': 'ap-southeast-1' },
      };
      const attackResult = evaluatePolicy(
        { Version: '2012-10-17', Statement: [] },
        attackerContext,
        modifiedArch,
        undefined
      );

      const legitimateContext = {
        ...context,
        region: 'us-east-1',
        conditions: { 'aws:RequestedRegion': 'us-east-1' },
      };
      const legitResult = evaluatePolicy(
        { Version: '2012-10-17', Statement: [] },
        legitimateContext,
        modifiedArch,
        undefined
      );

      if (!attackResult.allowed && legitResult.allowed) {
        return {
          allowed: true,
          stage: 'IdentityAllow',
          message: 'SCP Successfully Deployed!',
          details: 'Your Service Control Policy correctly blocks EC2 launches outside us-east-1 while allowing legitimate operations in us-east-1. The crypto-mining attempt in ap-southeast-1 has been thwarted!',
        };
      } else if (attackResult.allowed) {
        return {
          allowed: false,
          stage: 'ImplicitDeny',
          message: 'SCP Not Effective',
          details: 'Your SCP did not block the attacker\'s ec2:RunInstances call in ap-southeast-1. Make sure you have a Deny effect with a StringNotEquals condition on aws:RequestedRegion.',
        };
      } else if (!legitResult.allowed) {
        return {
          allowed: false,
          stage: 'SCPDeny',
          message: 'SCP Too Restrictive',
          details: 'Your SCP blocked ALL EC2 operations, including legitimate ones in us-east-1. Use a StringNotEquals condition to only deny launches OUTSIDE of us-east-1.',
        };
      }
      return attackResult;
    }
  },
  {
    id: 9,
    title: 'The Ultimate IAM Gauntlet',
    subtitle: 'Navigate every layer of IAM',
    difficulty: 'Hard',
    briefing: `## 📋 MISSION BRIEFING — Level 9\n\n**Agent**, this is your final exam.\n\nYou must construct a single Identity Policy that grants access while satisfying multiple constraints in a highly restricted environment.\n\n### 🔍 The Situation\nThe environment already has:\n1. An **SCP** that Denies \`s3:GetObject\` if the region is NOT \`us-east-1\`.\n2. A **Permissions Boundary** that allows \`s3:*\` and \`ec2:*\` (acting as a ceiling).\n\nYour objective: Write an Identity Policy that:\n1. **Allows** \`s3:GetObject\` on \`arn:aws:s3:::secure-vault/*\` but ONLY if \`aws:MultiFactorAuthPresent\` is \`"true"\`.\n2. **Explicitly Denies** \`s3:GetObject\` on \`arn:aws:s3:::secure-vault/top-secret/*\` (even with MFA).\n\nOur evaluation engine will test your policy against 4 different scenarios to ensure it handles MFA, regions, and explicit denies correctly.\n\n> *"To master IAM, you must master the intersection of all its layers."*`,
    objective: 'Write an Identity Policy with two statements: one allowing access with an MFA condition, and one explicitly denying the top-secret path.',
    hint: `💡 **The IAM Gauntlet**\n\nYou will need a \`Statement\` array with two objects (Allow with MFA condition, and Explicit Deny).`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::secure-vault/*",\n      "Condition": {\n        "StringEquals": {\n          "aws:MultiFactorAuthPresent": "true"\n        }\n      }\n    },\n    {\n      "Effect": "Deny",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::secure-vault/top-secret/*"\n    }\n  ]\n}`,
    architecture: {
      userName: 'elite-architect',
      userArn: 'arn:aws:iam::123456789012:user/elite-architect',
      groups: [],
      userPolicies: [],
      permissionsBoundary: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:*', 'ec2:*'], Resource: '*' }] },
      scps: [{ Version: '2012-10-17', Statement: [{ Effect: 'Deny', Action: 's3:GetObject', Resource: '*', Condition: { StringNotEquals: { 'aws:RequestedRegion': 'us-east-1' } } }] }],
      targetAction: 's3:GetObject',
      targetResource: 'arn:aws:s3:::secure-vault/*',
      targetResourceName: 'S3 Vault',
      targetServiceIcon: '🔐',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'iam-gauntlet',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Sid: 'AllowWithMFA', Effect: '', Action: 's3:GetObject', Resource: 'arn:aws:s3:::secure-vault/*', Condition: { StringEquals: { 'aws:MultiFactorAuthPresent': '' } } }, { Sid: 'DenyTopSecret', Effect: '', Action: 's3:GetObject', Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: The IAM Gauntlet**\n\nYou successfully navigated all layers of IAM!`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const test1Context = {
        ...context,
        resource: 'arn:aws:s3:::secure-vault/public.txt',
        conditions: { 'aws:RequestedRegion': 'us-east-1', 'aws:MultiFactorAuthPresent': 'true' }
      };
      const test1Result = evaluatePolicy(playerPolicy, test1Context, architecture, undefined);

      const test2Context = {
        ...context,
        resource: 'arn:aws:s3:::secure-vault/public.txt',
        conditions: { 'aws:RequestedRegion': 'us-east-1', 'aws:MultiFactorAuthPresent': 'false' }
      };
      const test2Result = evaluatePolicy(playerPolicy, test2Context, architecture, undefined);

      const test3Context = {
        ...context,
        resource: 'arn:aws:s3:::secure-vault/top-secret/data.txt',
        conditions: { 'aws:RequestedRegion': 'us-east-1', 'aws:MultiFactorAuthPresent': 'true' }
      };
      const test3Result = evaluatePolicy(playerPolicy, test3Context, architecture, undefined);

      const test4Context = {
        ...context,
        resource: 'arn:aws:s3:::secure-vault/public.txt',
        region: 'eu-west-1',
        conditions: { 'aws:RequestedRegion': 'eu-west-1', 'aws:MultiFactorAuthPresent': 'true' }
      };
      const test4Result = evaluatePolicy(playerPolicy, test4Context, architecture, undefined);

      if (!test1Result.allowed) {
        return {
          allowed: false,
          stage: test1Result.stage,
          message: 'Failed: Valid Request Denied',
          details: 'Your policy denied a valid request (MFA present, us-east-1, public path). Ensure you have an Allow statement with the correct condition.'
        };
      }
      if (test2Result.allowed) {
        return {
          allowed: false,
          stage: 'IdentityAllow',
          message: 'Failed: MFA Bypass',
          details: 'Your policy allowed access without MFA! Make sure you require aws:MultiFactorAuthPresent to be "true".'
        };
      }
      if (test3Result.allowed) {
        return {
          allowed: false,
          stage: 'IdentityAllow',
          message: 'Failed: Top Secret Data Exposed',
          details: 'Your policy allowed access to the top-secret path. You need an explicit Deny for arn:aws:s3:::secure-vault/top-secret/*.'
        };
      }
      if (test4Result.allowed) {
        return {
          allowed: false,
          stage: 'IdentityAllow',
          message: 'Failed: Region Restriction',
          details: 'Your policy allowed access outside us-east-1, but the SCP should have blocked this. Evaluation engine error.'
        };
      }
      
      return {
        allowed: true,
        stage: 'IdentityAllow',
        message: 'Gauntlet Passed!',
        details: 'Your policy flawlessly handled MFA enforcement, explicit denies on restricted paths, while respecting the organization SCP and permissions boundary.'
      };
    }
  },
  {
    id: 20,
    title: 'The Confused Deputy',
    subtitle: 'Protecting cross-account roles',
    difficulty: 'Hard',
    briefing: `## 📋 MISSION BRIEFING — Level 4\n\n**Agent**, we have a third-party SaaS tool that monitors our AWS environment.\n\nThey need to assume the \`AuditRole\` in our account. However, we must prevent the **Confused Deputy Problem**, where a malicious user of the SaaS tool could trick it into accessing our account.\n\nYour job: **Write a Trust Policy** (AssumeRole policy) that allows the third-party account (\`333333333333\`) to assume \`AuditRole\`, but ONLY if they provide the exact \`ExternalId\` of \`CustomerX-999\`.\n\n### 🎯 Target\n- **Action:** \`sts:AssumeRole\`\n- **Principal:** \`arn:aws:iam::333333333333:root\`\n- **Condition:** \`StringEquals\` on \`sts:ExternalId\` to \`CustomerX-999\`\n\n> *"Trust is good, but verifiable trust is better."*`,
    objective: 'Write a Trust Policy that requires a specific ExternalId to prevent the Confused Deputy problem.',
    hint: `💡 **sts:ExternalId**\n\nThe \`sts:ExternalId\` condition key is designed specifically for third-party cross-account access.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": {\n        "AWS": "arn:aws:iam::333333333333:root"\n      },\n      "Action": "sts:AssumeRole",\n      "Condition": {\n        "StringEquals": {\n          "sts:ExternalId": "CustomerX-999"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'saas-auditor',
      userArn: 'arn:aws:iam::333333333333:user/saas-auditor',
      roleName: 'AuditRole',
      roleArn: 'arn:aws:iam::123456789012:role/AuditRole',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Sid: 'AllowAssumeAuditRole', Effect: 'Allow', Action: 'sts:AssumeRole', Resource: 'arn:aws:iam::123456789012:role/AuditRole' }] }],
      targetAction: 'sts:AssumeRole',
      targetResource: 'arn:aws:iam::123456789012:role/AuditRole',
      targetResourceName: 'IAM Role: AuditRole',
      targetServiceIcon: '🕵️',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'trust-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { AWS: 'arn:aws:iam::333333333333:root' }, Action: 'sts:AssumeRole', Condition: { StringEquals: { 'sts:ExternalId': '' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: ExternalId Enforced**\n\nThe role is now protected from the Confused Deputy vulnerability.`,
    customEvaluator: (playerPolicy, _context, _architecture) => {
      try {
        const policyObj = typeof playerPolicy === 'string' ? JSON.parse(playerPolicy) : playerPolicy;
        const stmt = policyObj.Statement && policyObj.Statement[0];
        if (!stmt) return { allowed: false, stage: 'IdentityAllow', message: 'Invalid Policy', details: 'No valid statement found.' };
        
        const hasPrincipal = stmt.Principal && stmt.Principal.AWS && stmt.Principal.AWS.includes('333333333333');
        const hasExternalId = stmt.Condition && stmt.Condition.StringEquals && stmt.Condition.StringEquals['sts:ExternalId'] === 'CustomerX-999';
        
        if (!hasPrincipal) return { allowed: false, stage: 'IdentityAllow', message: 'Wrong Principal', details: 'The Principal must be arn:aws:iam::333333333333:root' };
        if (!hasExternalId) return { allowed: false, stage: 'IdentityAllow', message: 'Missing ExternalId', details: 'You must require sts:ExternalId to equal CustomerX-999.' };
        
        return { allowed: true, stage: 'IdentityAllow', message: 'Deputy Secured!', details: 'You successfully prevented the Confused Deputy problem.' };
      } catch (e) {
        return { allowed: false, stage: 'IdentityAllow', message: 'JSON Error', details: 'Your policy is not valid JSON.' };
      }
    }
  },
  {
    id: 21,
    title: 'The VPC Fortress',
    subtitle: 'Securing the perimeter',
    difficulty: 'Hard',
    briefing: `## 📋 MISSION BRIEFING — Level 5\n\n**Agent**, our highly confidential "project-x-data" bucket is accessible over the public internet if someone has valid credentials.\n\nWe need to lock it down so it can **only** be accessed from our internal VPC Endpoint (\`vpce-1a2b3c4d\`).\n\nYour job: **Write a Resource Policy (Bucket Policy)** that explicitly Denies \`s3:*\` to everyone (\`"*"\`) IF the \`aws:SourceVpce\` is NOT \`vpce-1a2b3c4d\`.\n\n### 🎯 Target (must be DENIED if outside VPC)\n- **Effect:** \`Deny\`\n- **Principal:** \`"*"\`\n- **Action:** \`s3:*\`\n- **Resource:** \`arn:aws:s3:::project-x-data/*\` and \`arn:aws:s3:::project-x-data\`\n- **Condition:** \`StringNotEquals\` on \`aws:SourceVpce\`\n\n> *"Data should not just be encrypted, it should be isolated."*`,
    objective: 'Write a Bucket Policy that denies access unless the request comes from a specific VPC Endpoint.',
    hint: `💡 **VPC Endpoints**\n\nUse \`aws:SourceVpce\` in a \`StringNotEquals\` condition attached to an Explicit Deny statement.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Principal": "*",\n      "Action": "s3:*",\n      "Resource": [\n        "arn:aws:s3:::project-x-data",\n        "arn:aws:s3:::project-x-data/*"\n      ],\n      "Condition": {\n        "StringNotEquals": {\n          "aws:SourceVpce": "vpce-1a2b3c4d"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'data-scientist',
      userArn: 'arn:aws:iam::123456789012:user/data-scientist',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: '*' }] }],
      targetAction: 's3:GetObject',
      targetResource: 'arn:aws:s3:::project-x-data/results.csv',
      targetResourceName: 'S3 Bucket: project-x-data',
      targetServiceIcon: '🏰',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'resource-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Deny', Principal: '*', Action: 's3:*', Resource: ['arn:aws:s3:::project-x-data', 'arn:aws:s3:::project-x-data/*'], Condition: { StringNotEquals: { 'aws:SourceVpce': '' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: VPC Locked**\n\nThe bucket can no longer be accessed from the public internet.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const publicContext = { ...context, conditions: { 'aws:SourceVpce': 'vpce-wrong123' } };
      const publicResult = evaluatePolicy(
        { Version: '2012-10-17', Statement: [] },
        publicContext,
        { ...architecture, resourcePolicy: playerPolicy },
        undefined
      );
      
      const vpcContext = { ...context, conditions: { 'aws:SourceVpce': 'vpce-1a2b3c4d' } };
      const vpcResult = evaluatePolicy(
        { Version: '2012-10-17', Statement: [] },
        vpcContext,
        { ...architecture, resourcePolicy: playerPolicy },
        undefined
      );
      
      if (publicResult.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'Data Leak!', details: 'Your policy failed to Deny the request when it came from outside the VPC.' };
      if (!vpcResult.allowed) return { allowed: false, stage: 'ResourceDeny', message: 'Legitimate Access Blocked!', details: 'Your policy accidentally blocked access from the correct VPC Endpoint.' };
      
      return { allowed: true, stage: 'ResourceDeny', message: 'VPC Fortress Secured!', details: 'You successfully locked the bucket to the internal network.' };
    }
  },
  {
    id: 22,
    title: 'The Principle of Least Privilege',
    subtitle: 'Allowing everything EXCEPT...',
    difficulty: 'Hard',
    briefing: `## 📋 MISSION BRIEFING — Level 6\n\n**Agent**, a new "PowerUser" role needs access to almost all AWS services for development.\n\nHowever, they absolutely MUST NOT be able to modify IAM users or Organizations settings.\n\nYour job: **Write an IAM policy** that uses \`NotAction\` to Allow everything EXCEPT \`iam:*\` and \`organizations:*\`.\n\n### 🎯 Target\n- **Effect:** \`Allow\`\n- **NotAction:** \`["iam:*", "organizations:*"]\`\n- **Resource:** \`*\`\n\n> *"Sometimes it is easier to define what a person cannot do, than what they can."*`,
    objective: 'Write a policy using NotAction to allow all services except IAM and Organizations.',
    hint: `💡 **NotAction**\n\nInstead of \`Action\`, use \`NotAction\` with an array of services to exclude. This allows everything that is NOT in the list.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "NotAction": [\n        "iam:*",\n        "organizations:*"\n      ],\n      "Resource": "*"\n    }\n  ]\n}`,
    architecture: {
      userName: 'power-user',
      userArn: 'arn:aws:iam::123456789012:user/power-user',
      groups: [],
      userPolicies: [],
      targetAction: 'ec2:RunInstances',
      targetResource: 'arn:aws:ec2:us-east-1:123456789012:instance/*',
      targetResourceName: 'Any AWS Resource',
      targetServiceIcon: '👑',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', NotAction: [], Resource: '*' }] }, null, 2),
    solutionExplanation: `✅ **Solution: Power User Provisioned**\n\nThe user can now manage infrastructure without touching IAM.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const ec2Context = { ...context, action: 'ec2:RunInstances' };
      const ec2Result = evaluatePolicy(playerPolicy, ec2Context, architecture, undefined);
      
      const iamContext = { ...context, action: 'iam:CreateUser' };
      const iamResult = evaluatePolicy(playerPolicy, iamContext, architecture, undefined);
      
      if (!ec2Result.allowed) return { ...ec2Result, message: 'EC2 Access Failed', details: 'Your policy did not allow standard EC2 access.' };
      if (iamResult.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'IAM Access Allowed!', details: 'Your policy incorrectly allowed IAM actions! You must use NotAction to exclude them.' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Privileges Curtailed!', details: 'You successfully implemented a PowerUser policy using NotAction.' };
    }
  },
  {
    id: 23,
    title: 'The Advanced Region Lock',
    subtitle: 'Global services are tricky',
    difficulty: 'Hard',
    briefing: `## 📋 MISSION BRIEFING — Level 7\n\n**Agent**, you successfully implemented a Region Lock SCP previously. But there was a flaw!\n\nAWS has "Global Services" like IAM, Route53, and CloudFront. Because they don't operate in a specific region, your SCP broke them!\n\nYour job: **Write an advanced SCP** that Denies all actions outside \`us-east-1\`, EXCEPT for global services.\n\n### 🎯 Target (must be DENIED)\n- **Effect:** \`Deny\`\n- **NotAction:** \`["iam:*", "cloudfront:*", "route53:*"]\`\n- **Resource:** \`*\`\n- **Condition:** \`StringNotEquals\` on \`aws:RequestedRegion\` to \`us-east-1\`\n\n> *"A guardrail should keep you on the road, not block the engine."*`,
    objective: 'Write an SCP that denies regional actions outside us-east-1, but excludes global services using NotAction.',
    hint: `💡 **Combining NotAction and Conditions**\n\nBy using NotAction, you say: "Deny everything that is NOT IAM/CloudFront/Route53, IF the region is NOT us-east-1."`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "NotAction": [\n        "iam:*",\n        "cloudfront:*",\n        "route53:*"\n      ],\n      "Resource": "*",\n      "Condition": {\n        "StringNotEquals": {\n          "aws:RequestedRegion": "us-east-1"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'sysadmin',
      userArn: 'arn:aws:iam::123456789012:user/sysadmin',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }],
      targetAction: 'ec2:RunInstances',
      targetResource: 'arn:aws:ec2:eu-west-1:123456789012:instance/*',
      targetResourceName: 'Global AWS Account',
      targetServiceIcon: '🌍',
      accountId: '123456789012',
      region: 'eu-west-1',
    },
    policyTarget: 'scp',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Deny', NotAction: [], Resource: '*', Condition: { StringNotEquals: { 'aws:RequestedRegion': 'us-east-1' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: Perfect Region Lock**\n\nThe SCP safely locks regions without breaking global services!`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const modifiedArch = { ...architecture, scps: [playerPolicy] };
      
      const ec2EuContext = { ...context, action: 'ec2:RunInstances', region: 'eu-west-1', conditions: { 'aws:RequestedRegion': 'eu-west-1' } };
      const ec2EuResult = evaluatePolicy({ Version: '2012-10-17', Statement: [] }, ec2EuContext, modifiedArch, undefined);
      
      const iamEuContext = { ...context, action: 'iam:CreateUser', region: 'eu-west-1', conditions: { 'aws:RequestedRegion': 'eu-west-1' } };
      const iamEuResult = evaluatePolicy({ Version: '2012-10-17', Statement: [] }, iamEuContext, modifiedArch, undefined);
      
      if (ec2EuResult.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'Region Lock Failed!', details: 'Your SCP allowed EC2 launches in eu-west-1.' };
      if (!iamEuResult.allowed) return { allowed: false, stage: 'SCPDeny', message: 'Global Services Broken!', details: 'Your SCP accidentally blocked IAM actions! You must exclude them using NotAction.' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Advanced Guardrails Active!', details: 'You successfully secured the regions while preserving global functionality.' };
    }
  },
  {
    id: 24,
    title: 'The Final Boss',
    subtitle: 'The ultimate evaluation engine stress test',
    difficulty: 'Hard',
    briefing: `## 📋 MISSION BRIEFING — Level 8 (FINAL)\n\n**Agent**, an adversary is trying to delete our master backup database.\n\nThey have compromised an Admin account (which has \`AdministratorAccess\` attached). They are operating from IP \`198.51.100.99\` in region \`us-west-2\`.\n\nWe cannot touch their Identity Policy. We cannot touch the Resource Policy.\n\nYou must stop them by deploying an **SCP (Service Control Policy)**.\n\n### 🎯 Target (must be DENIED)\n- **Effect:** \`Deny\`\n- **Action:** \`rds:DeleteDBCluster\`\n- **Resource:** \`arn:aws:rds:us-east-1:123456789012:cluster:master-backup\`\n\n> *"You have reached the peak of the mountain. Show us what you can build."*`,
    objective: 'Write an SCP that explicitly Denies rds:DeleteDBCluster for the master backup database.',
    hint: `💡 **The Final Boss**\n\nAn SCP with an Explicit Deny will override the attacker's AdministratorAccess.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": "rds:DeleteDBCluster",\n      "Resource": "arn:aws:rds:us-east-1:123456789012:cluster:master-backup"\n    }\n  ]\n}`,
    architecture: {
      userName: 'hacked-admin',
      userArn: 'arn:aws:iam::123456789012:user/hacked-admin',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }],
      targetAction: 'rds:DeleteDBCluster',
      targetResource: 'arn:aws:rds:us-east-1:123456789012:cluster:master-backup',
      targetResourceName: 'RDS Cluster: Master Backup',
      targetServiceIcon: '🔥',
      accountId: '123456789012',
      region: 'us-west-2',
    },
    policyTarget: 'scp',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Deny', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: The Cloud is Safe**\n\nCongratulations! You have mastered AWS IAM and stopped the attacker.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const modifiedArch = { ...architecture, scps: [playerPolicy] };
      const result = evaluatePolicy({ Version: '2012-10-17', Statement: [] }, context, modifiedArch, undefined);
      
      if (result.allowed) {
        return { allowed: false, stage: 'IdentityAllow', message: 'Master Backup Deleted!', details: 'Your SCP failed to stop the attacker. You need an Explicit Deny on rds:DeleteDBCluster.' };
      }
      return { allowed: true, stage: 'SCPDeny', message: 'Victory!', details: 'You successfully defended the master backup and completed your training as an IAM Architect.' };
    }
  }
];
