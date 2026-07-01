const fs = require('fs');

const fileContent = `// ─────────────────────────────────────────────────────────────
// IAM Architect: Escape the Cloud — Level Definitions
// 9 levels, expanding across AWS services and difficulty tiers.
// ─────────────────────────────────────────────────────────────

import type { LevelDefinition } from './types';

export const LEVELS: LevelDefinition[] = [
  // ═══════════════════════════════════════════════════════════
  // LEVEL 1: The Basic Allow (Easy)
  // ═══════════════════════════════════════════════════════════
  {
    id: 1,
    title: 'The Basic Allow',
    subtitle: 'Every journey begins with a single policy',
    difficulty: 'Easy',
    briefing: \`## 📋 MISSION BRIEFING — Level 1\n\n**Agent**, welcome to IAM Architect Division.\n\nYour first assignment is simple but critical. A new intern, **dev-intern**, has just joined the cloud operations team. They need to read classified files from the **S3 bucket "mission-data"** — but right now, they have **zero permissions**.\n\n### 🔍 The Situation\n\nIn AWS, **every request is denied by default**. This is called the *Implicit Deny*. Without an explicit Allow policy, dev-intern can't even list a single file.\n\nYour job: **Write an IAM policy** that grants dev-intern read access to the mission-data bucket.\n\n### 🎯 Target\n- **Action:** \\\`s3:GetObject\\\`\n- **Resource:** \\\`arn:aws:s3:::mission-data/*\\\`\n\n> *"In the cloud, silence means no. You must speak permission into existence."*\`,
    objective: 'Write an IAM identity policy that allows s3:GetObject on the mission-data S3 bucket.',
    hint: \`💡 **IAM Basics — The Default Deny**\n\nIn AWS IAM, everything starts with a **default deny**. No user, role, or service can do anything unless a policy explicitly says "Allow".\n\nAn IAM policy has three key parts in each Statement:\n- **Effect**: "Allow" or "Deny"\n- **Action**: The AWS API action (e.g., "s3:GetObject")\n- **Resource**: The ARN of the resource (e.g., "arn:aws:s3:::mission-data/*")\n\nTo grant access, set Effect to "Allow", specify the exact Action, and target the correct Resource ARN.\n\nThe \\\`/*\\\` at the end of the S3 ARN means "all objects in the bucket".\`,
    example: \`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::mission-data/*"\n    }\n  ]\n}\`,
    architecture: {
      userName: 'dev-intern',
      userArn: 'arn:aws:iam::123456789012:user/dev-intern',
      groups: [],
      userPolicies: [],
      targetAction: 's3:GetObject',
      targetResource: 'arn:aws:s3:::mission-data/*',
      targetResourceName: 'S3 Bucket: mission-data',
      targetServiceIcon: '🪣',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: '', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: \`✅ **Solution: The Basic Allow**\n\nThe correct policy grants an explicit Allow for the specific action and resource.\n\n**Key Concept:** AWS IAM uses a default-deny model. Without this explicit Allow, the request would be implicitly denied.\`,
  },

  // ═══════════════════════════════════════════════════════════
  // LEVEL 2: The Explicit Block (Easy)
  // ═══════════════════════════════════════════════════════════
  {
    id: 2,
    title: 'The Explicit Block',
    subtitle: 'Protecting the production database',
    difficulty: 'Easy',
    briefing: \`## 📋 MISSION BRIEFING — Level 2\n\n**Agent**, an urgent ticket just came in.\n\nA junior DBA has been granted full access to RDS (\\\`rds:*\\\`) for testing, but they accidentally almost deleted the production database last night!\n\nWe need to stop this immediately. \n\n### 🔍 The Situation\n\nWhile their current policy allows all RDS actions, you can write an **Explicit Deny** to override it specifically for the deletion action on the production DB.\n\nYour job: **Write an IAM policy** that denies the deletion of the production database.\n\n### 🎯 Target (must be DENIED)\n- **Action:** \\\`rds:DeleteDBInstance\\\`\n- **Resource:** \\\`arn:aws:rds:us-east-1:123456789012:db:prod-database\\\`\n\n> *"Trust is good. Explicit Deny is better."*\`,
    objective: 'Write an Explicit Deny policy to prevent rds:DeleteDBInstance on the prod-database.',
    hint: \`💡 **Explicit Deny overrides Allow**\n\nIf you want to ensure an action is NEVER allowed, regardless of what other policies say, you use an Explicit Deny.\n\nSet "Effect": "Deny" for the specific Action and Resource.\`,
    example: \`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": "rds:DeleteDBInstance",\n      "Resource": "arn:aws:rds:us-east-1:123456789012:db:prod-database"\n    }\n  ]\n}\`,
    architecture: {
      userName: 'junior-dba',
      userArn: 'arn:aws:iam::123456789012:user/junior-dba',
      groups: [],
      userPolicies: [
        {
          Version: '2012-10-17',
          Statement: [{ Effect: 'Allow', Action: 'rds:*', Resource: '*' }]
        }
      ],
      targetAction: 'rds:DeleteDBInstance',
      targetResource: 'arn:aws:rds:us-east-1:123456789012:db:prod-database',
      targetResourceName: 'RDS DB: prod-database',
      targetServiceIcon: '🗄️',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'rds-explicit-deny',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Deny', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: \`✅ **Solution: Explicit Block**\n\nThe Explicit Deny correctly overrides their full RDS access for the specific delete operation.\`,
  },

  // ═══════════════════════════════════════════════════════════
  // LEVEL 3: The Group Conflict (Easy)
  // ═══════════════════════════════════════════════════════════
  {
    id: 3,
    title: 'The Group Conflict',
    subtitle: 'When policies collide, Deny always wins',
    difficulty: 'Easy',
    briefing: \`## 📋 MISSION BRIEFING — Level 3\n\n**Agent**, we have a problem.\n\n**dev-ops** is a DevOps engineer who needs to launch EC2 instances. They're a member of the **"Developers"** group, which grants full EC2 access (\\\`ec2:*\\\`).\n\nBut here's the catch — during a recent security audit, dev-ops was *also* added to the **"TempContractors"** group. That group has an **explicit Deny on all EC2 actions**.\n\n### 🔍 The Situation\n\nEven though the Developers group says "Allow ec2:*", the TempContractors group says "Deny ec2:*". In AWS IAM:\n\n> **An explicit Deny ALWAYS overrides an Allow. Always. No exceptions.**\n\nNo policy you write can override an explicit Deny. The only way forward is to **remove the source of the Deny**.\n\n### 🎯 Target\n- **Action:** \\\`ec2:RunInstances\\\`\n- **Resource:** \\\`arn:aws:ec2:us-east-1:123456789012:instance/*\\\`\n\n### ⚡ Special Action Available\nLook for the 🔓 button — you'll need to take a **non-policy action** to solve this one.\n\n> *"You can't out-allow a Deny. You must remove the wall, not build a taller ladder."*\`,
    objective: 'Remove dev-ops from the TempContractors group to eliminate the explicit Deny on EC2 actions.',
    hint: \`💡 **IAM Conflict Resolution**\n\nClick the 🔓 **"Remove from TempContractors"** button to fix this!\`,
    example: \`// Click the 'Remove from TempContractors' button below the editor to remove the Explicit Deny.\`,
    architecture: {
      userName: 'dev-ops',
      userArn: 'arn:aws:iam::123456789012:user/dev-ops',
      groups: [
        { name: 'Developers', color: '#22c55e', policies: [{ Version: '2012-10-17', Statement: [{ Sid: 'AllowAllEC2', Effect: 'Allow', Action: 'ec2:*', Resource: '*' }] }] },
        { name: 'TempContractors', color: '#ef4444', policies: [{ Version: '2012-10-17', Statement: [{ Sid: 'DenyAllEC2', Effect: 'Deny', Action: 'ec2:*', Resource: '*' }] }] },
      ],
      userPolicies: [],
      targetAction: 'ec2:RunInstances',
      targetResource: 'arn:aws:ec2:us-east-1:123456789012:instance/*',
      targetResourceName: 'EC2 Instance',
      targetServiceIcon: '🖥️',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'group-action',
    specialActions: [{ id: 'remove-temp', label: 'Remove from TempContractors', description: 'Remove the user from the TempContractors group to eliminate the Explicit Deny', icon: '🔓' }],
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ '// HINT': "Look for the special action button!", Effect: 'Allow', Action: 'ec2:RunInstances', Resource: 'arn:aws:ec2:us-east-1:123456789012:instance/*' }] }, null, 2),
    solutionExplanation: \`✅ **Solution: Remove the Deny Source**\n\nYou successfully removed the explicit deny.\`,
  },

  // ═══════════════════════════════════════════════════════════
  // LEVEL 4: The Serverless Pass (Moderate)
  // ═══════════════════════════════════════════════════════════
  {
    id: 4,
    title: 'The Serverless Pass',
    subtitle: 'Passing the baton to Lambda',
    difficulty: 'Moderate',
    briefing: \`## 📋 MISSION BRIEFING — Level 4\n\n**Agent**, a backend developer needs to deploy a new serverless function.\n\nThey have permissions to create the Lambda function (\\\`lambda:CreateFunction\\\`), but AWS keeps throwing an AccessDenied error!\n\n### 🔍 The Situation\n\nWhen you create a Lambda function, you must assign it an IAM Role (an execution role). To do this, the developer themselves must have permission to **pass** that specific role to the Lambda service.\n\nYour job: **Write an IAM policy** that grants the developer permission to pass the \\\`LambdaExecRole\\\` to the lambda service.\n\n### 🎯 Target\n- **Action:** \\\`iam:PassRole\\\`\n- **Resource:** \\\`arn:aws:iam::123456789012:role/LambdaExecRole\\\`\n\n> *"You can't give someone a key you aren't allowed to hold."*\`,
    objective: 'Write an IAM policy that allows iam:PassRole for the specific Lambda execution role.',
    hint: \`💡 **iam:PassRole**\n\nTo assign a role to an AWS service (like EC2 or Lambda), you need the \\\`iam:PassRole\\\` permission on the role you are passing.\n\nSet "Effect": "Allow", "Action": "iam:PassRole", and "Resource" to the ARN of the role.\`,
    example: \`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "iam:PassRole",\n      "Resource": "arn:aws:iam::123456789012:role/LambdaExecRole"\n    }\n  ]\n}\`,
    architecture: {
      userName: 'backend-dev',
      userArn: 'arn:aws:iam::123456789012:user/backend-dev',
      roleName: 'LambdaExecRole',
      roleArn: 'arn:aws:iam::123456789012:role/LambdaExecRole',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'lambda:CreateFunction', Resource: '*' }] }],
      targetAction: 'iam:PassRole',
      targetResource: 'arn:aws:iam::123456789012:role/LambdaExecRole',
      targetResourceName: 'IAM Role: LambdaExecRole',
      targetServiceIcon: '⚡',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'lambda-passrole',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: \`✅ **Solution: PassRole Granted**\n\nThe developer can now successfully assign the execution role to their Lambda function!\`,
  },

  // ═══════════════════════════════════════════════════════════
  // LEVEL 5: Cross-Account Jump (Moderate)
  // ═══════════════════════════════════════════════════════════
  {
    id: 5,
    title: 'Cross-Account Jump',
    subtitle: 'Trust is a two-way handshake',
    difficulty: 'Moderate',
    briefing: \`## 📋 MISSION BRIEFING — Level 5\n\n**Agent**, it's time for cross-account operations.\n\nYour organization has two AWS accounts:\n- **Production** (111111111111) — where your CI/CD pipeline runs\n- **Deployment** (222222222222) — where applications are deployed\n\nThe production account needs to **assume a role** in the deployment account to push updates. The role \\\`DeploymentRole\\\` already exists in account 222222222222, but its **trust policy** is empty.\n\n### 🔍 The Situation\n\nIn AWS, cross-account access requires a **two-way handshake**:\n1. The **source account** must have permission to call \\\`sts:AssumeRole\\\`\n2. The **target role's trust policy** must explicitly allow the source to assume it\n\nYou need to write the **trust policy** on the DeploymentRole that allows account 111111111111 to assume it.\n\n### 🎯 Target\n- **Action:** \\\`sts:AssumeRole\\\`\n- **Source Account:** \\\`111111111111\\\` (Production)\n- **Target Role:** \\\`arn:aws:iam::222222222222:role/DeploymentRole\\\`\n\n> *"Trust is not given — it's configured."*\`,
    objective: 'Write a Trust Policy for the DeploymentRole that allows the Production account (111111111111) to assume it.',
    hint: \`💡 **Trust Policies — The Cross-Account Handshake**\n\nA Trust Policy is attached to the role itself and uses the **Principal** element.\n\nExample structure:\n\\\`\\\`\\\`json\n{\n  "Statement": [{\n    "Effect": "Allow",\n    "Principal": { "AWS": "arn:aws:iam::111111111111:root" },\n    "Action": "sts:AssumeRole"\n  }]\n}\n\\\`\\\`\\\`\`,
    example: \`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": {\n        "AWS": "arn:aws:iam::111111111111:root"\n      },\n      "Action": "sts:AssumeRole"\n    }\n  ]\n}\`,
    architecture: {
      userName: 'ci-pipeline',
      userArn: 'arn:aws:iam::111111111111:user/ci-pipeline',
      roleName: 'DeploymentRole',
      roleArn: 'arn:aws:iam::222222222222:role/DeploymentRole',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Sid: 'AllowAssumeDeployRole', Effect: 'Allow', Action: 'sts:AssumeRole', Resource: 'arn:aws:iam::222222222222:role/DeploymentRole' }] }],
      targetAction: 'sts:AssumeRole',
      targetResource: 'arn:aws:iam::222222222222:role/DeploymentRole',
      targetResourceName: 'IAM Role: DeploymentRole',
      targetServiceIcon: '🔑',
      accountId: '222222222222',
      region: 'us-east-1',
    },
    policyTarget: 'trust-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: '', Principal: { AWS: '' }, Action: '' }] }, null, 2),
    solutionExplanation: \`✅ **Solution: Trust the Production Account**\n\nThe correct trust policy allows the production account to assume the role.\`,
  },

  // ═══════════════════════════════════════════════════════════
  // LEVEL 6: The Encrypted Queue (Moderate)
  // ═══════════════════════════════════════════════════════════
  {
    id: 6,
    title: 'The Encrypted Queue',
    subtitle: 'Passing encrypted messages through SQS',
    difficulty: 'Moderate',
    briefing: \`## 📋 MISSION BRIEFING — Level 6\n\n**Agent**, we need to send sensitive messages through an SQS queue.\n\nThe queue is encrypted with a Customer Managed Key (CMK) in AWS KMS. The microservice needs to send messages to the queue, but it keeps failing.\n\n### 🔍 The Situation\n\nTo send a message to an encrypted queue, you don't just need \\\`sqs:SendMessage\\\`. You ALSO need permission to use the KMS key to generate the data key for encryption (\\\`kms:GenerateDataKey\\\`).\n\nYour job: **Write a single IAM policy** with two statements:\n1. Allow \\\`sqs:SendMessage\\\` to the queue.\n2. Allow \\\`kms:GenerateDataKey\\\` on the KMS key.\n\n### 🎯 Targets\n- **Action 1:** \\\`sqs:SendMessage\\\` on \\\`arn:aws:sqs:us-east-1:123456789012:secure-queue\\\`\n- **Action 2:** \\\`kms:GenerateDataKey\\\` on \\\`arn:aws:kms:us-east-1:123456789012:key/abcd-1234\\\`\n\n> *"A locked door is useless if you don't also grant access to the key."*\`,
    objective: 'Write an IAM policy allowing both sqs:SendMessage and kms:GenerateDataKey on their respective resources.',
    hint: \`💡 **Multiple Statements**\n\nYou will need an array of multiple statement objects, one for SQS and one for KMS.\`,
    example: \`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "sqs:SendMessage",\n      "Resource": "arn:aws:sqs:us-east-1:123456789012:secure-queue"\n    },\n    {\n      "Effect": "Allow",\n      "Action": "kms:GenerateDataKey",\n      "Resource": "arn:aws:kms:us-east-1:123456789012:key/abcd-1234"\n    }\n  ]\n}\`,
    architecture: {
      userName: 'microservice-a',
      userArn: 'arn:aws:iam::123456789012:user/microservice-a',
      groups: [],
      userPolicies: [],
      targetAction: 'sqs:SendMessage',
      targetResource: 'arn:aws:sqs:us-east-1:123456789012:secure-queue',
      targetResourceName: 'Encrypted SQS Queue',
      targetServiceIcon: '📨',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'sqs-kms',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: \`✅ **Solution: SQS + KMS Access**\n\nYou successfully provided permissions for both the SQS message and the underlying KMS encryption.\`,
  },

  // ═══════════════════════════════════════════════════════════
  // LEVEL 7: The Malicious Insider (Hard)
  // ═══════════════════════════════════════════════════════════
  {
    id: 7,
    title: 'The Malicious Insider',
    subtitle: 'Even admins can be leashed',
    difficulty: 'Hard',
    briefing: \`## 📋 MISSION BRIEFING — Level 7\n\n**Agent**, we have a security crisis.\n\nA developer named **rogue-dev** has been granted **AdministratorAccess** — full \\\`*\\\` permissions on all resources. Intelligence suggests they may be exfiltrating data from services they shouldn't access.\n\nWe can't revoke their admin policy right now, but we CAN attach a **Permissions Boundary** to restrict what they can actually do.\n\n### 🔍 The Situation\n\nA **Permissions Boundary** acts as a ceiling on permissions. Even if a user's identity policy says "Allow everything", the boundary limits what they can *actually* use.\n\nYour mission: Write a permissions boundary that restricts rogue-dev to **only DynamoDB actions**.\n\n### 🎯 Target (should be ALLOWED)\n- **Action:** \\\`dynamodb:PutItem\\\`\n- **Resource:** \\\`arn:aws:dynamodb:us-east-1:123456789012:table/ProjectData\\\`\n\nAll other services should be blocked by the boundary.\n\n> *"The cage isn't about removing power — it's about defining its edges."*\`,
    objective: 'Write a Permissions Boundary that restricts the user to only DynamoDB actions, blocking all other services.',
    hint: \`💡 **Permissions Boundaries**\n\nWrite a policy that allows \\\`dynamodb:*\\\` on \\\`*\\\` (or the specific table ARN). This boundary will intersect with the admin policy, effectively limiting rogue-dev to only DynamoDB.\`,
    example: \`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Sid": "PermissionsBoundary",\n      "Effect": "Allow",\n      "Action": "dynamodb:*",\n      "Resource": "*"\n    }\n  ]\n}\`,
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
    solutionExplanation: \`✅ **Solution: DynamoDB-Only Boundary**\n\nThe correct permissions boundary allows only DynamoDB actions, restricting the Admin.\`,
  },

  // ═══════════════════════════════════════════════════════════
  // LEVEL 8: The Ultimate SCP (Hard)
  // ═══════════════════════════════════════════════════════════
  {
    id: 8,
    title: 'The Ultimate SCP',
    subtitle: 'Organizational guardrails that even admins obey',
    difficulty: 'Hard',
    briefing: \`## 📋 MISSION BRIEFING — Level 8\n\n**Agent**, this is a Code Red.\n\nOur threat intelligence team has detected an attacker launching **EC2 instances in ap-southeast-1** (Singapore) for cryptocurrency mining. They've compromised an admin account and are racking up massive charges.\n\nWe need an **organizational-level defense** — a **Service Control Policy (SCP)** that prevents EC2 instance launches in any region outside **us-east-1**.\n\n### 🔍 The Situation\n\nSCPs apply to **every single IAM entity** in the account — including the root user.\n\nYour mission: Write an SCP that **denies ec2:RunInstances** in any region that is NOT us-east-1.\n\n### 🎯 Target (should be DENIED by your SCP)\n- **Action:** \\\`ec2:RunInstances\\\`\n- **Region:** \\\`ap-southeast-1\\\` (the attacker's region)\n- **Resource:** \\\`arn:aws:ec2:ap-southeast-1:999888777666:instance/*\\\`\n\n### 🔧 Required Condition\nUse \\\`StringNotEquals\\\` on \\\`aws:RequestedRegion\\\` to target non-us-east-1 regions.\n\n> *"An SCP is the constitution of your cloud. Even the president must obey it."*\`,
    objective: 'Write an SCP that denies ec2:RunInstances outside us-east-1 using a StringNotEquals condition on aws:RequestedRegion.',
    hint: \`💡 **Service Control Policies (SCPs)**\n\nFor this level, you need a Deny statement with a condition on aws:RequestedRegion.\`,
    example: \`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": "ec2:RunInstances",\n      "Resource": "*",\n      "Condition": {\n        "StringNotEquals": {\n          "aws:RequestedRegion": "us-east-1"\n        }\n      }\n    }\n  ]\n}\`,
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
    solutionExplanation: \`✅ **Solution: Region-Locked SCP**\n\nThe correct SCP denies EC2 launches outside the approved region.\`,
  },

  // ═══════════════════════════════════════════════════════════
  // LEVEL 9: The Ultimate IAM Gauntlet (Hard)
  // ═══════════════════════════════════════════════════════════
  {
    id: 9,
    title: 'The Ultimate IAM Gauntlet',
    subtitle: 'Navigate every layer of IAM',
    difficulty: 'Hard',
    briefing: \`## 📋 MISSION BRIEFING — Level 9\n\n**Agent**, this is your final exam.\n\nYou must construct a single Identity Policy that grants access while satisfying multiple constraints in a highly restricted environment.\n\n### 🔍 The Situation\nThe environment already has:\n1. An **SCP** that Denies \\\`s3:GetObject\\\` if the region is NOT \\\`us-east-1\\\`.\n2. A **Permissions Boundary** that allows \\\`s3:*\\\` and \\\`ec2:*\\\` (acting as a ceiling).\n\nYour objective: Write an Identity Policy that:\n1. **Allows** \\\`s3:GetObject\\\` on \\\`arn:aws:s3:::secure-vault/*\\\` but ONLY if \\\`aws:MultiFactorAuthPresent\\\` is \\\`"true"\\\`.\n2. **Explicitly Denies** \\\`s3:GetObject\\\` on \\\`arn:aws:s3:::secure-vault/top-secret/*\\\` (even with MFA).\n\nOur evaluation engine will test your policy against 4 different scenarios to ensure it handles MFA, regions, and explicit denies correctly.\n\n> *"To master IAM, you must master the intersection of all its layers."*\`,
    objective: 'Write an Identity Policy with two statements: one allowing access with an MFA condition, and one explicitly denying the top-secret path.',
    hint: \`💡 **The IAM Gauntlet**\n\nYou will need a \\\`Statement\\\` array with two objects (Allow with MFA condition, and Explicit Deny).\`,
    example: \`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::secure-vault/*",\n      "Condition": {\n        "StringEquals": {\n          "aws:MultiFactorAuthPresent": "true"\n        }\n      }\n    },\n    {\n      "Effect": "Deny",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::secure-vault/top-secret/*"\n    }\n  ]\n}\`,
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
    solutionExplanation: \`✅ **Solution: The IAM Gauntlet**\n\nYou successfully navigated all layers of IAM!\`,
  },
];
\`;

fs.writeFileSync('src/engine/levels.ts', fileContent);
