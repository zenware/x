-- +goose Up
-- +goose StatementBegin
ALTER TABLE review_comments ADD COLUMN parent_id INTEGER REFERENCES review_comments(id);
ALTER TABLE review_comments ADD COLUMN outdated INTEGER NOT NULL DEFAULT 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
CREATE TABLE review_comments_new (
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

INSERT INTO review_comments_new (id, round_id, cr_id, file_path, line_number, side, body, author, resolved, created_at)
SELECT id, round_id, cr_id, file_path, line_number, side, body, author, resolved, created_at
FROM review_comments;

DROP TABLE review_comments;
ALTER TABLE review_comments_new RENAME TO review_comments;
-- +goose StatementEnd
