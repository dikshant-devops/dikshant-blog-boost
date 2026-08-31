---
title: "Deploy Services with a GitHub Actions Matrix"
excerpt: "Build a maintainable GitHub Actions deployment workflow for multiple services with typed inputs, a validated matrix, protected environments, and concurrency."
date: "2026-01-12"
updatedDate: "2026-08-31"
author: "Dikshant Rai"
category: "CI/CD"
platform: ""
difficulty: "Intermediate"
image: "/images/social/cicd.png"
tags: ["CI/CD", "GitHub Actions", "DevOps"]
tools: ["GitHub Actions"]
---

Separate deployment workflows often start as the simplest choice: one file for the API, another for the web application, then copies for development, staging, and production. The duplication becomes expensive when every security fix, runtime update, or deployment flag must be changed in six places.

A GitHub Actions matrix can represent independent services as data while one job defines the deployment behavior. The important part is not reducing the file count. It is keeping service selection constrained, environment controls explicit, credentials short-lived, and concurrent deployments predictable.

## When a deployment matrix is the right abstraction

Use a matrix when the services:

- follow the same build and deployment contract;
- can deploy independently;
- differ mainly by name, source path, image name, or target;
- should run in parallel or with a controlled parallelism limit.

Do not force unlike workloads into one matrix. A database migration, mobile release, and stateless container may have different approval, rollback, and ordering requirements. Reusable workflows are a better boundary when teams share a deployment process but need separate triggers or permissions.

This example deploys `api` and `web` services from one manually triggered workflow. The cloud-specific authentication and deployment commands are represented by repository scripts so the orchestration remains readable.

## Repository contract

Keep service-specific logic with each service and expose the same interface:

```text
services/
├── api/
│   ├── Dockerfile
│   └── scripts/deploy.sh
└── web/
    ├── Dockerfile
    └── scripts/deploy.sh
```

Each `deploy.sh` should accept the target environment and immutable release identifier:

```bash
./scripts/deploy.sh --environment staging --release "$GITHUB_SHA"
```

The script should fail on errors, print the target before changing it, wait for rollout completion, and return a nonzero exit code when verification fails. The workflow coordinates deployments; it should not hide provider-specific failure handling inside long inline shell blocks.

## Use typed manual inputs

`workflow_dispatch` supports typed inputs. A `choice` input prevents arbitrary service names, while an `environment` input selects an existing GitHub environment:

```yaml
name: Deploy services

on:
  workflow_dispatch:
    inputs:
      target:
        description: Services to deploy
        required: true
        type: choice
        options:
          - api
          - web
          - all
      environment:
        description: Deployment environment
        required: true
        type: environment

permissions:
  contents: read
```

Manual input values still cross a trust boundary. Constraining them with `choice` and `environment` is safer than interpolating free-form text into shell commands.

The workflow file must exist on the default branch before GitHub accepts a manual dispatch. Test changes on a non-production environment after merging the workflow definition.

## Build a validated matrix

The first job converts the selected target into a small JSON matrix. A shell `case` statement is intentionally boring: every allowed value is visible and an unexpected value fails closed.

```yaml
jobs:
  prepare:
    name: Select deployment targets
    runs-on: ubuntu-latest
    timeout-minutes: 5
    outputs:
      matrix: ${{ steps.targets.outputs.matrix }}

    steps:
      - name: Build service matrix
        id: targets
        env:
          TARGET: ${{ inputs.target }}
        shell: bash
        run: |
          set -euo pipefail

          case "$TARGET" in
            api)
              matrix='{"include":[{"service":"api","path":"services/api"}]}'
              ;;
            web)
              matrix='{"include":[{"service":"web","path":"services/web"}]}'
              ;;
            all)
              matrix='{"include":[{"service":"api","path":"services/api"},{"service":"web","path":"services/web"}]}'
              ;;
            *)
              echo "Unsupported target: $TARGET" >&2
              exit 1
              ;;
          esac

          echo "matrix=$matrix" >> "$GITHUB_OUTPUT"
```

The matrix is generated from repository-owned constants, not from unchecked JSON supplied by the caller. That keeps paths and service identifiers under code review.

For a large service catalog, store the configuration in a versioned JSON file and validate it against a schema. Do not grow a shell statement into a second configuration language.

## Deploy each service as a matrix job

The deployment job consumes the JSON with `fromJSON`:

```yaml
  deploy:
    name: Deploy ${{ matrix.service }} to ${{ inputs.environment }}
    needs: prepare
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      fail-fast: false
      max-parallel: 2
      matrix: ${{ fromJSON(needs.prepare.outputs.matrix) }}

    environment:
      name: ${{ inputs.environment }}

    concurrency:
      group: deploy-${{ inputs.environment }}-${{ matrix.service }}
      cancel-in-progress: false

    permissions:
      contents: read
      id-token: write

    steps:
      - name: Check out repository
        uses: actions/checkout@v7

      - name: Authenticate to cloud provider
        run: ./scripts/authenticate-ci.sh

      - name: Deploy service
        working-directory: ${{ matrix.path }}
        env:
          DEPLOY_ENVIRONMENT: ${{ inputs.environment }}
          RELEASE_SHA: ${{ github.sha }}
        shell: bash
        run: |
          set -euo pipefail
          ./scripts/deploy.sh \
            --environment "$DEPLOY_ENVIRONMENT" \
            --release "$RELEASE_SHA"
```

The example requests `id-token: write` for OpenID Connect (OIDC) authentication. Replace `authenticate-ci.sh` with the cloud provider's reviewed OIDC action or token exchange. Restrict the provider trust policy to the repository, branch or tag, and GitHub environment that should deploy. Remove `id-token: write` when the deployment target does not use OIDC.

Pin third-party actions to reviewed full commit SHAs in production workflows. Major tags keep examples readable, but a mutable tag is weaker than an immutable reference.

## Understand each control separately

The matrix, environment, permissions, and concurrency settings solve different problems.

### Matrix controls fan-out

One matrix entry creates one job. GitHub can create many jobs quickly, so set `max-parallel` to match runner capacity, provider quotas, and deployment-system limits.

`fail-fast: false` allows the web deployment to finish if the API deployment fails. That is appropriate only when the services are independently releasable. Use `fail-fast: true` or explicit dependencies when a partial release is unsafe.

### Environment controls access and approval

The `environment` key links the job to GitHub deployment history, environment variables and secrets, branch restrictions, and configured protection rules. A production environment can require reviewers and prevent the initiating user from approving their own deployment where the repository plan supports that feature.

Environment protection and workflow syntax must agree. A string called `production` does not create a secure approval process by itself; configure the environment in repository settings and test the restriction.

### Permissions control the GitHub token

Start with `contents: read`, then add only what the job needs. `id-token: write` permits the job to request an OIDC token; it does not directly grant cloud permissions. The cloud trust policy decides what that token can become.

Avoid passing all repository secrets into a generic deployment job. Prefer environment-scoped configuration and short-lived credentials.

### Concurrency controls overlap

The group combines environment and service, so two API deployments to production cannot run simultaneously while API and web can deploy independently.

`cancel-in-progress: false` protects the active deployment from cancellation. Standard concurrency is not a durable first-in, first-out release queue: GitHub limits pending work in a group and may replace an older pending run. Use a dedicated deployment queue or merge-driven promotion process when every release must execute in order.

## Validate before touching an environment

Add a validation job before `deploy` when the repository does not already require the same checks on the release commit:

```yaml
  validate:
    name: Validate release commit
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7
      - run: ./scripts/ci.sh
```

Then require both jobs:

```yaml
  deploy:
    needs: [prepare, validate]
```

Do not rebuild a mutable artifact independently in every environment. A stronger release flow builds once, records an immutable digest, verifies it, and promotes that same artifact through staging and production.

## Know when to use a reusable workflow

A matrix removes repetition inside one workflow. A reusable workflow removes repetition across callers.

Use a reusable workflow when:

- push, scheduled, and manual triggers should call the same deployment implementation;
- several repositories use one reviewed deployment contract;
- environments need different caller permissions but identical build steps.

Define explicit `workflow_call` inputs and secrets. Avoid `secrets: inherit` unless the called workflow genuinely needs every available secret. Reference reusable workflows by a reviewed commit SHA when they live in another repository.

## Failure modes to test

### An unsupported service reaches a shell command

Keep service choices constrained and validate again in the matrix-generation job. Never use an arbitrary input as a path, command name, or environment identifier.

### Production runs without approval

Confirm that the job references the exact configured environment name and that its protection rules apply to the repository plan and visibility. Trigger a non-destructive test deployment and verify the waiting state.

### Two runs race on the same service

Inspect the concurrency-group expression in the workflow graph. Every workflow that can deploy the service must use a compatible group; concurrency in one workflow does not govern a different workflow that omits it.

### One matrix failure leaves a partial release

Choose `fail-fast` based on service independence, then document recovery. For tightly coupled services, deploy a versioned release as one coordinated unit instead of relying on unrelated parallel jobs.

### A rerun deploys different bytes

Pass immutable artifact digests between build and deploy jobs. `github.sha` identifies source, but rebuilding later can still resolve different base images or external dependencies.

## Production checklist

- Keep the matrix limited to services with the same deployment contract.
- Constrain and validate manual inputs before using them in paths or commands.
- Use protected GitHub environments for deployment policy and scoped configuration.
- Authenticate to cloud providers with OIDC and narrow trust conditions where supported.
- Set least-privilege `GITHUB_TOKEN` permissions at the job level.
- Bound matrix parallelism and define partial-failure behavior deliberately.
- Use concurrency groups consistently across every workflow that can deploy a target.
- Build once and promote immutable artifacts rather than rebuilding per environment.
- Keep rollback or roll-forward commands in the service deployment contract.

## Key takeaways

A matrix is useful when it turns repeated workflow structure into reviewed data. It is not a shortcut around deployment design. Typed inputs, protected environments, short-lived credentials, immutable artifacts, and explicit concurrency are what make the consolidated workflow safer than a collection of copies.

## References

- [GitHub Actions workflow syntax and matrix strategy](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Triggering workflows with typed inputs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [Controlling workflow and job concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [Reusing workflow configurations](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations)
- [Configuring OpenID Connect for cloud providers](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-cloud-providers)
