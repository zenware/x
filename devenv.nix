{ pkgs, ... }:
let
  gleanRoot = "glean";
  backendDir = "${gleanRoot}/backend";
  frontendDir = "${gleanRoot}/frontend";
  legacyFrontendDir = "${gleanRoot}/app";
  dbName = "glean";
  dbUser = "glean";
  dbPassword = "glean_dev_password";
  dbHost = "127.0.0.1";
  dbPort = 5432;
  backendPort = 8088;
  frontendPort = 3000;
in
{
  # Shared environment variables for scripts, processes, and app runtime.
  env = {
    GLEAN_ROOT = gleanRoot;
    GLEAN_BACKEND_DIR = backendDir;
    GLEAN_FRONTEND_DIR = frontendDir;
    GLEAN_DATABASE_HOST = dbHost;
    GLEAN_DATABASE_PORT = toString dbPort;
    GLEAN_DATABASE_NAME = dbName;
    GLEAN_DATABASE_USER = dbUser;
    GLEAN_DATABASE_PASSWORD = dbPassword;
    GLEAN_DATABASE_URL = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${toString dbPort}/${dbName}?sslmode=disable";
    GLEAN_BACKEND_PORT = toString backendPort;
    GLEAN_FRONTEND_PORT = toString frontendPort;
    NEXT_PUBLIC_API_BASE_URL = "http://localhost:${toString backendPort}";
    NEXT_PUBLIC_GRAPH_WS_URL = "ws://localhost:${toString backendPort}/ws";
  };

  # Language runtimes and toolchains.
  languages.go.enable = true;
  # Avoid custom rust-stable wrapper derivation issues on Darwin by using
  # pinned rust toolchain packages directly from nixpkgs.
  languages.rust.enable = false;
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    pnpm.enable = true;
  };

  # Core development CLI utilities.
  packages = with pkgs; [
    git
    jq
    openssl
    curl
    netcat
    air
    rustc
    cargo
    rustfmt
    clippy
    cargo-watch
    golangci-lint
    postgresql_16
    prettier
    eslint
    nixpkgs-fmt
  ];

  # Graph-ready local data service. PostgreSQL is used as the local graph/state backend
  # (via edge table + recursive queries), with pgvector enabled when available.
  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    listen_addresses = dbHost;
    port = dbPort;
    initialDatabases = [{ name = dbName; }];
    initialScript = ''
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${dbUser}') THEN
          CREATE ROLE ${dbUser} LOGIN PASSWORD '${dbPassword}';
        END IF;
      END
      $$;

      GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};

      \c ${dbName}

      CREATE SCHEMA IF NOT EXISTS glean AUTHORIZATION ${dbUser};
      ALTER SCHEMA glean OWNER TO ${dbUser};

      CREATE TABLE IF NOT EXISTS glean.nodes (
        id TEXT PRIMARY KEY,
        node_type TEXT NOT NULL,
        label TEXT NOT NULL,
        confidence NUMERIC NOT NULL DEFAULT 1.0,
        source TEXT NOT NULL DEFAULT 'seed',
        observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS glean.edges (
        id TEXT PRIMARY KEY,
        from_id TEXT NOT NULL REFERENCES glean.nodes(id) ON DELETE CASCADE,
        to_id TEXT NOT NULL REFERENCES glean.nodes(id) ON DELETE CASCADE,
        relation TEXT NOT NULL,
        confidence NUMERIC NOT NULL DEFAULT 1.0,
        observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        provenance JSONB NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE INDEX IF NOT EXISTS idx_edges_from_id ON glean.edges(from_id);
      CREATE INDEX IF NOT EXISTS idx_edges_to_id ON glean.edges(to_id);
      CREATE INDEX IF NOT EXISTS idx_nodes_type ON glean.nodes(node_type);

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
          CREATE EXTENSION IF NOT EXISTS vector;
        END IF;
      END
      $$;
    '';
  };

  # Long-running dev processes started via `devenv up`.
  processes.backend.exec = ''
    bash -lc '
      set -euo pipefail
      if [ -f "${backendDir}/go.mod" ]; then
        cd "${backendDir}"
        if [ -f ".air.toml" ]; then
          exec air
        else
          exec air -c <(cat <<EOF
          root = "."
          tmp_dir = ".air"
          [build]
          cmd = "go build -o ./.air/glean-backend ./..."
          bin = "./.air/glean-backend"
          include_ext = ["go"]
          exclude_dir = ["vendor", ".git", ".air"]
          delay = 300
          EOF
          )
        fi
      elif [ -f "${backendDir}/Cargo.toml" ]; then
        cd "${backendDir}"
        exec cargo watch -x "run"
      else
        echo "[glean-backend] No backend project found in ${backendDir}."
        echo "[glean-backend] Create Go (go.mod) or Rust (Cargo.toml) backend and rerun."
        exec sleep infinity
      fi
    '
  '';

  processes.frontend.exec = ''
    bash -lc '
      set -euo pipefail
      if [ -f "${frontendDir}/package.json" ]; then
        cd "${frontendDir}"
      elif [ -f "${legacyFrontendDir}/package.json" ]; then
        cd "${legacyFrontendDir}"
      else
        echo "[glean-frontend] No frontend package.json found in ${frontendDir} or ${legacyFrontendDir}."
        echo "[glean-frontend] Create a Next.js app and rerun."
        exec sleep infinity
      fi

      corepack enable >/dev/null 2>&1 || true
      if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile
      else
        pnpm install
      fi

      if jq -e ".scripts.dev" package.json >/dev/null; then
        exec pnpm dev -- --port "''${GLEAN_FRONTEND_PORT}" --hostname 0.0.0.0
      else
        echo "[glean-frontend] package.json is missing scripts.dev"
        exec sleep infinity
      fi
    '
  '';

  # Developer utility scripts.
  scripts.glean-init.exec = ''
    set -euo pipefail

    echo "==> Initializing Glean development environment"

    if [ ! -d "''${GLEAN_ROOT}" ]; then
      echo "Expected directory ./''${GLEAN_ROOT} not found."
      exit 1
    fi

    if [ ! -f "''${GLEAN_ROOT}/.env" ]; then
      if [ -f "''${GLEAN_ROOT}/.env.example" ]; then
        cp "''${GLEAN_ROOT}/.env.example" "''${GLEAN_ROOT}/.env"
        echo "Created ''${GLEAN_ROOT}/.env from .env.example"
      else
        echo "Missing ''${GLEAN_ROOT}/.env.example"
        exit 1
      fi
    fi

    if [ -f "''${GLEAN_FRONTEND_DIR}/package.json" ]; then
      (cd "''${GLEAN_FRONTEND_DIR}" && corepack enable >/dev/null 2>&1 || true && pnpm install)
    elif [ -f "''${GLEAN_ROOT}/app/package.json" ]; then
      (cd "''${GLEAN_ROOT}/app" && corepack enable >/dev/null 2>&1 || true && pnpm install)
    fi

    echo "==> Seeding local graph tables with sample entities"
    psql "''${GLEAN_DATABASE_URL}" <<SQL
    INSERT INTO glean.nodes (id, node_type, label, confidence, source, metadata)
    VALUES
      ('seed:acme.test', 'domain', 'acme.test', 1.0, 'glean-init', '{"seed":true}'),
      ('ip:203.0.113.10', 'ip', '203.0.113.10', 0.92, 'glean-init', '{"kind":"infrastructure"}'),
      ('email:ops@acme.test', 'email', 'ops@acme.test', 0.87, 'glean-init', '{"kind":"contact"}')
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      confidence = EXCLUDED.confidence,
      source = EXCLUDED.source,
      metadata = EXCLUDED.metadata;

    INSERT INTO glean.edges (id, from_id, to_id, relation, confidence, provenance)
    VALUES
      ('edge:domain-ip:1', 'seed:acme.test', 'ip:203.0.113.10', 'resolves_to', 0.92, '{"module":"seed"}'),
      ('edge:domain-email:1', 'seed:acme.test', 'email:ops@acme.test', 'registration_contact', 0.87, '{"module":"seed"}')
    ON CONFLICT (id) DO UPDATE SET
      relation = EXCLUDED.relation,
      confidence = EXCLUDED.confidence,
      provenance = EXCLUDED.provenance;
    SQL

    echo "==> Glean init complete"
  '';

  scripts.glean-test.exec = ''
    set -euo pipefail

    echo "==> Running Glean backend tests"
    if [ -f "''${GLEAN_BACKEND_DIR}/go.mod" ]; then
      (cd "''${GLEAN_BACKEND_DIR}" && go test ./...)
    elif [ -f "''${GLEAN_BACKEND_DIR}/Cargo.toml" ]; then
      (cd "''${GLEAN_BACKEND_DIR}" && cargo test --all --all-features)
    else
      echo "No backend test target found in ''${GLEAN_BACKEND_DIR}; skipping backend tests."
    fi

    echo "==> Running Glean frontend tests"
    if [ -f "''${GLEAN_FRONTEND_DIR}/package.json" ] && jq -e ".scripts.test" "''${GLEAN_FRONTEND_DIR}/package.json" >/dev/null; then
      (cd "''${GLEAN_FRONTEND_DIR}" && corepack enable >/dev/null 2>&1 || true && pnpm test)
    elif [ -f "''${GLEAN_FRONTEND_DIR}/package.json" ] && jq -e ".scripts[\"test:unit\"]" "''${GLEAN_FRONTEND_DIR}/package.json" >/dev/null; then
      (cd "''${GLEAN_FRONTEND_DIR}" && corepack enable >/dev/null 2>&1 || true && pnpm test:unit)
    elif [ -f "''${GLEAN_ROOT}/app/package.json" ] && jq -e ".scripts.test" "''${GLEAN_ROOT}/app/package.json" >/dev/null; then
      (cd "''${GLEAN_ROOT}/app" && corepack enable >/dev/null 2>&1 || true && pnpm test)
    else
      echo "No frontend test script found; skipping frontend tests."
    fi

    echo "==> Glean tests completed"
  '';

  # Pre-commit quality gates for Nix, backend, and frontend paths.
  git-hooks.hooks = {
    nixpkgs-fmt.enable = true;

    backend-go-lint = {
      enable = true;
      name = "backend-go-lint";
      entry = "${pkgs.bash}/bin/bash -lc 'if [ -f ${backendDir}/go.mod ]; then cd ${backendDir} && golangci-lint run ./...; else echo \"skip: no Go backend\"; fi'";
      language = "system";
      files = "^glean/backend/.*\\.go$";
      pass_filenames = false;
    };

    backend-rust-clippy = {
      enable = true;
      name = "backend-rust-clippy";
      entry = "${pkgs.bash}/bin/bash -lc 'if [ -f ${backendDir}/Cargo.toml ]; then cd ${backendDir} && cargo clippy --all-targets --all-features -- -D warnings; else echo \"skip: no Rust backend\"; fi'";
      language = "system";
      files = "^glean/backend/.*\\.rs$";
      pass_filenames = false;
    };

    frontend-eslint = {
      enable = true;
      name = "frontend-eslint";
      entry = "${pkgs.bash}/bin/bash -lc 'if [ -f ${frontendDir}/package.json ] && jq -e .scripts.lint ${frontendDir}/package.json >/dev/null; then cd ${frontendDir} && corepack enable >/dev/null 2>&1 || true && pnpm lint; elif [ -f ${legacyFrontendDir}/package.json ] && jq -e .scripts.lint ${legacyFrontendDir}/package.json >/dev/null; then cd ${legacyFrontendDir} && corepack enable >/dev/null 2>&1 || true && pnpm lint; else echo \"skip: no frontend lint script\"; fi'";
      language = "system";
      files = "^glean/(frontend|app)/.*\\.(ts|tsx|js|jsx)$";
      pass_filenames = false;
    };
  };
}
