# One Workflow File to Deploy Them All: A Practical Guide to Consolidated Deployments

*Or how I stopped worrying and learned to love GitHub Actions matrices*

---

## The Setup

Picture this: You're working on a typical microservices application with an API backend and a web frontend. You have three environments—dev, staging, and production.

If you're like most teams, you probably have separate workflow files for each combination:
```
.github/workflows/
├── deploy-api-dev.yaml
├── deploy-api-staging.yaml
├── deploy-api-production.yaml
├── deploy-web-dev.yaml
├── deploy-web-staging.yaml
└── deploy-web-production.yaml
```

That's 6 files for just 2 services. Now imagine you need to update the Docker build process. That's 6 files to edit. Want to add a new environment? That's 2 more files.

There's a better way.

## The Idea: One File Per Environment

What if instead of 6 files, you had just 3?

```
.github/workflows/
├── deploy-dev.yaml
├── deploy-staging.yaml
└── deploy-production.yaml
```

Each file can deploy either service, both services, or any future service you add. Let me show you how.

## The Basic Implementation

Here's the skeleton of our consolidated workflow. I'll start simple and then add the clever bits.

```yaml
name: Deploy to Dev Environment

on:
  workflow_dispatch:
    inputs:
      deploy_api:
        description: "Deploy API service"
        type: boolean
        default: false
      deploy_web:
        description: "Deploy web app"
        type: boolean
        default: false

jobs:
  deploy-api:
    if: inputs.deploy_api == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy API
        run: echo "Deploying API..."

  deploy-web:
    if: inputs.deploy_web == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Web
        run: echo "Deploying Web..."
```

This works, but it's repetitive. If we add more services, we're duplicating the same structure over and over. Let's make it smarter.

## The Smart Way: Using Matrices

Here's where it gets interesting. Instead of separate jobs, we'll use a single job with a matrix that's generated dynamically:

```yaml
name: Deploy to Dev Environment

env:
  ENVIRONMENT: dev
  GCP_PROJECT: myapp-dev
  GCP_REGION: us-central1

on:
  workflow_dispatch:
    inputs:
      deploy_all:
        description: "Deploy all services"
        type: boolean
        default: false
      deploy_api:
        description: "Deploy API service"
        type: boolean
        default: false
      deploy_web:
        description: "Deploy web app"
        type: boolean
        default: false

jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.generate-matrix.outputs.matrix }}
      deploy_count: ${{ steps.generate-matrix.outputs.count }}
    steps:
      - name: Generate deployment matrix
        id: generate-matrix
        run: |
          # Define all services with their configs
          # Format: name:docker_path:cloud_service_name:timeout
          SERVICES=(
            "api:services/api/Dockerfile:api-service:15"
            "web:services/web/Dockerfile:web-service:10"
          )

          # Build list of services to deploy
          DEPLOY_SERVICES=()

          if [ "${{ inputs.deploy_all }}" == "true" ]; then
            # Deploy everything
            DEPLOY_SERVICES=("api" "web")
          else
            # Deploy only selected services
            [ "${{ inputs.deploy_api }}" == "true" ] && DEPLOY_SERVICES+=("api")
            [ "${{ inputs.deploy_web }}" == "true" ] && DEPLOY_SERVICES+=("web")
          fi

          # Validate we have at least one service
          if [ ${#DEPLOY_SERVICES[@]} -eq 0 ]; then
            echo "::error::No services selected!"
            exit 1
          fi

          # Build JSON matrix
          MATRIX='{"include":['
          FIRST=true
          for service in "${DEPLOY_SERVICES[@]}"; do
            # Find the service config
            for config in "${SERVICES[@]}"; do
              IFS=':' read -r name dockerfile cloud_service timeout <<< "$config"
              if [ "$name" == "$service" ]; then
                [ "$FIRST" = false ] && MATRIX+=","
                MATRIX+="{\"name\":\"$name\",\"dockerfile\":\"$dockerfile\",\"cloud_service\":\"$cloud_service\",\"timeout\":$timeout}"
                FIRST=false
                break
              fi
            done
          done
          MATRIX+=']}'

          echo "matrix=$MATRIX" >> $GITHUB_OUTPUT
          echo "count=${#DEPLOY_SERVICES[@]}" >> $GITHUB_OUTPUT

          # Show what we're deploying
          echo "### 🚀 Deployment Plan" >> $GITHUB_STEP_SUMMARY
          echo "Deploying ${#DEPLOY_SERVICES[@]} service(s) to ${{ env.ENVIRONMENT }}:" >> $GITHUB_STEP_SUMMARY
          for service in "${DEPLOY_SERVICES[@]}"; do
            echo "- **$service**" >> $GITHUB_STEP_SUMMARY
          done

  deploy:
    needs: prepare
    runs-on: ubuntu-latest
    timeout-minutes: ${{ matrix.timeout }}
    strategy:
      fail-fast: false
      matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}
    steps:
      - uses: actions/checkout@v4

      - name: Build and Deploy ${{ matrix.name }}
        run: |
          echo "Building ${{ matrix.name }}..."
          docker build -f ${{ matrix.dockerfile }} -t gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:${{ github.sha }} .

          echo "Deploying to Cloud Run..."
          gcloud run deploy ${{ matrix.cloud_service }} \
            --image gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:${{ github.sha }} \
            --region ${{ env.GCP_REGION }}
```

Now here's the magic: When you select both services, they deploy **in parallel**. The matrix strategy automatically creates two jobs running simultaneously.

## Real Example: Deploying API and Web Together

Let me walk you through what happens when someone checks both boxes and clicks "Run workflow."

**Step 1: The prepare job runs**

The bash script processes the inputs:
```bash
DEPLOY_SERVICES=("api" "web")
```

Then builds a JSON matrix:
```json
{
  "include": [
    {
      "name": "api",
      "dockerfile": "services/api/Dockerfile",
      "cloud_service": "api-service",
      "timeout": 15
    },
    {
      "name": "web",
      "dockerfile": "services/web/Dockerfile",
      "cloud_service": "web-service",
      "timeout": 10
    }
  ]
}
```

**Step 2: Two parallel deploy jobs start**

GitHub Actions sees the matrix and spawns two jobs:
- Job 1: `deploy (api)`
- Job 2: `deploy (web)`

Both jobs run the same steps, but with different matrix variables:

Job 1 sees:
- `matrix.name` = "api"
- `matrix.dockerfile` = "services/api/Dockerfile"
- `matrix.cloud_service` = "api-service"
- `matrix.timeout` = 15

Job 2 sees:
- `matrix.name` = "web"
- `matrix.dockerfile` = "services/web/Dockerfile"
- `matrix.cloud_service` = "web-service"
- `matrix.timeout` = 10

They build and deploy simultaneously. What used to take 25 minutes sequentially now takes 15 minutes (the time of the slowest service).

## Hack #1: The "Deploy All" Button

Adding this is simple but incredibly useful:

```yaml
inputs:
  deploy_all:
    description: "Deploy all services"
    type: boolean
    default: false
```

Then in your script:
```bash
if [ "${{ inputs.deploy_all }}" == "true" ]; then
  DEPLOY_SERVICES=("api" "web" "worker" "scheduler")  # All services
else
  # Individual selections
  [ "${{ inputs.deploy_api }}" == "true" ] && DEPLOY_SERVICES+=("api")
  [ "${{ inputs.deploy_web }}" == "true" ] && DEPLOY_SERVICES+=("web")
fi
```

Now developers have a quick "deploy everything" option for initial environment setup or major releases.

**Pro tip**: Set `default: false` to prevent accidental full deployments. Make people intentionally check the box.

## Hack #2: Smart Concurrency Control

Here's a problem: What happens when two developers try to deploy to the same environment at the same time?

**Bad approach**: Cancel the first deployment
```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true  # DON'T DO THIS
```

This causes chaos. Developer A starts a deployment, then Developer B starts one, and A's deployment gets killed mid-flight. Nobody's happy.

**Good approach**: Queue deployments
```yaml
concurrency:
  group: deploy-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false  # Queue instead of cancel
```

Now when B triggers a deployment while A's is running, B's deployment waits in line. Both complete successfully.

**Even better approach**: Per-service concurrency

What if A is deploying the API and B wants to deploy the web app? They're not conflicting, so they should run in parallel!

```yaml
concurrency:
  group: deploy-${{ github.workflow }}-${{ matrix.name }}-${{ github.ref }}
  cancel-in-progress: false
```

Now the concurrency group includes the service name. API and web deployments can run simultaneously, but two API deployments will queue.

## Hack #3: Validation Before Deployment

Here's something that saved us from many mistakes:

```bash
# In the prepare job
if [ ${#DEPLOY_SERVICES[@]} -eq 0 ]; then
  echo "::error::No services selected. Check at least one service or 'Deploy all'."
  exit 1
fi
```

This fails fast if someone clicks "Run workflow" without selecting anything. The error message appears immediately in the GitHub UI:

```
❌ No services selected. Check at least one service or 'Deploy all'.
```

No wasted time waiting for jobs to spin up.

**Bonus validation**: Check if services exist
```bash
for service in "${DEPLOY_SERVICES[@]}"; do
  found=false
  for config in "${SERVICES[@]}"; do
    IFS=':' read -r name _ _ _ <<< "$config"
    if [ "$name" == "$service" ]; then
      found=true
      break
    fi
  done

  if [ "$found" == false ]; then
    echo "::error::Unknown service: $service"
    echo "::error::Valid services: api, web"
    exit 1
  fi
done
```

## Hack #4: Beautiful Summary Output

GitHub Actions has a built-in summary feature that most people don't use. Here's how to make your deployments look professional:

```bash
# At the end of prepare job
echo "### 🚀 Deployment Plan for ${{ env.ENVIRONMENT }}" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "**Project**: \`${{ env.GCP_PROJECT }}\`" >> $GITHUB_STEP_SUMMARY
echo "**Region**: \`${{ env.GCP_REGION }}\`" >> $GITHUB_STEP_SUMMARY
echo "**Services**: ${#DEPLOY_SERVICES[@]}" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "| Service | Status |" >> $GITHUB_STEP_SUMMARY
echo "|---------|--------|" >> $GITHUB_STEP_SUMMARY
for service in "${DEPLOY_SERVICES[@]}"; do
  echo "| $service | ⏳ Pending |" >> $GITHUB_STEP_SUMMARY
done
```

This creates a nice table in the Actions UI that everyone can see at a glance.

## Hack #5: Conditional Steps Within Jobs

Sometimes services need slightly different handling. Here's how to handle that without creating separate jobs:

```yaml
- name: Run database migrations
  if: matrix.name == 'api'
  run: |
    echo "Running migrations for API..."
    npm run migrate

- name: Build static assets
  if: matrix.name == 'web'
  run: |
    echo "Building frontend assets..."
    npm run build

- name: Common deployment step
  run: |
    echo "Deploying ${{ matrix.name }}..."
    # This runs for all services
```

The `if` condition makes steps service-specific without duplicating the entire job.

## Hack #6: Smart Timeout Management

Different services take different times to deploy. The API might build in 5 minutes, but the web app takes 15 because it needs to compile assets.

Instead of using a global timeout, make it service-specific:

```yaml
timeout-minutes: ${{ matrix.timeout }}
```

Then in your service definitions:
```bash
SERVICES=(
  "api:services/api/Dockerfile:api-service:5"    # 5 minute timeout
  "web:services/web/Dockerfile:web-service:15"   # 15 minute timeout
)
```

Now each service gets the timeout it needs. Fast services fail fast, slow services get time to complete.

## Hack #7: Emergency Stop Button

Add an input to skip deployment and only run validation:

```yaml
inputs:
  dry_run:
    description: "Dry run (validate only, don't deploy)"
    type: boolean
    default: false
```

Then in deployment steps:
```yaml
- name: Deploy to Cloud Run
  if: inputs.dry_run == false
  run: |
    gcloud run deploy ...

- name: Dry run summary
  if: inputs.dry_run == true
  run: |
    echo "### 🧪 Dry Run Complete" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo "Would deploy ${{ matrix.name }} to ${{ env.ENVIRONMENT }}" >> $GITHUB_STEP_SUMMARY
    echo "Image: gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
```

Perfect for verifying your workflow changes without actually deploying anything.

## Hack #8: Fail-Fast Toggle

Sometimes you want to stop everything if one service fails. Other times, you want to deploy what you can and deal with failures later:

```yaml
inputs:
  fail_fast:
    description: "Stop all deployments if one fails"
    type: boolean
    default: false

# Then in the deploy job:
strategy:
  fail-fast: ${{ inputs.fail_fast }}
  matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}
```

Now you control the behavior per-deployment instead of hardcoding it.

## Hack #9: Previous Version Rollback

This is a game-changer. Add an optional input for deploying a specific image tag:

```yaml
inputs:
  image_tag:
    description: "Deploy specific image tag (leave empty for latest)"
    type: string
    required: false
```

Then in the deployment:
```yaml
- name: Determine image tag
  id: tag
  run: |
    if [ -n "${{ inputs.image_tag }}" ]; then
      echo "tag=${{ inputs.image_tag }}" >> $GITHUB_OUTPUT
      echo "Using manual tag: ${{ inputs.image_tag }}" >> $GITHUB_STEP_SUMMARY
    else
      echo "tag=${{ github.sha }}" >> $GITHUB_OUTPUT
      echo "Using commit SHA: ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
    fi

- name: Deploy
  run: |
    gcloud run deploy ${{ matrix.cloud_service }} \
      --image gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:${{ steps.tag.outputs.tag }}
```

Now when production breaks, you can instantly rollback:
1. Go to Actions
2. Run workflow
3. Select the broken service
4. Enter the previous good image tag
5. Deploy

No messing with git reverts or emergency hotfix branches.

## Hack #10: Build Cache for Speed

Docker builds are slow. Here's how to make them significantly faster:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Cache Docker layers
  uses: actions/cache@v4
  with:
    path: /tmp/.buildx-cache-${{ matrix.name }}
    key: ${{ runner.os }}-${{ matrix.name }}-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-${{ matrix.name }}-

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ${{ matrix.dockerfile }}
    push: true
    tags: gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:${{ github.sha }}
    cache-from: type=local,src=/tmp/.buildx-cache-${{ matrix.name }}
    cache-to: type=local,dest=/tmp/.buildx-cache-${{ matrix.name }}-new

- name: Move cache
  run: |
    rm -rf /tmp/.buildx-cache-${{ matrix.name }}
    mv /tmp/.buildx-cache-${{ matrix.name }}-new /tmp/.buildx-cache-${{ matrix.name }}
```

Notice the per-service cache path: `/tmp/.buildx-cache-${{ matrix.name }}`. This is crucial! If all services shared one cache, parallel builds would corrupt each other.

## The Complete Example

Here's everything put together with all the hacks:

```yaml
name: Deploy to Dev Environment

env:
  ENVIRONMENT: dev
  GCP_PROJECT: myapp-dev
  GCP_REGION: us-central1

on:
  workflow_dispatch:
    inputs:
      deploy_all:
        description: "🚀 Deploy all services"
        type: boolean
        default: false
      deploy_api:
        description: "📡 Deploy API service"
        type: boolean
        default: false
      deploy_web:
        description: "🌐 Deploy web app"
        type: boolean
        default: false
      fail_fast:
        description: "⚡ Stop all if one fails"
        type: boolean
        default: false
      dry_run:
        description: "🧪 Dry run (validate only)"
        type: boolean
        default: false
      image_tag:
        description: "🏷️  Custom image tag (for rollback)"
        type: string
        required: false

# Queue deployments per service
concurrency:
  group: deploy-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false

jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.generate.outputs.matrix }}
      count: ${{ steps.generate.outputs.count }}
      tag: ${{ steps.generate.outputs.tag }}
    steps:
      - name: Generate deployment matrix
        id: generate
        run: |
          # Service configurations
          # Format: name:dockerfile:cloud_service:timeout
          declare -A SERVICES=(
            ["api"]="services/api/Dockerfile:api-service:15"
            ["web"]="services/web/Dockerfile:web-service:10"
          )

          # Determine what to deploy
          DEPLOY=()
          if [ "${{ inputs.deploy_all }}" == "true" ]; then
            DEPLOY=("api" "web")
          else
            [ "${{ inputs.deploy_api }}" == "true" ] && DEPLOY+=("api")
            [ "${{ inputs.deploy_web }}" == "true" ] && DEPLOY+=("web")
          fi

          # Validation
          if [ ${#DEPLOY[@]} -eq 0 ]; then
            echo "::error::No services selected!"
            exit 1
          fi

          # Build matrix JSON
          MATRIX='{"include":['
          FIRST=true
          for svc in "${DEPLOY[@]}"; do
            IFS=':' read -r dockerfile cloud_service timeout <<< "${SERVICES[$svc]}"
            [ "$FIRST" = false ] && MATRIX+=","
            MATRIX+="{\"name\":\"$svc\",\"dockerfile\":\"$dockerfile\",\"cloud_service\":\"$cloud_service\",\"timeout\":$timeout}"
            FIRST=false
          done
          MATRIX+=']}'

          # Outputs
          echo "matrix=$MATRIX" >> $GITHUB_OUTPUT
          echo "count=${#DEPLOY[@]}" >> $GITHUB_OUTPUT

          # Determine image tag
          TAG="${{ inputs.image_tag }}"
          if [ -z "$TAG" ]; then
            TAG="${{ github.sha }}"
          fi
          echo "tag=$TAG" >> $GITHUB_OUTPUT

          # Summary
          echo "### 🚀 Deployment Plan" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Environment**: ${{ env.ENVIRONMENT }}" >> $GITHUB_STEP_SUMMARY
          echo "**Project**: \`${{ env.GCP_PROJECT }}\`" >> $GITHUB_STEP_SUMMARY
          echo "**Image Tag**: \`$TAG\`" >> $GITHUB_STEP_SUMMARY
          echo "**Dry Run**: ${{ inputs.dry_run }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Service | Status |" >> $GITHUB_STEP_SUMMARY
          echo "|---------|--------|" >> $GITHUB_STEP_SUMMARY
          for svc in "${DEPLOY[@]}"; do
            echo "| $svc | ⏳ Pending |" >> $GITHUB_STEP_SUMMARY
          done

  build-and-deploy:
    needs: prepare
    runs-on: ubuntu-latest
    timeout-minutes: ${{ matrix.timeout }}
    strategy:
      fail-fast: ${{ inputs.fail_fast }}
      matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Cache Docker layers
        uses: actions/cache@v4
        with:
          path: /tmp/.buildx-cache-${{ matrix.name }}
          key: ${{ runner.os }}-${{ matrix.name }}-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-${{ matrix.name }}-

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:${{ needs.prepare.outputs.tag }}
            gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:latest
          cache-from: type=local,src=/tmp/.buildx-cache-${{ matrix.name }}
          cache-to: type=local,dest=/tmp/.buildx-cache-${{ matrix.name }}-new

      - name: Move cache
        run: |
          rm -rf /tmp/.buildx-cache-${{ matrix.name }}
          mv /tmp/.buildx-cache-${{ matrix.name }}-new /tmp/.buildx-cache-${{ matrix.name }}

      - name: Deploy to Cloud Run
        if: inputs.dry_run == false
        run: |
          gcloud run deploy ${{ matrix.cloud_service }} \
            --image gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:${{ needs.prepare.outputs.tag }} \
            --region ${{ env.GCP_REGION }} \
            --no-traffic

          gcloud run services update-traffic ${{ matrix.cloud_service }} \
            --to-latest \
            --region ${{ env.GCP_REGION }}

      - name: Dry run summary
        if: inputs.dry_run == true
        run: |
          echo "### 🧪 Dry Run: ${{ matrix.name }}" >> $GITHUB_STEP_SUMMARY
          echo "Would deploy: gcr.io/${{ env.GCP_PROJECT }}/${{ matrix.cloud_service }}:${{ needs.prepare.outputs.tag }}" >> $GITHUB_STEP_SUMMARY

  summary:
    needs: [prepare, build-and-deploy]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Deployment summary
        run: |
          echo "### ✅ Deployment Complete" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Deployed ${{ needs.prepare.outputs.count }} service(s) to **${{ env.ENVIRONMENT }}**" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY

          STATUS="${{ needs.build-and-deploy.result }}"
          if [ "$STATUS" == "success" ]; then
            echo "✅ All services deployed successfully" >> $GITHUB_STEP_SUMMARY
          else
            echo "❌ Some services failed (status: $STATUS)" >> $GITHUB_STEP_SUMMARY
          fi
```

## Creating Additional Environments

Now here's where it really pays off. To create a staging environment, copy the dev workflow:

```bash
cp .github/workflows/deploy-dev.yaml .github/workflows/deploy-staging.yaml
```

Then change just these lines:

```yaml
name: Deploy to Staging Environment  # Line 1

env:
  ENVIRONMENT: staging              # Line 4
  GCP_PROJECT: myapp-staging        # Line 5
```

That's it. Three lines. The entire deployment logic is identical—just the environment configuration changes.

For production:
```yaml
name: Deploy to Production Environment

env:
  ENVIRONMENT: production
  GCP_PROJECT: myapp-prod
```

Now you have three workflow files that can each deploy any combination of services, and they all share the same battle-tested deployment logic.

## What This Gets You

Let me show you the before and after:

**Before** (6 separate workflow files):
- Want to deploy API to dev? Run `deploy-api-dev.yaml`
- Want to deploy web to dev? Run `deploy-web-dev.yaml`
- Want to deploy both? Run two workflows, wait 20 minutes
- Want to change Docker build process? Edit 6 files
- Want to add a worker service? Create 3 new workflow files

**After** (3 consolidated workflows):
- Want to deploy API to dev? Check "API", click run
- Want to deploy web to dev? Check "Web", click run
- Want to deploy both? Check both, click run, done in 10 minutes (parallel!)
- Want to change Docker build process? Edit 3 files (or just dev, test, copy to others)
- Want to add a worker service? Add 3 lines to one section of each file

## The "Oh Shit" Moment

The real test came three weeks after we rolled this out. We pushed a bug to production that broke the API. In the old world, rolling back meant:
1. Revert the commit (5 minutes of git confusion)
2. Wait for CI to build (10 minutes)
3. Deploy via workflow (8 minutes)
4. Total: 23 minutes of panic

With the new system:
1. Go to Actions
2. Select "Deploy to Production"
3. Check "API"
4. Enter the last good image tag in "Custom image tag"
5. Click "Run"
6. Done in 6 minutes

The difference between 23 minutes and 6 minutes when your API is down? That's the difference between annoyed users and lost users.

## Things I Wish Someone Had Told Me

**1. Start with just two services**

Don't try to consolidate everything at once. Pick your two most frequently deployed services and consolidate just those. Learn what works, refine the approach, then expand.

**2. The matrix JSON is finicky**

If your matrix JSON is malformed, you'll get cryptic errors. I ended up writing a helper script to validate it:

```bash
# Test your matrix generation
echo "$MATRIX" | jq . || echo "Invalid JSON!"
```

**3. Per-service caching is non-negotiable**

I learned this the hard way. When we first tried parallel builds with a shared cache, we got the weirdest intermittent failures. Caches would get corrupted, builds would fail randomly. Switching to per-service caches (`/tmp/.buildx-cache-${{ matrix.name }}`) solved it immediately.

**4. Concurrency groups need thought**

Our first attempt used `group: ${{ github.workflow }}` which meant only one deployment could run across all branches. Someone deploying to dev would block someone deploying to staging. Adding the ref made it per-branch: `group: ${{ github.workflow }}-${{ github.ref }}`.

**5. Emojis in input descriptions are a small joy**

This is silly, but it makes the UI so much nicer:
```yaml
deploy_api:
  description: "📡 Deploy API service"
```

Those little emojis make the workflow feel polished and easier to scan.

## When This Doesn't Work

This approach isn't a silver bullet. Here are cases where separate workflows still make sense:

**Different deployment platforms**: If one service deploys to Kubernetes and another to serverless, the deployment logic is too different. Keep them separate.

**Different access controls**: If different teams own different services and you need separate approval flows, separate workflows give you cleaner permission boundaries.

**Completely different build processes**: If one service is a compiled Go binary and another is a Node.js app with a complex frontend build, forcing them into one workflow might be more confusing than helpful.

**Automatic deployments**: If you want to auto-deploy on git push for specific services, individual workflows with path filters work better:
```yaml
on:
  push:
    paths:
      - 'services/api/**'
```

## The Bottom Line

Consolidated workflows aren't about being clever. They're about reducing cognitive load. When deployments are simple and predictable, people deploy more confidently and more frequently. And frequent, confident deployments lead to faster iteration and fewer bugs.

The time investment to set this up—maybe a day or two—pays back within the first month. After that, it's pure profit in the form of time saved and mistakes avoided.

If you're maintaining multiple similar workflows right now, take a Saturday afternoon and try consolidating two of them. You'll know within an hour if it's working for your setup. And if it does work, you'll wonder why you didn't do this sooner.

---

*Written by a developer who's tired of copying workflow files. These examples are simplified for clarity, but the techniques are battle-tested in production. Your mileage may vary, but the principles are sound.*

*If you build something cool based on this, I'd love to hear about it. And if you find a bug in my matrix JSON, please be gentle—it took me three tries to get it right.*
