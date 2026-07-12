---
title: "Google Cloud IAM Fundamentals for Engineers"
excerpt: "Learn how Google Cloud IAM evaluates principals, roles, resources, and inherited policies, then apply a least-privilege workflow with gcloud."
date: "2026-07-12"
updatedDate: "2026-07-12"
author: "Dikshant Rai"
category: "Security"
platform: "GCP"
playlist: "GCP Security Essentials"
playlistOrder: 1
playlistOnly: true
difficulty: "Beginner"
image: "/og-default.jpg"
tags: ["GCP", "Cloud", "Security"]
tools: ["Google Cloud IAM", "gcloud"]
readTime: "8 min read"
---

Identity and Access Management becomes easier to reason about when every access decision is reduced to one question: **which principal can use which role on which resource?** Google Cloud IAM answers that question with policies attached to the resource hierarchy. The difficult part is rarely creating a role binding. It is understanding the effective access produced by bindings at the organization, folder, project, and resource levels.

This guide builds that mental model first, then applies it through a small, auditable workflow. The examples use a project and a Cloud Storage bucket, but the reasoning applies to most Google Cloud services.

## The access model

Google Cloud describes authorization with three core elements:

- A **principal** is the identity requesting access. It can be a user, group, service account, workforce identity, or workload identity.
- A **role** is a named collection of permissions. Permissions normally follow a `service.resource.verb` pattern, such as `storage.objects.get`.
- A **resource** is the object being accessed, such as a project, bucket, Secret Manager secret, or Compute Engine instance.

You grant a role to a principal by adding a binding to an allow policy. A binding can also contain an IAM Condition, which limits when the binding applies. Conditions are useful for constraints such as a resource name prefix or an expiry time, but they should sharpen an already narrow grant rather than compensate for an overly broad role.

Google Cloud permissions cannot normally be granted one at a time. They are delivered through roles:

- **Basic roles** such as Owner, Editor, and Viewer are broad. They are convenient for experiments but usually too permissive for production workloads.
- **Predefined roles** are maintained by Google Cloud services and are the best starting point for most assignments.
- **Custom roles** let an organization package a specific permission set when no predefined role fits. They also create maintenance work because permission support and service capabilities change.

## Resource hierarchy changes the answer

Google Cloud resources form a hierarchy: organization, folders, projects, and service resources. An allow policy attached to a parent is inherited by descendants. A project-level grant can therefore affect many resources even when the bucket or instance policy does not show that binding locally.

Suppose `group:platform-readers@example.com` receives `roles/viewer` on a folder. A project inside that folder inherits the grant. Adding a narrow bucket role later does not remove the inherited project access. To understand a principal's effective access, inspect both the target resource and its ancestors.

This is why project-level roles should be deliberate. Project scope is appropriate when the same access is genuinely required across the project. For a workload that reads one bucket, grant a bucket-scoped role instead.

## Human and workload identities

Human access should normally be assigned to groups rather than individual users. Groups make onboarding, role changes, and offboarding reviewable in one place. An individual binding may be reasonable for a short investigation, but it should have a condition, an owner, and an expiry plan.

Service accounts represent non-human identities. A service account is both a principal that can receive roles and a resource that other principals might be allowed to impersonate. Those are separate permissions. Granting a workload access to a bucket does not automatically let an engineer act as that service account.

For workloads running on Google Cloud, attach a dedicated service account and use short-lived credentials supplied by the platform. For external workloads, prefer Workload Identity Federation. Downloaded service account keys are long-lived secrets; avoiding them removes a rotation and leakage problem rather than merely documenting one.

## Inspect before changing policy

Set the project explicitly so an inherited shell configuration cannot target the wrong environment:

```bash
export PROJECT_ID="example-production"
gcloud config set project "$PROJECT_ID"
gcloud auth list
gcloud config list project
```

Read the current project policy before writing it:

```bash
gcloud projects get-iam-policy "$PROJECT_ID" \
  --format="table(bindings.role,bindings.members)"
```

For a Cloud Storage bucket, inspect the bucket policy separately:

```bash
gcloud storage buckets get-iam-policy gs://example-release-artifacts
```

These commands answer different questions. The bucket output shows direct bucket bindings. The project output reveals grants that may apply more broadly. In larger environments, Policy Analyzer and Policy Troubleshooter provide a clearer view of effective access than manually reading several policy documents.

## Make a narrow grant

Assume a release verification service must read objects from one bucket. Create a dedicated service account:

```bash
gcloud iam service-accounts create release-verifier \
  --project="$PROJECT_ID" \
  --display-name="Release artifact verifier"
```

Grant object read access on the bucket, not on the entire project:

```bash
gcloud storage buckets add-iam-policy-binding \
  gs://example-release-artifacts \
  --member="serviceAccount:release-verifier@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

The scope and role now match the workload requirement: read objects in one bucket. If the application must also list buckets or modify object metadata, prove that requirement separately rather than expanding the grant preemptively.

After a policy change, allow for propagation. IAM updates are eventually consistent, so an immediate denial does not always mean the binding is wrong. Recheck the policy, wait briefly, and retry before adding another role.

## Verify the result as the intended principal

A successful policy write only proves that IAM accepted the change. It does not prove the workload can perform its exact operation, or that it lacks unrelated permissions.

When your identity is allowed to impersonate the service account, test the expected read:

```bash
gcloud storage ls gs://example-release-artifacts \
  --impersonate-service-account="release-verifier@${PROJECT_ID}.iam.gserviceaccount.com"
```

Then test an operation that should remain denied, such as uploading an object from a disposable test file. A negative test catches accidental broad grants that a happy-path check will miss.

For production changes, record four pieces of evidence in the change or pull request:

1. The principal receiving access.
2. The exact predefined or custom role.
3. The lowest resource in the hierarchy that satisfies the requirement.
4. A successful required operation and a failed prohibited operation.

## Common failure modes

### Granting Editor to make an error disappear

Broad roles hide the missing-permission problem and make later review difficult. Capture the denied operation, identify its required permission, and select the narrowest maintained role that contains it.

### Looking only at the resource policy

An unexpected permission often comes from a folder or project ancestor. Trace inherited bindings before concluding that the local policy is safe.

### Reusing one service account across workloads

Shared identities erase workload boundaries. A compromised component gains every permission accumulated by the shared account, and audit logs no longer identify which workload made the request.

### Managing policy as a series of console clicks

The console is useful for inspection, but repeatable production access should be managed through reviewed infrastructure code or a controlled policy pipeline. This creates a diff, ownership history, and a path to rollback.

## Production checklist

- Use groups for people and dedicated identities for workloads.
- Prefer predefined roles; justify every custom role.
- Grant at the lowest practical resource level.
- Avoid basic roles in production.
- Prefer attached identities or federation over service account keys.
- Test both an allowed and a denied operation.
- Review inherited access from organization, folder, and project ancestors.
- Enable and retain the audit logs required by your security policy.
- Revisit unused grants and service accounts on a schedule.

## References

- [Google Cloud IAM overview](https://docs.cloud.google.com/iam/docs/overview)
- [Understanding allow policies](https://docs.cloud.google.com/iam/docs/allow-policies)
- [Best practices for using service accounts securely](https://docs.cloud.google.com/iam/docs/best-practices-service-accounts)

