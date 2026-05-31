-- +goose Up
-- +goose StatementBegin
CREATE TABLE repositories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    path        TEXT NOT NULL,
    vcs_type    TEXT NOT NULL DEFAULT 'git',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pipelines (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id     INTEGER NOT NULL REFERENCES repositories(id),
    name        TEXT NOT NULL,
    definition  TEXT NOT NULL DEFAULT '{}',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pipeline_steps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_id INTEGER NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    command     TEXT NOT NULL,
    artifacts   TEXT NOT NULL DEFAULT '[]',
    position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE pipeline_runs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_id  INTEGER NOT NULL REFERENCES pipelines(id),
    repo_id      INTEGER NOT NULL REFERENCES repositories(id),
    status       TEXT NOT NULL DEFAULT 'pending',
    trigger_type TEXT NOT NULL DEFAULT 'manual',
    commit_hash  TEXT NOT NULL DEFAULT '',
    started_at   DATETIME,
    finished_at  DATETIME,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      INTEGER NOT NULL REFERENCES pipeline_runs(id),
    step_name   TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    log_output  TEXT NOT NULL DEFAULT '',
    started_at  DATETIME,
    finished_at DATETIME
);

CREATE TABLE artifacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id      INTEGER NOT NULL REFERENCES jobs(id),
    run_id      INTEGER NOT NULL REFERENCES pipeline_runs(id),
    name        TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    size_bytes  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE change_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id         INTEGER NOT NULL REFERENCES repositories(id),
    number          INTEGER NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    source_bookmark TEXT NOT NULL,
    target_bookmark TEXT NOT NULL DEFAULT 'main',
    status          TEXT NOT NULL DEFAULT 'open',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(repo_id, number)
);

CREATE TABLE review_rounds (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    cr_id      INTEGER NOT NULL REFERENCES change_requests(id),
    round_num  INTEGER NOT NULL,
    tip_commit TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_comments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    round_id    INTEGER NOT NULL REFERENCES review_rounds(id),
    cr_id       INTEGER NOT NULL REFERENCES change_requests(id),
    file_path   TEXT NOT NULL,
    line_number INTEGER NOT NULL DEFAULT 0,
    side        TEXT NOT NULL DEFAULT 'new',
    body        TEXT NOT NULL,
    author      TEXT NOT NULL DEFAULT 'admin',
    resolved    INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    cr_id      INTEGER NOT NULL REFERENCES change_requests(id),
    round_id   INTEGER NOT NULL REFERENCES review_rounds(id),
    author     TEXT NOT NULL DEFAULT 'admin',
    state      TEXT NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS review_comments;
DROP TABLE IF EXISTS review_rounds;
DROP TABLE IF EXISTS change_requests;
DROP TABLE IF EXISTS artifacts;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS pipeline_runs;
DROP TABLE IF EXISTS pipeline_steps;
DROP TABLE IF EXISTS pipelines;
DROP TABLE IF EXISTS repositories;
-- +goose StatementEnd
