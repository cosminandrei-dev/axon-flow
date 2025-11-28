# GitHub Repository Configuration

This document describes the required secrets and variables for the Axon Flow CI/CD pipeline.

## Required Secrets

Configure these in **Settings > Secrets and variables > Actions > Secrets**:

| Secret | Required | Description |
|--------|----------|-------------|
| `TURBO_TOKEN` | Optional | Vercel remote cache token for Turborepo. Enables remote caching to speed up CI builds. |

### Obtaining TURBO_TOKEN

1. Create a Vercel account at https://vercel.com
2. Go to **Account Settings > Tokens**
3. Create a new token with a descriptive name (e.g., `axon-flow-turbo`)
4. Copy the token and add it as a repository secret

## Required Variables

Configure these in **Settings > Secrets and variables > Actions > Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `TURBO_TEAM` | Optional | Vercel team name for remote cache scope. Must match your Vercel team/account. |

### Setting TURBO_TEAM

1. If using a personal Vercel account, use your Vercel username
2. If using a Vercel team, use the team slug (found in team settings URL)

## CI Pipeline Overview

The CI pipeline runs on:
- Push to `main` branch
- Pull requests targeting `main`
- Manual trigger via `workflow_dispatch`

### Jobs

| Job | Depends On | Description |
|-----|------------|-------------|
| `setup` | - | Installs dependencies and caches pnpm store |
| `lint` | `setup` | Runs ESLint across all workspaces |
| `typecheck` | `setup` | Runs TypeScript type checking |
| `test` | `lint`, `typecheck` | Runs tests with PostgreSQL, Redis, RabbitMQ service containers |
| `build` | `test` | Builds all packages and apps |

### Service Containers (Test Job)

The test job spins up the following service containers:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| PostgreSQL | `postgres:18-alpine` | 5432 | Database for integration tests |
| Redis | `redis:8-alpine` | 6379 | Cache for integration tests |
| RabbitMQ | `rabbitmq:4-management-alpine` | 5672, 15672 | Message queue for integration tests |

## Performance Targets

| Metric | Target |
|--------|--------|
| Full CI pipeline | ≤10 minutes |
| Cache hit rate (cached run) | ≥80% |

## Troubleshooting

### Turbo Remote Caching Not Working

1. Verify `TURBO_TOKEN` secret is set correctly
2. Verify `TURBO_TEAM` variable matches your Vercel team/username
3. Check CI logs for "Remote caching enabled" message

### Service Container Health Check Failures

If tests fail due to service containers not being ready:
1. Check the health check logs in the GitHub Actions UI
2. Service containers have built-in health checks with retries
3. PostgreSQL: `pg_isready` (5 retries, 10s interval)
4. Redis: `redis-cli ping` (5 retries, 10s interval)
5. RabbitMQ: `rabbitmqctl status` (5 retries, 30s interval)

### Build Failures

1. Ensure all TypeScript errors are resolved locally (`pnpm typecheck`)
2. Ensure all lint errors are resolved locally (`pnpm lint`)
3. Ensure all tests pass locally (`pnpm test`)
4. Check that `pnpm build` succeeds locally

## Dependabot Configuration

Dependabot is configured to automatically create PRs for dependency updates.

### Update Schedule

All ecosystems are checked weekly on Mondays at 09:00 UTC.

### Ecosystems

| Ecosystem | Directory | PR Limit | Description |
|-----------|-----------|----------|-------------|
| `github-actions` | `/` | 5 | GitHub Actions workflow dependencies |
| `npm` | `/` | 10 | Node.js packages across all workspaces |
| `docker-compose` | `/docker` | 3 | Docker image versions |

### Dependency Groups

npm dependencies are grouped to reduce PR noise:

| Group | Patterns | Description |
|-------|----------|-------------|
| `typescript` | `typescript*`, `@typescript-eslint/*` | TypeScript compiler and ESLint plugins |
| `testing` | `vitest*`, `@testing-library/*`, `supertest*` | Testing frameworks |
| `eslint` | `eslint*`, `eslint-plugin-*` | ESLint and plugins |
| `nestjs` | `@nestjs/*` | NestJS framework packages |
| `graphql` | `graphql*`, `@apollo/*` | GraphQL and Apollo packages |
| `build` | `turbo*`, `tsx*` | Build tooling |

### Commit Message Prefixes

| Ecosystem | Prefix |
|-----------|--------|
| GitHub Actions | `ci:` |
| npm | `deps:` |
| Docker | `docker:` |

### Managing Dependabot

- View Dependabot PRs: **Pull requests > Labels > dependencies**
- Disable for a package: Add to `ignore` list in `dependabot.yml`
- Change schedule: Edit `schedule.interval` in `dependabot.yml`
