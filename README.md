# forgejo-runner-broker

A lightweight broker for Forgejo Actions runners with preferred/fallback routing.

This service sits in front of Forgejo runner endpoints and decides which runners are allowed to fetch jobs. It is built for simple self-hosted setups where you want predictable failover behavior, environment-based configuration, and no database.

## Features

- Preferred and fallback runner routing
- Multiple preferred and fallback runner UUIDs via comma-separated env vars
- No database or migrations
- Nitro-based backend-only application
- Simple Docker deployment
- Read-only inspection endpoints for config and discovered runners

## How it works

The broker proxies Forgejo runner API requests and tracks runners in memory by UUID.

Typical behavior:

- Preferred runners are allowed to fetch tasks normally
- Fallback runners are blocked from fetching while any preferred runner is still considered alive
- Unassigned runners can be allowed or blocked with configuration
- Runner discovery resets on restart because no state is persisted

## Environment

Example configuration:

```env
NITRO_FORGEJO_BASE_URL=http://forgejo:3000
NITRO_PREFERRED_RUNNER_UUIDS=uuid-1,uuid-2
NITRO_FALLBACK_RUNNER_UUIDS=uuid-3,uuid-4
NITRO_PREFERRED_RUNNER_TTL_SECONDS=15
NITRO_BLOCK_UNASSIGNED_RUNNERS=false
NITRO_TRUST_X_FORWARDED_FOR=true
NITRO_LOG_LEVEL=info
```

## Endpoints

- `GET /health` — liveness check
- `GET /api/config` — effective runtime config
- `GET /api/runners` — currently discovered runners
- `POST /api/actions/**` — proxied Forgejo runner API
- `POST /api/internal/actions/**` — proxied internal runner API

## Examples

- [Docker Compose example](./docker-compose.example.yaml)
- [NGINX reverse proxy example](./docs/examples/nginx.md)

## Use case

This is useful when you run multiple Forgejo runners but want one group to take jobs first, while another group acts as standby capacity.

Examples:

- A fast local runner as preferred, remote VPS runners as fallback
- Low-power always-on machines as preferred, bigger on-demand machines as fallback
- Dedicated stable runners first, generic shared runners only when needed

## Docker

Run the published image with your environment variables and place it in front of your Forgejo runner endpoints.

Example image names:

- `bestnub/forgejo-runner-broker`

## Notes

- Configuration is fully environment-driven
- Runner metadata is stored in memory only
- Preferred/fallback matching is based on runner UUIDs
- Preferred runners always win over fallback runners
- If the broker restarts, discovered runner state is rebuilt from incoming traffic

## Source

GitHub: https://github.com/bestnub/forgejo-runner-broker
