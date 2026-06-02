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
- `POST /api/v1/cases`
- `POST /api/v1/cases/{caseId}/seeds`
- `GET /api/v1/cases/{caseId}/graph?depth=1`
