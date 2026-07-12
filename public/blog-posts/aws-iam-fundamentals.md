---
title: "AWS IAM Fundamentals for Engineers"
excerpt: "Understand AWS IAM identities, role trust, policy evaluation, and least privilege through a practical S3 access example and verification workflow."
date: "2026-07-12"
updatedDate: "2026-07-12"
author: "Dikshant Rai"
category: "Security"
platform: "AWS"
playlist: "AWS IAM Foundations"
playlistOrder: 1
playlistOnly: true
difficulty: "Beginner"
image: "/images/social/security.png"
tags: ["AWS", "Cloud", "Security"]
tools: ["AWS IAM", "AWS CLI", "IAM Access Analyzer"]
---

AWS Identity and Access Management sits on the authorization path for almost every AWS API request. The useful way to learn it is not to memorize policy types. Start with the request AWS must decide: **who is calling, which action are they attempting, which resource is targeted, and which policies apply to that context?**

This guide follows that request from identity to decision. It then builds a narrow S3 read policy and shows how to verify both the caller and the effective behavior.

## Identity is not permission

AWS first authenticates a principal, then evaluates whether the request is authorized. The principal might be a federated workforce session, an IAM role session, an AWS service, or an IAM user. Authentication proves who is making the request; policies determine what that identity can do.

The main IAM identity types serve different purposes:

- **IAM users** are long-lived identities in one AWS account. They are still needed for a limited set of workloads, but they should not be the default for human access.
- **IAM user groups** attach shared permissions to collections of IAM users. Groups cannot be assumed and are not principals in resource policies.
- **IAM roles** are assumable identities that issue temporary credentials through AWS Security Token Service (STS). Roles are the normal choice for federated people, AWS workloads, and cross-account access.

For human access, use federation through an identity provider and temporary sessions. For an application on EC2, ECS, EKS, or Lambda, assign a role using that service's native integration. Static access keys turn access into a secret distribution and rotation problem.

## A role has two different policy questions

An IAM role combines two controls that are often confused:

1. The **trust policy** answers who or what may assume the role and under which conditions.
2. The role's **identity-based policies** answer what an authenticated role session may do after assumption.

A permissive trust policy does not by itself grant S3 or EC2 access, but it may let an unintended principal obtain every permission attached to the role. A narrow permissions policy does not help if the trust relationship allows the wrong account or service to assume it. Review both sides.

In cross-account access, the target role's trust policy must trust the source principal, and the source principal normally needs permission to call `sts:AssumeRole`. For third-party access, conditions such as an external ID can reduce confused-deputy risk, but they do not replace precise principal selection.

## Policy statements describe the boundary

Most IAM policies are JSON documents made of statements. The elements you will use most often are:

- `Effect`: `Allow` or `Deny`.
- `Action`: the API operations covered by the statement.
- `Resource`: the ARN or ARNs affected by those actions.
- `Condition`: optional context requirements such as a source VPC endpoint or resource tag.
- `Principal`: who receives access; this appears in resource-based policies and role trust policies, not ordinary identity-based policies.

An identity-based policy is attached to a user, group, or role. A resource-based policy is attached to a supported resource, such as an S3 bucket, KMS key, SQS queue, or role trust relationship. Larger organizations may also apply service control policies, resource control policies, permissions boundaries, and session policies as guardrails.

## How AWS reaches a decision

The compact model is:

1. Requests begin with an implicit deny.
2. An applicable `Allow` can authorize the requested action and resource.
3. An applicable explicit `Deny` overrides an allow.
4. Guardrails can limit the maximum available permission even when an identity policy contains an allow.

This means adding another allow does not fix a denial caused by an SCP, permissions boundary, session policy, or explicit deny. When troubleshooting, identify every policy layer in the request context rather than repeatedly widening the identity policy.

Conditions are part of the decision too. A policy may allow an action only when a request uses TLS, originates through a particular VPC endpoint, carries approved principal tags, or targets tagged resources. Read the condition operator carefully: a missing context key can produce a different result from a present but non-matching value.

## Confirm the caller before testing

AWS CLI profiles, environment variables, and cached SSO sessions make it easy to test as the wrong identity. Start every access investigation with:

```bash
aws sts get-caller-identity --profile production-readonly
```

Check the account ID and ARN in the response. An assumed-role ARN includes the role and session name, which helps distinguish the temporary session from the role definition.

Also inspect the region when the target service is regional:

```bash
aws configure get region --profile production-readonly
```

IAM itself is global within an AWS account, but the resources controlled by its policies are often regional.

## Build a narrow S3 read policy

Assume a release auditor must list one bucket and read objects under the `releases/` prefix. The bucket and its objects are different ARN shapes, and the API actions apply to different resources:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListReleasePrefix",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::example-release-artifacts",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["releases", "releases/*"]
        }
      }
    },
    {
      "Sid": "ReadReleaseObjects",
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::example-release-artifacts/releases/*"
    }
  ]
}
```

The first statement permits listing only the intended prefix. The second permits reading matching objects. There is no write action and no wildcard resource. If the objects use a customer-managed KMS key, the caller also needs an appropriate KMS permission and the key policy must allow the request; S3 permission alone cannot decrypt the object.

Store customer-managed policies in source control and validate them before attachment:

```bash
aws accessanalyzer validate-policy \
  --policy-type IDENTITY_POLICY \
  --policy-document file://release-auditor-policy.json
```

Validation catches syntax, security, and policy-quality findings. It does not prove the business scope is correct, so a human still needs to inspect every action, resource, condition, and trust relationship.

## Verify positive and negative behavior

Using the intended profile or assumed role, test the required operation:

```bash
aws s3api list-objects-v2 \
  --bucket example-release-artifacts \
  --prefix releases/ \
  --max-items 5 \
  --profile production-readonly
```

Then test an operation that should fail, such as listing an unrelated prefix or uploading an object. A denial is expected evidence here. Do not add permissions merely because a general-purpose console page makes extra background API calls; test the API actions the workload actually requires.

For difficult cases, CloudTrail event history can confirm the principal, action, resource, and error recorded by AWS. The IAM policy simulator is also useful for supported identity-based scenarios, but it is not a substitute for an end-to-end test because service-specific controls and resource policies may affect the real request.

## Common failure modes

### Treating `AdministratorAccess` as a troubleshooting tool

It may remove the symptom while hiding the actual missing action or guardrail. Use the denied API event, service authorization reference, and policy evaluation context to isolate the requirement.

### Mixing trust and permissions

Adding `s3:GetObject` to a trust policy is conceptually wrong; trust controls role assumption. Likewise, adding another S3 allow cannot fix a role nobody is permitted to assume.

### Using `Resource: "*"` without checking service support

Some actions do not support resource-level permissions, but many do. Check each action in the Service Authorization Reference and scope resource ARNs wherever the service supports it.

### Keeping unused credentials and roles

Inactive access is still attack surface. Use last-accessed data, Access Analyzer findings, and CloudTrail evidence to remove permissions, roles, users, and keys that no longer serve an owned workload.

## Production checklist

- Federate workforce users and require MFA.
- Use service-integrated roles and temporary credentials for workloads.
- Verify account, role, and region before every access test.
- Review role trust and role permissions as separate controls.
- Start with specific actions and resource ARNs.
- Validate policies with IAM Access Analyzer.
- Test one allowed and one deliberately denied operation.
- Check SCPs, boundaries, session policies, and explicit denies during troubleshooting.
- Review external and unused access continuously.
- Protect and rarely use the account root credentials.

## References

- [Policies and permissions in AWS IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)
- [When to use IAM identities and roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/when-to-use-iam.html)
- [Security best practices in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Using IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)
