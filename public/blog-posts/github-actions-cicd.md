---
title: "CI/CD with GitHub Actions: Automate Your Development Workflow"
excerpt: "Learn how to set up continuous integration and deployment pipelines using GitHub Actions for faster, more reliable software delivery."
date: "2024-12-20"
updatedDate: "2026-07-12"
author: "Dikshant Rai"
category: "CI/CD"
platform: ""
difficulty: "Intermediate"
image: "/images/social/cicd.png"
tags: ["GitHub Actions", "CI/CD", "DevOps", "Automation"]
tools: ["GitHub Actions", "Docker"]
---

GitHub Actions runs repository workflows in response to events such as pull requests, pushes, schedules, and manual dispatches. The important design work is controlling permissions, making jobs reproducible, and ensuring that an untrusted change cannot reach deployment credentials.

## What is GitHub Actions?

GitHub Actions is a CI/CD platform that allows you to automate your software development workflows. You can run workflows that build, test, package, release, or deploy any code project on GitHub.

### Key Benefits

- **Integrated**: Built directly into GitHub
- **Flexible**: Supports any programming language and framework
- **Scalable**: Runs on GitHub-hosted or self-hosted runners
- **Marketplace**: Thousands of pre-built actions available
- **Usage model**: Included minutes and billing depend on repository visibility, runner type, operating system, and account plan

## Core Concepts

### Workflows
YAML files that define automated processes:
- Triggered by events (push, pull request, schedule)
- Contain one or more jobs
- Stored in `.github/workflows/` directory

### Jobs
Set of steps that execute on the same runner:
- Run in parallel by default
- Can depend on other jobs
- Execute on virtual machines or containers

### Steps
Individual tasks within a job:
- Run commands or actions
- Share data within the same job
- Access the filesystem and environment variables

### Actions
Reusable units of code:
- Custom applications that perform frequently repeated tasks
- Can be created by you, GitHub, or the community
- Simplify complex workflows

## Getting Started

### Basic Workflow Structure

Create `.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v6

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version: '24'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Run linting
      run: npm run lint
```

### Triggers (Events)

```yaml
on:
  # Trigger on push to specific branches
  push:
    branches: [ main, develop ]
    tags: [ 'v*' ]

  # Trigger on pull requests
  pull_request:
    branches: [ main ]
    types: [opened, synchronize, reopened]

  # Trigger on schedule (cron format)
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM

  # Manual trigger
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production
```

## Building a Complete CI/CD Pipeline

### 1. Multi-Stage Pipeline for Node.js Application

```yaml
name: Complete CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '24'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: read
  packages: write

jobs:
  # Code Quality & Testing
  quality:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v6

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Lint code
      run: npm run lint

    - name: Type check
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Upload coverage reports
      uses: codecov/codecov-action@v6
      with:
        files: ./coverage/lcov.info

  # Security Scanning
  security:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v6

    - name: Run security audit
      run: npm audit --audit-level high

  # Build Application
  build:
    needs: [quality, security]
    runs-on: ubuntu-latest

    outputs:
      image-digest: ${{ steps.build.outputs.digest }}

    steps:
    - name: Checkout
      uses: actions/checkout@v6

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Container Registry
      if: github.event_name != 'pull_request'
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v7
      with:
        context: .
        push: ${{ github.event_name != 'pull_request' }}
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  # Deploy to Staging
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add your deployment commands here

  # Deploy to Production
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add your deployment commands here
```

### 2. Matrix Strategy for Multi-Platform Testing

```yaml
name: Cross-Platform Testing

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [20, 22, 24]

    steps:
    - name: Checkout
      uses: actions/checkout@v6

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v6
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test
```

### 3. Database Testing with Services

```yaml
name: API Testing with Database

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - name: Checkout
      uses: actions/checkout@v6

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version: '24'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379

    - name: Run API tests
      run: npm run test:api
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379
```

## Advanced Workflows

### 1. Conditional Deployments

```yaml
name: Smart Deployment

on:
  push:
    branches: [main]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      docs: ${{ steps.changes.outputs.docs }}
    steps:
    - name: Checkout
      uses: actions/checkout@v6

    - name: Check for changes
      uses: dorny/paths-filter@v3
      id: changes
      with:
        filters: |
          frontend:
            - 'frontend/**'
          backend:
            - 'backend/**'
            - 'api/**'
          docs:
            - 'docs/**'
            - '*.md'

  deploy-frontend:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    steps:
    - name: Deploy Frontend
      run: echo "Deploying frontend changes"

  deploy-backend:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest
    steps:
    - name: Deploy Backend
      run: echo "Deploying backend changes"

  update-docs:
    needs: changes
    if: ${{ needs.changes.outputs.docs == 'true' }}
    runs-on: ubuntu-latest
    steps:
    - name: Update Documentation
      run: echo "Updating documentation"
```

### 2. Reusable Workflows

Create `.github/workflows/reusable-deploy.yml`:

```yaml
name: Reusable Deployment

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      image-tag:
        required: true
        type: string
    secrets:
      DEPLOY_TOKEN:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
    - name: Deploy to ${{ inputs.environment }}
      run: |
        echo "Deploying image ${{ inputs.image-tag }} to ${{ inputs.environment }}"
        # Deployment logic here
      env:
        DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

Use in main workflow:

```yaml
name: Main Pipeline

on:
  push:
    branches: [main]

jobs:
  build:
    # ... build job

  deploy-staging:
    needs: build
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
      image-tag: ${{ needs.build.outputs.image-tag }}
    secrets:
      DEPLOY_TOKEN: ${{ secrets.STAGING_DEPLOY_TOKEN }}
```

### 3. Custom Actions

Create a custom action in `.github/actions/setup-app/action.yml`:

```yaml
name: 'Setup Application'
description: 'Setup Node.js app with caching and dependencies'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '24'
  cache-dependency-path:
    description: 'Path to dependency file'
    required: false
    default: 'package-lock.json'

runs:
  using: 'composite'
  steps:
  - name: Setup Node.js
    uses: actions/setup-node@v6
    with:
      node-version: ${{ inputs.node-version }}
      cache: npm
      cache-dependency-path: ${{ inputs.cache-dependency-path }}

  - name: Install dependencies
    run: npm ci
    shell: bash
```

Use the custom action:

```yaml
steps:
- name: Checkout
  uses: actions/checkout@v6

- name: Setup App
  uses: ./.github/actions/setup-app
  with:
    node-version: '24'
```

## Security Best Practices

### 1. Secrets Management

```yaml
# Use secrets for sensitive data
env:
  API_KEY: ${{ secrets.API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

```

Repository and environment secrets are referenced through the `secrets` context. The `secrets: inherit` syntax applies to calls to reusable workflows; it is not a general way to load secrets into an ordinary job.

### 2. OIDC Authentication

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
        aws-region: us-east-1
```

### 3. Dependency Updates

Use Dependabot or another reviewed dependency service instead of running `npm audit fix` unattended. A minimal `.github/dependabot.yml` configuration is:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

## Monitoring and Optimization

### 1. Workflow Insights

- Monitor workflow run times
- Track success/failure rates
- Analyze billing usage
- Optimize runner selection

### 2. Caching Strategies

```yaml
steps:
- uses: actions/setup-node@v6
  with:
    node-version: 24
    cache: npm
- run: npm ci

- uses: docker/build-push-action@v7
  with:
    context: .
    push: false
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### 3. Performance Tips

- Prefer a tool's supported cache integration, such as `setup-node` for npm and Buildx's `type=gha` backend
- Keep the default shallow checkout unless a job genuinely needs history or tags
- Use matrix strategies for parallel execution
- Consider self-hosted runners for heavy workloads
- Use `continue-on-error` for non-critical steps

## Common Patterns

### 1. Release Automation

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v6

    - name: Create Release
      run: gh release create "$GITHUB_REF_NAME" --verify-tag --generate-notes
      env:
        GH_TOKEN: ${{ github.token }}
```

For chat notifications, use an integration owned by the destination platform or pin a reviewed third-party action to a full commit SHA. Give the notification job only the secret and permissions it requires.

## Troubleshooting

### Common Issues

1. **Permission Errors**: Check GITHUB_TOKEN permissions
2. **Cache Misses**: Verify cache key patterns
3. **Timeout Issues**: Increase timeout or optimize workflow
4. **Secret Access**: Ensure secrets are properly configured

### Debug Techniques

```yaml
- name: Debug Information
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "SHA: ${{ github.sha }}"
    echo "Actor: ${{ github.actor }}"
    echo "Run ID: ${{ github.run_id }}"
```

## Conclusion

Start with one pull-request workflow that installs from a lockfile, runs deterministic checks, and has read-only repository permission. Add packaging and deployment only after artifacts, environments, approvals, and rollback behavior are defined.

Key takeaways:
- Start simple, iterate frequently
- Prefer maintained actions and pin third-party actions to reviewed commit SHAs
- Implement proper secret management
- Monitor and optimize performance
- Test your workflows thoroughly

With GitHub Actions, you can automate your development lifecycle from code review through deployment while keeping each control visible in the repository.

## References

- [GitHub Actions workflow syntax](https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax)
- [Assigning permissions to jobs](https://docs.github.com/actions/security-for-github-actions/security-guides/automatic-token-authentication)
- [Using OpenID Connect](https://docs.github.com/actions/concepts/security/openid-connect)
- [Dependency caching](https://docs.github.com/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
