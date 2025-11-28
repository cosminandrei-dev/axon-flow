# Docker Development Stack

Local development infrastructure for Axon Flow.

## Prerequisites

- Docker 24.x or later

## Quick Start

```bash
# Start all services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down

# Reset (clears all data)
pnpm docker:reset
```

## Services

| Service    | Port(s)      | Description                    |
| ---------- | ------------ | ------------------------------ |
| PostgreSQL | 5432         | Primary database               |
| Redis      | 6379         | Cache and session storage      |
| RabbitMQ   | 5672, 15672  | Message queue (AMQP + Web UI)  |

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp docker/.env.example docker/.env.local
   ```

2. Edit `docker/.env.local` with your passwords (defaults work for local dev)

## Connection Details

### PostgreSQL

- Host: `localhost`
- Port: `5432`
- Database: `axon_flow_dev`
- User: `axon`
- Password: from `POSTGRES_PASSWORD` in `.env.local`

### Redis

- Host: `localhost`
- Port: `6379`
- No authentication (dev mode)

### RabbitMQ

- AMQP: `localhost:5672`
- Management UI: http://localhost:15672
- User: `axon`
- Password: from `RABBITMQ_DEFAULT_PASS` in `.env.local`

## Health Checks

All services include health checks. View status:

```bash
docker compose -f docker/docker-compose.yml ps
```

All containers should show "healthy" status after startup.

## Data Persistence

Data is stored in named volumes:
- `pgdata` - PostgreSQL data
- `redisdata` - Redis data
- `rabbitmqdata` - RabbitMQ data

Data persists across `docker:down` / `docker:up` cycles.

Use `docker:reset` to clear all data and start fresh.
