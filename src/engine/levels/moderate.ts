import type { LevelDefinition } from '../types';
import { evaluatePolicy, evaluateTrustPolicy } from '../evaluator';

export const MODERATE_LEVELS: LevelDefinition[] = [
  {
    id: 9,
    title: 'The Serverless Pass',
    subtitle: 'Passing the baton to Lambda',
    difficulty: 'Moderate',
    briefing: `## 📋 MISSION BRIEFING — Level 9\n\n**Agent**, a backend developer needs to deploy a new serverless function.\n\nThey have permissions to create the Lambda function (\`lambda:CreateFunction\`), but AWS keeps throwing an AccessDenied error!\n\n### 🔍 The Situation\n\nWhen you create a Lambda function, you must assign it an IAM Role (an execution role). To do this, the developer themselves must have permission to **pass** that specific role to the Lambda service.\n\nYour job: **Write an IAM policy** that grants the developer permission to pass the \`LambdaExecRole\` to the lambda service.\n\n### 🎯 Target\n- **Action:** \`iam:PassRole\`\n- **Resource:** \`arn:aws:iam::123456789012:role/LambdaExecRole\`\n\n> *"You can't give someone a key you aren't allowed to hold."*`,
    objective: 'Write an IAM policy that allows iam:PassRole for the specific Lambda execution role.',
    hint: `💡 **iam:PassRole**\n\nTo assign a role to an AWS service (like EC2 or Lambda), you need the \`iam:PassRole\` permission on the role you are passing.\n\nSet "Effect": "Allow", "Action": "iam:PassRole", and "Resource" to the ARN of the role.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "iam:PassRole",\n      "Resource": "arn:aws:iam::123456789012:role/LambdaExecRole"\n    }\n  ]\n}`,
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
    solutionExplanation: `✅ **Solution: PassRole Granted**\n\nThe developer can now successfully assign the execution role to their Lambda function!`,
  },
  {
    id: 10,
    title: 'Cross-Account Jump',
    subtitle: 'Trust is a two-way handshake',
    difficulty: 'Moderate',
    briefing: `## 📋 MISSION BRIEFING — Level 10\n\n**Agent**, it's time for cross-account operations.\n\nYour organization has two AWS accounts:\n- **Production** (111111111111) — where your CI/CD pipeline runs\n- **Deployment** (222222222222) — where applications are deployed\n\nThe production account needs to **assume a role** in the deployment account to push updates. The role \`DeploymentRole\` already exists in account 222222222222, but its **trust policy** is empty.\n\n### 🔍 The Situation\n\nIn AWS, cross-account access requires a **two-way handshake**:\n1. The **source account** must have permission to call \`sts:AssumeRole\`\n2. The **target role's trust policy** must explicitly allow the source to assume it\n\nYou need to write the **trust policy** on the DeploymentRole that allows account 111111111111 to assume it.\n\n### 🎯 Target\n- **Action:** \`sts:AssumeRole\`\n- **Source Account:** \`111111111111\` (Production)\n- **Target Role:** \`arn:aws:iam::222222222222:role/DeploymentRole\`\n\n> *"Trust is not given — it's configured."*`,
    objective: 'Write a Trust Policy for the DeploymentRole that allows the Production account (111111111111) to assume it.',
    hint: `💡 **Trust Policies — The Cross-Account Handshake**\n\nA Trust Policy is attached to the role itself and uses the **Principal** element.\n\nExample structure:\n\`\`\`json\n{\n  "Statement": [{\n    "Effect": "Allow",\n    "Principal": { "AWS": "arn:aws:iam::111111111111:root" },\n    "Action": "sts:AssumeRole"\n  }]\n}\n\`\`\``,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": {\n        "AWS": "arn:aws:iam::111111111111:root"\n      },\n      "Action": "sts:AssumeRole"\n    }\n  ]\n}`,
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
    solutionExplanation: `✅ **Solution: Trust the Production Account**\n\nThe correct trust policy allows the production account to assume the role.`,
    customEvaluator: (playerPolicy, context) => {
      return evaluateTrustPolicy(playerPolicy, context);
    }
  },
  {
    id: 11,
    title: 'The Encrypted Queue',
    subtitle: 'Passing encrypted messages through SQS',
    difficulty: 'Moderate',
    briefing: `## 📋 MISSION BRIEFING — Level 11\n\n**Agent**, we need to send sensitive messages through an SQS queue.\n\nThe queue is encrypted with a Customer Managed Key (CMK) in AWS KMS. The microservice needs to send messages to the queue, but it keeps failing.\n\n### 🔍 The Situation\n\nTo send a message to an encrypted queue, you don't just need \`sqs:SendMessage\`. You ALSO need permission to use the KMS key to generate the data key for encryption (\`kms:GenerateDataKey\`).\n\nYour job: **Write a single IAM policy** with two statements:\n1. Allow \`sqs:SendMessage\` to the queue.\n2. Allow \`kms:GenerateDataKey\` on the KMS key.\n\n### 🎯 Targets\n- **Action 1:** \`sqs:SendMessage\` on \`arn:aws:sqs:us-east-1:123456789012:secure-queue\`\n- **Action 2:** \`kms:GenerateDataKey\` on \`arn:aws:kms:us-east-1:123456789012:key/abcd-1234\`\n\n> *"A locked door is useless if you don't also grant access to the key."*`,
    objective: 'Write an IAM policy allowing both sqs:SendMessage and kms:GenerateDataKey on their respective resources.',
    hint: `💡 **Multiple Statements**\n\nYou will need an array of multiple statement objects, one for SQS and one for KMS.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "sqs:SendMessage",\n      "Resource": "arn:aws:sqs:us-east-1:123456789012:secure-queue"\n    },\n    {\n      "Effect": "Allow",\n      "Action": "kms:GenerateDataKey",\n      "Resource": "arn:aws:kms:us-east-1:123456789012:key/abcd-1234"\n    }\n  ]\n}`,
    architecture: {
      userName: 'microservice-a',
      userArn: 'arn:aws:iam::123456789012:user/microservice-a',
      groups: [],
      userPolicies: [],
      targetAction: 'sqs:SendMessage', // Handled by custom evaluator
      targetResource: 'arn:aws:sqs:us-east-1:123456789012:secure-queue',
      targetResourceName: 'Encrypted SQS Queue',
      targetServiceIcon: '📨',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'sqs-kms',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '' }] }, null, 2),
    solutionExplanation: `✅ **Solution: SQS + KMS Access**\n\nYou successfully provided permissions for both the SQS message and the underlying KMS encryption.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const sqsContext = { ...context, action: 'sqs:SendMessage', resource: 'arn:aws:sqs:us-east-1:123456789012:secure-queue' };
      const sqsResult = evaluatePolicy(playerPolicy, sqsContext, architecture, undefined);
      
      const kmsContext = { ...context, action: 'kms:GenerateDataKey', resource: 'arn:aws:kms:us-east-1:123456789012:key/abcd-1234' };
      const kmsResult = evaluatePolicy(playerPolicy, kmsContext, architecture, undefined);
      
      if (!sqsResult.allowed) {
        return { ...sqsResult, message: 'SQS Message Failed' };
      }
      if (!kmsResult.allowed) {
        return { ...kmsResult, message: 'KMS Encryption Failed' };
      }
      return {
        allowed: true,
        stage: 'IdentityAllow',
        message: 'Encrypted Queue Ready!',
        details: 'You successfully granted permission to both send the message and use the KMS key for encryption.',
      };
    }
  },
  {
    id: 12,
    title: 'The Office Network',
    subtitle: 'Location, location, location',
    difficulty: 'Moderate',
    briefing: `## 📋 MISSION BRIEFING — Level 12\n\n**Agent**, we have highly sensitive financial reports in an S3 bucket.\n\nEmployees should be able to read these documents, but ONLY if they are physically inside the corporate office (or on the VPN).\n\nYour job: **Write an IAM policy** that allows \`s3:GetObject\` but uses a **Condition** block to restrict access to the office IP range: \`203.0.113.0/24\`.\n\n### 🎯 Target\n- **Action:** \`s3:GetObject\`\n- **Resource:** \`arn:aws:s3:::finance-reports/*\`\n- **Condition:** \`IpAddress\` matching \`aws:SourceIp\` of \`203.0.113.0/24\`\n\n> *"Trust the person, verify the origin."*`,
    objective: 'Write a policy with an IpAddress condition to restrict access to the office network.',
    hint: `💡 **Condition Blocks**\n\nUse the \`Condition\` block in your statement. The condition operator is \`IpAddress\` and the condition key is \`aws:SourceIp\`.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::finance-reports/*",\n      "Condition": {\n        "IpAddress": {\n          "aws:SourceIp": "203.0.113.0/24"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'finance-user',
      userArn: 'arn:aws:iam::123456789012:user/finance-user',
      groups: [],
      userPolicies: [],
      targetAction: 's3:GetObject',
      targetResource: 'arn:aws:s3:::finance-reports/q3-earnings.pdf',
      targetResourceName: 'S3 Bucket: finance-reports',
      targetServiceIcon: '🏢',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '', Condition: { IpAddress: { 'aws:SourceIp': '' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: IP Restricted**\n\nThe policy ensures that even with valid credentials, data cannot be accessed from a coffee shop.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      // Test 1: From office
      const officeContext = { ...context, conditions: { 'aws:SourceIp': '203.0.113.15' } };
      const officeResult = evaluatePolicy(playerPolicy, officeContext, architecture, undefined);
      
      // Test 2: From outside
      const homeContext = { ...context, conditions: { 'aws:SourceIp': '198.51.100.42' } };
      const homeResult = evaluatePolicy(playerPolicy, homeContext, architecture, undefined);
      
      if (!officeResult.allowed) return { ...officeResult, message: 'Office Access Denied', details: 'A user in the office (203.0.113.15) could not access the files. Check your CIDR block.' };
      if (homeResult.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'Data Leak!', details: 'A user outside the office (198.51.100.42) accessed the files! Make sure you are strictly requiring the correct IP range.' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Network Secured!', details: 'You successfully restricted access to the corporate network.' };
    }
  },
  {
    id: 13,
    title: 'Secure Transport Required',
    subtitle: 'No unencrypted traffic allowed',
    difficulty: 'Moderate',
    briefing: `## 📋 MISSION BRIEFING — Level 13\n\n**Agent**, compliance requires that all data moving in and out of the "medical-records" bucket must travel over HTTPS (TLS).\n\nIf a request is made over plain HTTP, it must be explicitly blocked, regardless of who is making it.\n\nYour job: **Write an Explicit Deny policy** that blocks \`s3:*\` if \`aws:SecureTransport\` is \`false\`.\n\n### 🎯 Target (must be DENIED)\n- **Effect:** \`Deny\`\n- **Action:** \`s3:*\`\n- **Resource:** \`arn:aws:s3:::medical-records/*\` and \`arn:aws:s3:::medical-records\`\n- **Condition:** \`Bool\` matching \`aws:SecureTransport\` to \`"false"\`\n\n> *"Encryption in transit isn't a suggestion, it's a mandate."*`,
    objective: 'Write an Explicit Deny policy that triggers when aws:SecureTransport is false.',
    hint: `💡 **Boolean Conditions**\n\nUse \`"Effect": "Deny"\` with a \`Condition\` block using the \`Bool\` operator against \`aws:SecureTransport\`.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": "s3:*",\n      "Resource": [\n        "arn:aws:s3:::medical-records",\n        "arn:aws:s3:::medical-records/*"\n      ],\n      "Condition": {\n        "Bool": {\n          "aws:SecureTransport": "false"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'health-app',
      userArn: 'arn:aws:iam::123456789012:user/health-app',
      groups: [],
      userPolicies: [{ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: '*' }] }],
      targetAction: 's3:GetObject',
      targetResource: 'arn:aws:s3:::medical-records/patient1.json',
      targetResourceName: 'S3 Bucket: medical-records',
      targetServiceIcon: '⚕️',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Deny', Action: 's3:*', Resource: ['arn:aws:s3:::medical-records', 'arn:aws:s3:::medical-records/*'], Condition: { Bool: { 'aws:SecureTransport': '' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: HTTPS Enforced**\n\nThe bucket is now protected from unencrypted requests.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const httpContext = { ...context, conditions: { 'aws:SecureTransport': 'false' } };
      const httpResult = evaluatePolicy(playerPolicy, httpContext, architecture, undefined);
      
      const httpsContext = { ...context, conditions: { 'aws:SecureTransport': 'true' } };
      const httpsResult = evaluatePolicy(playerPolicy, httpsContext, architecture, undefined);
      
      if (httpResult.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'Insecure Traffic Allowed!', details: 'Your policy failed to Deny the request when aws:SecureTransport was false.' };
      if (!httpsResult.allowed) return { allowed: false, stage: 'ExplicitDeny', message: 'HTTPS Blocked!', details: 'Your policy accidentally blocked secure HTTPS traffic as well! Make sure you only Deny when SecureTransport is false.' };
      
      return { allowed: true, stage: 'ExplicitDeny', message: 'Secure Transport Enforced!', details: 'You successfully blocked HTTP while allowing HTTPS.' };
    }
  },
  {
    id: 14,
    title: 'The Time-Bound Access',
    subtitle: 'Cinderella protocols',
    difficulty: 'Moderate',
    briefing: `## 📋 MISSION BRIEFING — Level 14\n\n**Agent**, a contractor needs access to launch EC2 instances, but their contract ends on December 31st, 2026 at midnight UTC.\n\nWe need to ensure their access automatically revokes exactly at that time, without us having to remember to delete the policy.\n\nYour job: **Write an IAM policy** that allows \`ec2:RunInstances\` but only if the current time is BEFORE \`2027-01-01T00:00:00Z\`.\n\n### 🎯 Target\n- **Action:** \`ec2:RunInstances\`\n- **Resource:** \`arn:aws:ec2:us-east-1:123456789012:instance/*\`\n- **Condition:** \`DateLessThan\` on \`aws:CurrentTime\`\n\n> *"Time is the ultimate access control."*`,
    objective: 'Write a policy using the DateLessThan condition to limit access based on aws:CurrentTime.',
    hint: `💡 **Date Conditions**\n\nUse \`DateLessThan\` with the \`aws:CurrentTime\` key, formatted as an ISO 8601 string (e.g., "2027-01-01T00:00:00Z").`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "ec2:RunInstances",\n      "Resource": "arn:aws:ec2:us-east-1:123456789012:instance/*",\n      "Condition": {\n        "DateLessThan": {\n          "aws:CurrentTime": "2027-01-01T00:00:00Z"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'temp-contractor',
      userArn: 'arn:aws:iam::123456789012:user/temp-contractor',
      groups: [],
      userPolicies: [],
      targetAction: 'ec2:RunInstances',
      targetResource: 'arn:aws:ec2:us-east-1:123456789012:instance/*',
      targetResourceName: 'EC2 Instances',
      targetServiceIcon: '⏳',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '', Condition: { DateLessThan: { 'aws:CurrentTime': '2027-01-01T00:00:00Z' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: Time-Bound Access**\n\nThe contractor's access will automatically expire on schedule.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const validContext = { ...context, conditions: { 'aws:CurrentTime': '2026-06-15T12:00:00Z' } };
      const validResult = evaluatePolicy(playerPolicy, validContext, architecture, undefined);
      
      const expiredContext = { ...context, conditions: { 'aws:CurrentTime': '2027-01-02T12:00:00Z' } };
      const expiredResult = evaluatePolicy(playerPolicy, expiredContext, architecture, undefined);
      
      if (!validResult.allowed) return { ...validResult, message: 'Valid Access Denied', details: 'A request made in 2026 was blocked. Check your condition.' };
      if (expiredResult.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'Expired Access Allowed!', details: 'A request made in 2027 was permitted! Ensure you are using DateLessThan correctly.' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Time Protocol Active!', details: 'You successfully restricted access temporally.' };
    }
  },
  {
    id: 15,
    title: 'The Strict Tagger',
    subtitle: 'Enforcing organizational standards',
    difficulty: 'Moderate',
    briefing: `## 📋 MISSION BRIEFING — Level 15\n\n**Agent**, our cloud costs are spiraling out of control because developers keep launching EC2 instances without tagging them to a specific project.\n\nWe need to enforce a rule: No one can launch an EC2 instance unless they apply a tag named \`Environment\` with a value of \`Production\` or \`Development\` during the launch.\n\nYour job: **Write an IAM policy** that allows \`ec2:RunInstances\` ONLY if the request includes a tag \`Environment: Production\`.\n\n### 🎯 Target\n- **Action:** \`ec2:RunInstances\`\n- **Resource:** \`arn:aws:ec2:us-east-1:123456789012:instance/*\`\n- **Condition:** \`StringEquals\` on \`aws:RequestTag/Environment\` to \`Production\`\n\n> *"No tags, no servers."*`,
    objective: 'Write a policy using aws:RequestTag to enforce tagging during resource creation.',
    hint: `💡 **aws:RequestTag**\n\n\`aws:RequestTag/KeyName\` checks the tags passed in the API request (e.g., when creating a resource).`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "ec2:RunInstances",\n      "Resource": "arn:aws:ec2:us-east-1:123456789012:instance/*",\n      "Condition": {\n        "StringEquals": {\n          "aws:RequestTag/Environment": "Production"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'developer',
      userArn: 'arn:aws:iam::123456789012:user/developer',
      groups: [],
      userPolicies: [],
      targetAction: 'ec2:RunInstances',
      targetResource: 'arn:aws:ec2:us-east-1:123456789012:instance/*',
      targetResourceName: 'EC2 Instances',
      targetServiceIcon: '🏷️',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '', Condition: { StringEquals: { 'aws:RequestTag/Environment': '' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: Tag Enforcement Active**\n\nDevelopers must now tag their resources to launch them.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const validContext = { ...context, conditions: { 'aws:RequestTag/Environment': 'Production' } };
      const validResult = evaluatePolicy(playerPolicy, validContext, architecture, undefined);
      
      const invalidContext = { ...context, conditions: { 'aws:RequestTag/Environment': 'Personal' } };
      const invalidResult = evaluatePolicy(playerPolicy, invalidContext, architecture, undefined);
      
      const untaggedContext = { ...context, conditions: {} };
      const untaggedResult = evaluatePolicy(playerPolicy, untaggedContext, architecture, undefined);
      
      if (!validResult.allowed) return { ...validResult, message: 'Correct Tag Denied', details: 'A request with Environment: Production was blocked.' };
      if (invalidResult.allowed || untaggedResult.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'Improper Tags Allowed!', details: 'Your policy allowed a request without the required Production tag.' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Strict Tagging Enforced!', details: 'You successfully implemented tag-based access control.' };
    }
  },
  {
    id: 16,
    title: 'The Role Chainer',
    subtitle: 'Assuming based on tags',
    difficulty: 'Moderate',
    briefing: `## 📋 MISSION BRIEFING — Level 16\n\n**Agent**, an automated service needs to assume various roles across our AWS organization.\n\nInstead of updating the service's policy every time a new role is created, we use **Attribute-Based Access Control (ABAC)**.\n\nYour job: **Write an IAM policy** that allows \`sts:AssumeRole\` on ANY role (\`*\`), but ONLY if the role itself is tagged with \`Project: Secret\`.\n\n### 🎯 Target\n- **Action:** \`sts:AssumeRole\`\n- **Resource:** \`*\`\n- **Condition:** \`StringEquals\` on \`iam:ResourceTag/Project\` to \`Secret\`\n\n> *"Attributes scale better than lists."*`,
    objective: 'Write an ABAC policy allowing AssumeRole based on the target role\'s iam:ResourceTag.',
    hint: `💡 **aws:ResourceTag vs iam:ResourceTag**\n\nWhen checking tags on an IAM Role you are trying to assume, the condition key is specifically \`iam:ResourceTag/KeyName\`.`,
    example: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "sts:AssumeRole",\n      "Resource": "*",\n      "Condition": {\n        "StringEquals": {\n          "iam:ResourceTag/Project": "Secret"\n        }\n      }\n    }\n  ]\n}`,
    architecture: {
      userName: 'automation-service',
      userArn: 'arn:aws:iam::123456789012:user/automation-service',
      groups: [],
      userPolicies: [],
      targetAction: 'sts:AssumeRole',
      targetResource: 'arn:aws:iam::123456789012:role/TargetRole',
      targetResourceName: 'Target IAM Roles',
      targetServiceIcon: '🔗',
      accountId: '123456789012',
      region: 'us-east-1',
    },
    policyTarget: 'identity-policy',
    starterCode: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '', Resource: '*', Condition: { StringEquals: { 'iam:ResourceTag/Project': '' } } }] }, null, 2),
    solutionExplanation: `✅ **Solution: ABAC Implemented**\n\nThe service can now dynamically assume any role tagged for the Secret project.`,
    customEvaluator: (playerPolicy, context, architecture) => {
      const validContext = { ...context, conditions: { 'iam:ResourceTag/Project': 'Secret' } };
      const validResult = evaluatePolicy(playerPolicy, validContext, architecture, undefined);
      
      const invalidContext = { ...context, conditions: { 'iam:ResourceTag/Project': 'Public' } };
      const invalidResult = evaluatePolicy(playerPolicy, invalidContext, architecture, undefined);
      
      if (!validResult.allowed) return { ...validResult, message: 'Valid Role Denied', details: 'A request to assume a Secret-tagged role was blocked.' };
      if (invalidResult.allowed) return { allowed: false, stage: 'IdentityAllow', message: 'Invalid Role Allowed!', details: 'Your policy allowed assuming a role tagged Public. Use iam:ResourceTag/Project.' };
      
      return { allowed: true, stage: 'IdentityAllow', message: 'Role Chaining Authorized!', details: 'You successfully implemented attribute-based access control.' };
    }
  }
];
