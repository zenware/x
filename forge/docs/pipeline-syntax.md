# Pipeline syntax

Forge loads CI definitions from `.forge/pipeline.yml`.

## Single pipeline

```yaml
name: default
steps:
  - name: test
    command: go test ./...
  - name: build
    command: go build ./...
    artifacts:
      - bin/*
```

## Multiple pipelines

```yaml
pipelines:
  - name: lint
    steps:
      - name: lint
        command: golangci-lint run

  - name: test
    steps:
      - name: test
        command: go test ./...
        artifacts:
          - coverage.out
```

## Fields

### Pipeline

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes for explicit pipeline entries | Defaults to `default` for the top-level single-pipeline form |
| `steps` | yes | Ordered list of steps |

### Step

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | Display name in the UI |
| `command` | yes | Executed with `/bin/sh -c` from the repository root |
| `artifacts` | no | Glob patterns collected after the step succeeds |

## Import and re-sync

- Forge imports `.forge/pipeline.yml` when a repository is registered.
- If you edit the file later, use **Settings → Sync pipelines** to refresh the stored definitions.

## Execution model

- Steps run sequentially.
- Output from each step is captured as job logs.
- If a step fails, the pipeline run stops immediately and the run is marked failed.
- Artifact patterns are expanded relative to the repository root.
