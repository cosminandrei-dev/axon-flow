# GitHub Actions Workflows

This directory contains GitHub Actions workflow definitions for the Axon Flow project.

## Workflows

### ci.yml - Continuous Integration

The main CI pipeline that runs on every push and pull request to `main`.

#### Trigger Events

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Manual trigger
```

#### Job Flow

```
┌────────────┐
│   Setup    │
│ (checkout, │
│  install)  │
└──────┬─────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌──────┐ ┌──────────┐
│ Lint │ │Typecheck │  (parallel)
└──┬───┘ └────┬─────┘
   │          │
   └────┬─────┘
        │
        ▼
   ┌─────────┐
   │  Test   │
   │(Docker  │
   │services)│
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │  Build  │
   └─────────┘
```

#### Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `TURBO_TOKEN` | Secret | Vercel remote cache authentication |
| `TURBO_TEAM` | Variable | Vercel team for cache scope |
| `DATABASE_URL` | Hardcoded | Test database connection string |
| `REDIS_URL` | Hardcoded | Test Redis connection string |
| `RABBITMQ_URL` | Hardcoded | Test RabbitMQ connection string |
| `NODE_ENV` | Hardcoded | Set to `test` for test job |

#### Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

- Groups concurrent runs by workflow and branch
- Cancels in-progress runs for non-main branches (saves CI minutes)
- Never cancels runs on `main` branch

## Setup Instructions

### 1. Configure Repository Secrets

Go to **Settings > Secrets and variables > Actions > Secrets** and add:

- `TURBO_TOKEN` (optional): Vercel API token for remote caching

### 2. Configure Repository Variables

Go to **Settings > Secrets and variables > Actions > Variables** and add:

- `TURBO_TEAM` (optional): Your Vercel team name or username

### 3. Enable Turbo Remote Caching (Optional but Recommended)

1. Sign up at https://vercel.com
2. Create a token at **Account Settings > Tokens**
3. Add the token as `TURBO_TOKEN` secret
4. Add your team/username as `TURBO_TEAM` variable

### 4. Verify CI Works

1. Create a new branch
2. Make a small change (e.g., update a comment)
3. Push and open a PR
4. Verify all CI jobs pass

## Manual Trigger

To manually trigger the CI workflow:

1. Go to **Actions > CI**
2. Click **Run workflow**
3. Select the branch
4. Click **Run workflow**

Or via GitHub CLI:

```bash
gh workflow run ci.yml --ref main
```

## Test Approach

### Workflow YAML Validation

The CI workflow structure is validated by automated tests in `tooling/testing/ci/__tests__/`.

Tests verify:
- All required jobs are defined (setup, lint, typecheck, test, build)
- Job dependencies are correct
- Service containers are configured
- Turbo caching is enabled
- Concurrency configuration is correct

### Manual Validation Checklist

| Check | How to Verify |
|-------|---------------|
| CI triggers on PR | Open a PR and check Actions tab |
| CI triggers on push to main | Merge a PR and check Actions tab |
| Manual trigger works | Use workflow_dispatch |
| Lint fails on errors | Introduce a lint error and push |
| Typecheck fails on errors | Introduce a type error and push |
| Tests run with services | Check test job logs for service containers |
| Turbo caching works | Check logs for "Remote caching enabled" |
| CI completes in ≤10 min | Check total workflow duration |

## Extending the Workflow

### Adding a New Job

```yaml
new-job:
  name: New Job
  runs-on: ubuntu-latest
  needs: [setup]  # Adjust dependencies as needed
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10
    - uses: actions/setup-node@v4
      with:
        node-version: "24"
        cache: "pnpm"
    - run: pnpm install --frozen-lockfile
    - run: pnpm your-command
```

### Adding Environment-Specific Workflows

Create new files like:
- `deploy-staging.yml` - Deploy to staging
- `deploy-production.yml` - Deploy to production
- `release.yml` - Create releases
