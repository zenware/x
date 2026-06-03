# Glean Backend (Skeleton)

Minimal Go backend for case/seed ingestion, graph retrieval, and mock enrichment.

## Run

```bash
cd glean/backend
go run .
```

Server defaults to `:8088` (override with `ADDR` or `GLEAN_BACKEND_PORT`).

## Test

```bash
cd glean/backend
go test ./...
```

## API

- `GET /health`
- `GET /docs`
- `GET /openapi.json`
- `POST /api/v1/cases`
- `POST /api/v1/cases/{caseId}/seeds`
- `GET /api/v1/cases/{caseId}/graph?depth=1`

The backend serves permissive local-dev CORS for loopback origins (`localhost`, `127.0.0.1`, and other loopback IPs). Override or extend explicit allowed origins with `GLEAN_ALLOWED_ORIGINS`, using a comma-separated list.
