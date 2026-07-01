import type { LevelDefinition } from '../types';
import { evaluatePolicy } from '../evaluator';

export const EASY_LEVELS: LevelDefinition[] = [
  {
    id: 1,
    title: 'The Basic Allow',
    subtitle: 'Every journey begins with a single policy',
    difficulty: 'Easy',
    briefing: `## 📋 MISSION BRIEFING — Level 1\n\n**Agent**, welcome to IAM Architect Division.\n\nYour first assignment is simple but critical. A new intern, **dev-intern**, has just joined the cloud operations team. They need to read classified files from the **S3 bucket "mission-data"** — but right now, they have **zero permissions**.\n\n### 🔍 The Situation\n\nIn AWS, **every request is denied by default**. This is called the *Implicit Deny*. Without an explicit Allow policy, dev-intern can't even list a single file.\n\nYour job: **Write an IAM policy** that grants dev-intern read access to the mission-data bucket.\n\n### 🎯 Target\n- **Action:** \`s3:GetObject\`\n- **Resource:** \`arn:aws:s3:::mission-data/*\`\n\n> *"In the cloud, silence means no. You must speak permission into existence."*`,
    objective: 'Write an IAM identity policy that allows s3:GetObject on the mission-data S3 bucket.',
    hint: `💡 **IAM Basics — The Default Deny**\n\nIn AWS IAM, everything starts with a **default deny**. No user, role, or service can do anything unless a policy explicitly says "Allow".\n\nAn IAM policy has three key parts in each Statement:\n- **Effect**: "Allow" or "Deny"\n- **Action**: The AWS API action (e.g., "s3:GetObject")\n- **Resource**: The ARN of the resource (e.g., "arn:aws:s3:::mission-data/*")\n\nTo grant access, set Effect to "Allow", specify the exact Action, and target the correct Resource ARN.\n\nThe \`/*\` at the end of the S3 ARN means "all objects in the bucket".`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::mission-data/*"\n    }\n  ]\n}`,
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
    solutionExplanation: `✅ **Solution: The Basic Allow**\n\nThe correct policy grants an explicit Allow for the specific action and resource.\n\n**Key Concept:** AWS IAM uses a default-deny model. Without this explicit Allow, the request would be implicitly denied.`,
  },
  {
    id: 2,
    title: 'The Explicit Block',
    subtitle: 'Protecting the production database',
    difficulty: 'Easy',
    briefing: `## 📋 MISSION BRIEFING — Level 2\n\n**Agent**, an urgent ticket just came in.\n\nA junior DBA has been granted full access to RDS (\`rds:*\`) for testing, but they accidentally almost deleted the production database last night!\n\nWe need to stop this immediately. \n\n### 🔍 The Situation\n\nWhile their current policy allows all RDS actions, you can write an **Explicit Deny** to override it specifically for the deletion action on the production DB.\n\nYour job: **Write an IAM policy** that denies the deletion of the production database.\n\n### 🎯 Target (must be DENIED)\n- **Action:** \`rds:DeleteDBInstance\`\n- **Resource:** \`arn:aws:rds:us-east-1:123456789012:db:prod-database\`\n\n> *"Trust is good. Explicit Deny is better."*`,
    objective: 'Write an Explicit Deny policy to prevent rds:DeleteDBInstance on the prod-database.',
    hint: `💡 **Explicit Deny overrides Allow**\n\nIf you want to ensure an action is NEVER allowed, regardless of what other policies say, you use an Explicit Deny.\n\nSet "Effect": "Deny" for the specific Action and Resource.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": "rds:DeleteDBInstance",\n      "Resource": "arn:aws:rds:us-east-1:123456789012:db:prod-database"\n    }\n  ]\n}`,
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
    solutionExplanation: `✅ **Solution: Explicit Block**\n\nThe Explicit Deny correctly overrides their full RDS access for the specific delete operation.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const rawResult = evaluatePolicy(playerPolicy, context, architecture, undefined);
      if (!rawResult.allowed && rawResult.stage === 'ExplicitDeny') {
        return {
          allowed: true,
          stage: 'ExplicitDeny',
          message: 'Database Protected!',
          details: 'Your explicit Deny successfully overrode the user\'s full RDS access and blocked the deletion.',
        };
      }
      return {
        allowed: false,
        stage: 'IdentityAllow',
        message: 'Failed: Deletion Not Blocked',
        details: 'The user can still delete the database! You need an Explicit Deny for rds:DeleteDBInstance on the specific ARN.',
      };
    }
  },
  {
    id: 3,
    title: 'The Group Conflict',
    subtitle: 'When policies collide, Deny always wins',
    difficulty: 'Easy',
    briefing: `## 📋 MISSION BRIEFING — Level 3\n\n**Agent**, we have a problem.\n\n**dev-ops** is a DevOps engineer who needs to launch EC2 instances. They're a member of the **"Developers"** group, which grants full EC2 access (\`ec2:*\`).\n\nBut here's the catch — during a recent security audit, dev-ops was *also* added to the **"TempContractors"** group. That group has an **explicit Deny on all EC2 actions**.\n\n### 🔍 The Situation\n\nEven though the Developers group says "Allow ec2:*", the TempContractors group says "Deny ec2:*". In AWS IAM:\n\n> **An explicit Deny ALWAYS overrides an Allow. Always. No exceptions.**\n\nNo policy you write can override an explicit Deny. The only way forward is to **remove the source of the Deny**.\n\n### 🎯 Target\n- **Action:** \`ec2:RunInstances\`\n- **Resource:** \`arn:aws:ec2:us-east-1:123456789012:instance/*\`\n\n### ⚡ Special Action Available\nLook for the 🔓 button — you'll need to take a **non-policy action** to solve this one.\n\n> *"You can't out-allow a Deny. You must remove the wall, not build a taller ladder."*`,
    objective: 'Remove dev-ops from the TempContractors group to eliminate the explicit Deny on EC2 actions.',
    hint: `💡 **IAM Conflict Resolution**\n\nClick the 🔓 **"Remove from TempContractors"** button to fix this!`,
    example: `// Click the 'Remove from TempContractors' button below the editor to remove the Explicit Deny.`,
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
    solutionExplanation: `✅ **Solution: Remove the Deny Source**\n\nYou successfully removed the explicit deny.`,
    // Evaluator for group-action is handled slightly differently in useGameState due to the UI button modifying state directly, but we can leave it as group-action for now.
  },
  {
    id: 4,
    title: 'The Read-Only Analyst',
    subtitle: 'Data access without modification',
    difficulty: 'Easy',
    briefing: `## 📋 MISSION BRIEFING — Level 4\n\n**Agent**, a data analyst needs to generate reports from our employee database.\n\nThey need to be able to read single records and scan the entire table, but they should **never** be able to write or delete data.\n\nYour job: **Write an IAM policy** that allows both \`dynamodb:GetItem\` and \`dynamodb:Scan\` on the Employees table.\n\n### 🎯 Targets\n- **Actions:** \`dynamodb:GetItem\`, \`dynamodb:Scan\`\n- **Resource:** \`arn:aws:dynamodb:us-east-1:123456789012:table/Employees\`\n\n> *"Read-only is the golden rule of analytics."*`,
    objective: 'Write a policy allowing dynamodb:GetItem and dynamodb:Scan on the specified table.',
    hint: `💡 **Multiple Actions**\n\nYou can provide multiple actions in an array: \`"Action": ["dynamodb:GetItem", "dynamodb:Scan"]\``,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": ["dynamodb:GetItem", "dynamodb:Scan"],\n      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/Employees"\n    }\n  ]\n}`,
    architecture: {
      userName: 'data-analyst',
      userArn: 'arn:aws:iam::123456789012:user/data-analyst',
      groups: [],
      userPolicies: [],
      targetAction: 'dynamodb:GetItem', // Ignored by custom evaluator
      targetResource: 'arn:aws:dynamodb:us-east-1:123456789012:table/Employees',
      targetResourceName: 'DynamoDB Table: Employees',
      targetServiceIcon: '📊',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: [], Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: Read-Only Access**\n\nYou successfully provided an array of read-only actions for the DynamoDB table.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const getContext = { ...context, action: 'dynamodb:GetItem' };
      const getResult = evaluatePolicy(playerPolicy, getContext, architecture, undefined);
      
      const scanContext = { ...context, action: 'dynamodb:Scan' };
      const scanResult = evaluatePolicy(playerPolicy, scanContext, architecture, undefined);
      
      if (!getResult.allowed) return { ...getResult, message: 'GetItem Failed' };
      if (!scanResult.allowed) return { ...scanResult, message: 'Scan Failed' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Read-Only Access Granted!', details: 'You successfully granted both read actions.' };
    }
  },
  {
    id: 5,
    title: 'The Publisher',
    subtitle: 'Sending alerts to the world',
    difficulty: 'Easy',
    briefing: `## 📋 MISSION BRIEFING — Level 5\n\n**Agent**, our billing system needs to send push notifications when invoices are due.\n\nIt uses Amazon SNS (Simple Notification Service) to broadcast messages to subscribers. \n\nYour job: **Write an IAM policy** that allows the billing system to publish messages to the alerts topic.\n\n### 🎯 Target\n- **Action:** \`sns:Publish\`\n- **Resource:** \`arn:aws:sns:us-east-1:123456789012:alerts-topic\`\n\n> *"Communication requires permission."*`,
    objective: 'Write a policy allowing sns:Publish on the alerts-topic.',
    hint: `💡 **Basic Identity Policy**\n\nThis is a standard allow policy. Effect: Allow, Action: sns:Publish, Resource: [Topic ARN]`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "sns:Publish",\n      "Resource": "arn:aws:sns:us-east-1:123456789012:alerts-topic"\n    }\n  ]\n}`,
    architecture: {
      userName: 'billing-system',
      userArn: 'arn:aws:iam::123456789012:user/billing-system',
      groups: [],
      userPolicies: [],
      targetAction: 'sns:Publish',
      targetResource: 'arn:aws:sns:us-east-1:123456789012:alerts-topic',
      targetResourceName: 'SNS Topic: Alerts',
      targetServiceIcon: '📢',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: Publisher Granted**\n\nThe billing system can now broadcast alerts successfully.`,
  },
  {
    id: 6,
    title: 'The Log Writer',
    subtitle: 'Leaving a paper trail',
    difficulty: 'Easy',
    briefing: `## 📋 MISSION BRIEFING — Level 6\n\n**Agent**, a Lambda function is executing properly, but its logs are nowhere to be found!\n\nTo write logs to CloudWatch, a function needs two distinct permissions: one to create a stream, and one to put events into it.\n\nYour job: **Write an IAM policy** that allows both \`logs:CreateLogStream\` and \`logs:PutLogEvents\` on the function's log group.\n\n### 🎯 Targets\n- **Actions:** \`logs:CreateLogStream\`, \`logs:PutLogEvents\`\n- **Resource:** \`arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/my-function:*\`\n\n> *"If a tree falls in the cloud and no one logs it, did it really happen?"*`,
    objective: 'Write a policy allowing both CreateLogStream and PutLogEvents for CloudWatch logs.',
    hint: `💡 **Multiple Actions**\n\nUse an array of actions for the "Action" field.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],\n      "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/my-function:*"\n    }\n  ]\n}`,
    architecture: {
      userName: 'my-function-role',
      userArn: 'arn:aws:iam::123456789012:role/my-function-role',
      groups: [],
      userPolicies: [],
      targetAction: 'logs:PutLogEvents',
      targetResource: 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/my-function:*',
      targetResourceName: 'CloudWatch Log Group',
      targetServiceIcon: '📝',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: [], Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: Logging Enabled**\n\nThe function can now create streams and write log events to CloudWatch.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const streamCtx = { ...context, action: 'logs:CreateLogStream' };
      const streamRes = evaluatePolicy(playerPolicy, streamCtx, architecture, undefined);
      
      const eventCtx = { ...context, action: 'logs:PutLogEvents' };
      const eventRes = evaluatePolicy(playerPolicy, eventCtx, architecture, undefined);
      
      if (!streamRes.allowed) return { ...streamRes, message: 'CreateLogStream Failed' };
      if (!eventRes.allowed) return { ...eventRes, message: 'PutLogEvents Failed' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Logging Enabled!', details: 'The function can now successfully log.' };
    }
  },
  {
    id: 7,
    title: 'The Instance Operator',
    subtitle: 'Powering up and shutting down',
    difficulty: 'Easy',
    briefing: `## 📋 MISSION BRIEFING — Level 7\n\n**Agent**, a new shift manager needs to save costs by turning off EC2 development servers at night and turning them back on in the morning.\n\nThey MUST NOT have permission to terminate (delete) the instances.\n\nYour job: **Write an IAM policy** allowing ONLY \`ec2:StartInstances\` and \`ec2:StopInstances\`.\n\n### 🎯 Targets\n- **Actions:** \`ec2:StartInstances\`, \`ec2:StopInstances\`\n- **Resource:** \`arn:aws:ec2:us-east-1:123456789012:instance/*\`\n\n> *"Power is the ability to turn things on and off. Destruction is something else entirely."*`,
    objective: 'Write a policy allowing ec2:StartInstances and ec2:StopInstances, but not ec2:TerminateInstances.',
    hint: `💡 **Principle of Least Privilege**\n\nProvide an array of exactly two actions. Do not use wildcards (\`ec2:*\`).`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": ["ec2:StartInstances", "ec2:StopInstances"],\n      "Resource": "arn:aws:ec2:us-east-1:123456789012:instance/*"\n    }\n  ]\n}`,
    architecture: {
      userName: 'shift-manager',
      userArn: 'arn:aws:iam::123456789012:user/shift-manager',
      groups: [],
      userPolicies: [],
      targetAction: 'ec2:StartInstances',
      targetResource: 'arn:aws:ec2:us-east-1:123456789012:instance/*',
      targetResourceName: 'EC2 Instances',
      targetServiceIcon: '🖥️',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: [], Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: Operator Access**\n\nThe manager can safely toggle instances without risking termination.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const startCtx = { ...context, action: 'ec2:StartInstances' };
      const startRes = evaluatePolicy(playerPolicy, startCtx, architecture, undefined);
      const stopCtx = { ...context, action: 'ec2:StopInstances' };
      const stopRes = evaluatePolicy(playerPolicy, stopCtx, architecture, undefined);
      const termCtx = { ...context, action: 'ec2:TerminateInstances' };
      const termRes = evaluatePolicy(playerPolicy, termCtx, architecture, undefined);
      
      if (!startRes.allowed) return { ...startRes, message: 'StartInstances Failed' };
      if (!stopRes.allowed) return { ...stopRes, message: 'StopInstances Failed' };
      if (termRes.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'Too Permissive!', details: 'Your policy allows ec2:TerminateInstances! You must restrict it to start/stop only.' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Operator Ready!', details: 'You successfully restricted access to power management.' };
    }
  },
  {
    id: 8,
    title: 'The Parameter Reader',
    subtitle: 'Fetching configurations securely',
    difficulty: 'Easy',
    briefing: `## 📋 MISSION BRIEFING — Level 8\n\n**Agent**, our web application needs to read its database connection string on startup.\n\nThe string is stored securely in AWS Systems Manager (SSM) Parameter Store under the path \`/app/config/\`.\n\nYour job: **Write an IAM policy** allowing the app to read parameters under this path.\n\n### 🎯 Target\n- **Action:** \`ssm:GetParameter\`\n- **Resource:** \`arn:aws:ssm:us-east-1:123456789012:parameter/app/config/*\`\n\n> *"The right configuration string is the key to the kingdom."*`,
    objective: 'Write a policy allowing ssm:GetParameter on the specified parameter path.',
    hint: `💡 **Wildcards in Resources**\n\nYou can use wildcards at the end of an ARN to allow access to all resources under a specific path.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "ssm:GetParameter",\n      "Resource": "arn:aws:ssm:us-east-1:123456789012:parameter/app/config/*"\n    }\n  ]\n}`,
    architecture: {
      userName: 'web-app-role',
      userArn: 'arn:aws:iam::123456789012:role/web-app-role',
      groups: [],
      userPolicies: [],
      targetAction: 'ssm:GetParameter',
      targetResource: 'arn:aws:ssm:us-east-1:123456789012:parameter/app/config/db-url',
      targetResourceName: 'SSM Parameter Store',
      targetServiceIcon: '⚙️',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: SSM Access Granted**\n\nThe web app can now fetch its configuration securely on startup.`,
  }
];
