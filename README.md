# Axon Flow

Hub-centric AI automation platform that transforms natural-language goals into reliable, observable, multi-agent workflows.

## Current Status

> **🚧 Foundation Phase (Epic 0)** - Core infrastructure established. Authentication module in review, API gateway ready for development.

**Completed:**
- [x] Story 0-1: Turborepo monorepo structure (15 workspaces)
- [x] Story 0-2: Shared TypeScript and ESLint configuration
- [x] Story 0-3: Docker Compose development stack (PostgreSQL, Redis, RabbitMQ)
- [x] Story 0-4: Database package with Drizzle ORM and core schema

**In Progress:**
- [ ] Story 0-5: Auth package with Auth.js integration (in review)
- [ ] Story 0-6: NestJS API Gateway skeleton (ready for dev)
- [ ] Story 0-7: GitHub Actions CI pipeline
- [ ] Story 0-8: Observability package
- [ ] Story 0-9: Dashboard shell (Next.js)

## Quick Start

### Prerequisites

| Tool    | Version  | Purpose         |
| ------- | -------- | --------------- |
| Node.js | 24.x LTS | Runtime         |
| pnpm    | 10.x     | Package manager |
| Docker  | 24.x     | Local services  |

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/axon-flow.git
cd axon-flow

# Install dependencies
pnpm install

# Start development
pnpm dev
```

## Available Scripts

| Script          | Description                        |
| --------------- | ---------------------------------- |
| `pnpm dev`      | Start all apps in development mode |
| `pnpm build`    | Build all packages and apps        |
| `pnpm lint`     | Lint entire monorepo               |
| `pnpm typecheck`| TypeScript type checking           |
| `pnpm test`     | Run all tests                      |

## Project Structure

```
axon-flow/
├── apps/
│   ├── web/           # Next.js dashboard
│   ├── api/           # NestJS API Gateway
│   └── hub/           # NestJS Hub Orchestrator
├── packages/
│   ├── database/      # Drizzle schema, migrations
│   ├── contracts/     # GraphQL schema, event types
│   ├── auth/          # JWT utilities, guards
│   ├── observability/ # Logging, tracing, metrics
│   ├── queue/         # RabbitMQ client
│   ├── llm/           # LLM provider abstraction
│   ├── ui/            # Shared React components
│   ├── config/        # Environment validation
│   └── billing/       # Stripe integration
├── services/
│   └── agent-runtime/ # Agent container runtime
├── tooling/           # Shared configs (@repo/eslint-config, @repo/typescript-config)
└── docker/            # Docker Compose files
```

## Turborepo Remote Caching

Turborepo supports remote caching to share build artifacts across machines and CI pipelines, significantly reducing build times.

### Setup Remote Caching

#### Option 1: Vercel Remote Cache (Recommended)

1. **Link to Vercel:**
   ```bash
   npx turbo login
   npx turbo link
   ```

2. **For CI/CD, set environment variables:**
   ```bash
   TURBO_TOKEN=<your-vercel-token>
   TURBO_TEAM=<your-team-slug>
   ```

#### Option 2: Self-Hosted Remote Cache

For self-hosted options, see the [Turborepo Remote Cache documentation](https://turbo.build/repo/docs/core-concepts/remote-caching#self-hosting).

### Verify Remote Caching

```bash
# Run build and check for cache hits
pnpm build

# Output should show "cache hit" for unchanged packages:
# @repo/config:build: cache hit, replaying output...
```

### Environment Variables

| Variable      | Description                         | Required |
| ------------- | ----------------------------------- | -------- |
| `TURBO_TOKEN` | Vercel authentication token         | For CI   |
| `TURBO_TEAM`  | Vercel team slug or account name    | For CI   |
| `TURBO_REMOTE_CACHE_SIGNATURE_KEY` | For self-hosted caches | Optional |

### Disable Remote Caching

To disable remote caching temporarily:

```bash
turbo build --remote-cache=false
```

Or set in your environment:
```bash
TURBO_REMOTE_CACHE_READ_ONLY=true  # Read from cache but don't write
```

## Documentation

- [Architecture](docs/architecture.md) - Technical decisions and patterns
- [PRD](docs/prd.md) - Product requirements
- [Epics Overview](docs/epics-overview.md) - Implementation roadmap

## License

Proprietary - All rights reserved
