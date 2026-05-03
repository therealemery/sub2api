# ownapi

ownapi is a production-oriented AI API relay and quota management platform. It provides user API keys, upstream account pooling, billing, subscriptions, concurrency and rate limits, usage tracking, payments, and an admin console.

## Features

- Upstream account pools for OpenAI, Anthropic, Gemini, Antigravity, and compatible providers.
- API Key, OAuth, Setup Token, AWS Bedrock, and Google Vertex Service Account upstream credentials.
- User-facing API keys for unified gateway access.
- Balance billing, subscription plans, group multipliers, concurrency limits, and RPM limits.
- Admin console for accounts, groups, users, usage, payments, monitoring, and system settings.
- Docker-first deployment for fast launch and migration.

## Quick Launch

1. Copy deployment settings:

```bash
cd deploy
cp .env.example .env
```

2. Edit `.env`:

```env
APP_IMAGE=your-registry/ownapi:latest
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-strong-password
JWT_SECRET=generate-with-openssl-rand-hex-32
TOTP_ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
POSTGRES_PASSWORD=strong-database-password
REDIS_PASSWORD=strong-redis-password
UPDATE_GITHUB_REPO=
```

`UPDATE_GITHUB_REPO` is empty by default, which disables online update checks and one-click updates. Set it to `your-org/ownapi` only after your own release pipeline is ready.

3. Start:

```bash
docker compose up -d
docker compose logs -f ownapi
```

4. In the admin console:

- Configure site name, logo, API base URL, and docs URL.
- Add OpenAI, Anthropic, Gemini, or compatible upstream accounts.
- Create groups with model allowlists, billing multipliers, concurrency, and RPM limits.
- Create a test user and API key.
- Run a small payment test if payments are enabled.
- Verify `/v1/messages`, `/v1/chat/completions`, `/v1/responses`, and `/v1beta/models/...`.

## Reverse Proxy Notes

For Nginx:

```nginx
underscores_in_headers on;
proxy_buffering off;
proxy_read_timeout 600s;
proxy_send_timeout 600s;
```

Make sure streaming responses and WebSocket connections are not buffered by your proxy/CDN.

## License

This project is licensed under LGPLv3. When distributing modified binaries or container images, preserve the license and provide the corresponding source or modified source as required by LGPLv3.
