---
title: "Scan Terraform with Checkov in GitHub Actions"
excerpt: "Build a Checkov workflow that scans Terraform pull requests, blocks unsafe changes, handles exceptions, and produces reviewable security evidence."
date: "2025-12-01"
updatedDate: "2026-08-31"
author: "Dikshant Rai"
category: "Security"
platform: ""
difficulty: "Intermediate"
image: "/images/social/security.png"
tags: ["Security", "Terraform", "CI/CD", "GitHub Actions"]
tools: ["Checkov", "Terraform", "GitHub Actions"]
---

Terraform makes infrastructure changes reviewable, but a clean plan does not mean the configuration is secure. A pull request can still introduce a public storage bucket, an unrestricted firewall rule, missing encryption, or an identity with more access than it needs.

Checkov catches many of these mistakes before deployment by evaluating infrastructure-as-code against policy checks. This guide builds a practical workflow in two stages: run the same scan locally while editing, then enforce it as a required GitHub Actions check on pull requests.

## What this workflow should prove

A useful infrastructure security gate needs to answer more than "did the scanner run?" It should prove that:

- the intended Terraform directory was scanned;
- a failed policy causes the job to fail;
- the result identifies the file, resource, and policy involved;
- accepted exceptions are narrow, explained, and visible in review;
- scanner and action versions are controlled like other build dependencies.

Checkov supports Terraform source and plan files along with several other infrastructure and pipeline formats. This article intentionally scans Terraform source. Plan scanning can reveal values that source scanning cannot resolve, but it also introduces state, credentials, and artifact-handling decisions that deserve a separate workflow.

## Prerequisites

The examples assume:

- Terraform code lives under `infra/`;
- contributors can run Python tools locally;
- GitHub Actions is enabled for the repository;
- branch protection or a repository ruleset can require the Checkov job before merge.

Use a reviewed Checkov version in local automation and CI. The commands below use a placeholder so the repository owner must make that decision explicitly:

```bash
export CHECKOV_VERSION="<reviewed-version>"
pipx install "checkov==${CHECKOV_VERSION}"
checkov --version
```

`pipx` keeps the command isolated from application dependencies. A Python virtual environment is also reasonable; the important property is that the version is reproducible.

## Start with a deliberately weak Terraform resource

This Google Cloud Storage example omits two controls that are commonly expected for an internal artifact bucket:

```hcl
resource "google_storage_bucket" "release_artifacts" {
  name     = "example-release-artifacts"
  location = "US"
}
```

Run Checkov against the Terraform directory:

```bash
checkov \
  --directory infra \
  --framework terraform
```

Do not focus only on the number of failed checks. Read each result in context:

1. Confirm that the reported resource is the one in the pull request.
2. Read the policy description and linked remediation guidance.
3. Decide whether the policy reflects a real requirement for this environment.
4. Fix the configuration or document a narrowly approved exception.

Scanner output is evidence for review, not a substitute for architecture decisions.

## Fix the configuration instead of muting the job

For an internal bucket, public access prevention and uniform bucket-level access provide a clearer baseline:

```hcl
resource "google_storage_bucket" "release_artifacts" {
  name                        = "example-release-artifacts"
  location                    = "US"
  public_access_prevention    = "enforced"
  uniform_bucket_level_access = true
}
```

Run the same command again and inspect the changed result:

```bash
checkov \
  --directory infra \
  --framework terraform \
  --quiet
```

`--quiet` hides passed checks and keeps failures visible. It does not soften the exit code. That distinction matters in CI: a concise report is useful, while a successful exit after policy failures defeats the gate.

## Add a blocking GitHub Actions workflow

Create `.github/workflows/checkov.yml`:

```yaml
name: Checkov

on:
  pull_request:
    paths:
      - "infra/**/*.tf"
      - ".github/workflows/checkov.yml"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  terraform-security:
    name: Terraform security policy
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Check out repository
        uses: actions/checkout@v7

      - name: Scan Terraform with Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: infra
          framework: terraform
          quiet: true
          soft_fail: false
```

The explicit `soft_fail: false` records the intended behavior even though failing checks already produce a nonzero result by default. Do not add `continue-on-error: true` to the scan step when the job is meant to block unsafe changes.

For production repositories, pin third-party actions to reviewed full commit SHAs and use dependency automation to propose updates. Major tags make examples readable, but a mutable tag is not the strongest supply-chain control.

## Make the check required before merge

A passing workflow is optional until branch protection or a repository ruleset requires it. After the workflow has run at least once:

1. Open the repository rules for the default branch.
2. Require a pull request before merge.
3. Add `Terraform security policy` as a required status check.
4. Prevent bypasses except for a documented emergency role.

Test the rule with a temporary pull request that contains a known policy failure. The scan should fail, the merge control should remain blocked, and the report should identify the offending Terraform resource. Remove the test change after the behavior is confirmed.

## Handle exceptions without hiding risk

Some findings do not apply to a specific resource. Checkov supports inline suppression, but a suppression should read like a small risk record rather than a switch that silences the tool:

```hcl
resource "example_resource" "documented_exception" {
  # checkov:skip=CHECK_ID:Approved exception in SEC-1234; expires 2026-12-31
  name = "example"
}
```

Use the real check identifier from the scan. A defensible exception contains:

- the reason the policy does not apply or the risk is accepted;
- the owner or approval record;
- a review or expiry date;
- the smallest possible scope.

Avoid repository-wide `skip_check` lists for one-resource exceptions. Broad exclusions make later violations invisible and are difficult to remove safely.

## Add SARIF only when the repository can use it

Checkov can emit SARIF so findings appear in GitHub code scanning. This is useful when the repository has the required GitHub code-scanning capability and the team actively triages those alerts.

The scan needs CLI and SARIF outputs:

```yaml
      - name: Scan Terraform with Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: infra
          framework: terraform
          output_format: cli,sarif
          output_file_path: console,results.sarif
          soft_fail: false
```

The job also needs `security-events: write`, followed by an upload step that runs even when Checkov reports a failure:

```yaml
permissions:
  contents: read
  security-events: write

steps:
  # Checkout and Checkov steps appear above.

  - name: Upload Checkov SARIF
    if: always()
    uses: github/codeql-action/upload-sarif@v3
    with:
      sarif_file: results.sarif
      category: checkov-terraform
```

Keep the blocking CLI result even when SARIF is uploaded. An alert dashboard is valuable for investigation, but it should not turn a required pull-request control into an advisory report by accident.

## Common failure modes

### The job passes even with failed policies

Check for `soft_fail: true`, `continue-on-error`, shell commands ending in `|| true`, or wrapper scripts that discard Checkov's exit code.

### The workflow scans the wrong directory

Run with a deliberately vulnerable fixture in the expected path. A fast green job can mean the scanner found no Terraform files rather than that the code is safe.

### Local and CI results disagree

Compare Checkov versions, configuration files, frameworks, variable files, downloaded external modules, and working directories. Keep those settings in repository-owned configuration where possible.

### Every exception becomes permanent

Require an owner and expiry date in suppression comments, then review suppressions on a schedule. A policy exception is operational debt and should remain searchable.

## Production checklist

- Pin the Checkov package and GitHub Actions to reviewed versions.
- Scan the exact Terraform roots used for deployment.
- Keep `soft_fail` disabled for required controls.
- Require the job in branch rules, then test that it blocks a failing pull request.
- Review each finding in context instead of chasing a zero count blindly.
- Keep suppressions narrow, owned, justified, and time-bounded.
- Treat SARIF upload as additional visibility, not a replacement for the CI exit code.
- Re-run the scanner when Checkov policies or provider versions change.

## Key takeaways

Checkov is most useful when developers can reproduce the scan locally and the same result controls merge behavior. The scanner finds policy violations; the engineering work is deciding which controls apply, fixing the configuration, and keeping exceptions visible enough to revisit.

## References

- [Checkov CLI command reference](https://www.checkov.io/2.Basics/CLI%20Command%20Reference.html)
- [Checkov integration with GitHub Actions](https://www.checkov.io/4.Integrations/GitHub%20Actions.html)
- [Official Checkov GitHub Action](https://github.com/bridgecrewio/checkov-action)
- [GitHub secure use reference for Actions](https://docs.github.com/en/actions/reference/security/secure-use)
- [Uploading SARIF results to GitHub](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/integrate-with-existing-tools/upload-sarif-file)
