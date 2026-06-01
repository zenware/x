# Install Forge

Forge is currently a single-user, self-hosted alpha focused on local repositories, `jj`-first browsing, change requests, local CI, and artifact storage.

## Requirements

- Nix + `devenv`
- `git`
- `jj` if you want the `jj` provider

## Development setup

1. Enter the project environment from the monorepo root:

   ```bash
   devenv shell
   ```

2. Start Forge from `forge/`:

   ```bash
   cd forge
   make run
   ```

3. Open `http://localhost:3000/login`

4. Sign in with the single-user alpha password:

   - default password: `admin`
   - override with `FORGE_ADMIN_PASSWORD`

## Configuration

Forge uses environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `FORGE_HOST` | `localhost` | Bind host |
| `FORGE_PORT` | `3000` | Bind port |
| `FORGE_DATA_DIR` | `./data` | SQLite database and artifact storage |
| `FORGE_ADMIN_PASSWORD` | `admin` | Single-user login password |
| `FORGE_POLL_INTERVAL_SECONDS` | `30` | Repository polling interval for automatic CI runs |

Example:

```bash
FORGE_ADMIN_PASSWORD=secret FORGE_POLL_INTERVAL_SECONDS=10 make run
```

## First run

1. Open **Settings**
2. Register a local repository path
3. If the repo contains `.forge/pipeline.yml`, Forge imports its pipelines automatically
4. Visit the repo overview, revision log, change requests, and pipelines screens

## Test and build

```bash
cd forge
make test
make build
```
