# Glean Frontend (Alpha Core)

TypeScript + React app shell for the alpha investigation loop.

## Requirements

- Node.js 20+

## Run

```bash
cd glean/frontend
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test:unit
```

## API base URL

The app reads `NEXT_PUBLIC_API_BASE_URL` and defaults to `http://localhost:8088`.

Examples:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev
```

Flows implemented:

- Create case + ingest seed (`POST /api/v1/cases`, `POST /api/v1/cases/{caseId}/seeds`)
- Fetch depth-1 graph (`GET /api/v1/cases/{caseId}/graph?depth=1`)
- Node inspector with provenance fields + raw JSON
