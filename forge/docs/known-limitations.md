# Known limitations

This is the `v0.01dev-alpha` scope, so several capabilities are intentionally narrow.

## Product limitations

- Single-user only
- No teams, organisations, or granular permissions
- No merge action yet for change requests; review is implemented, but merge policy is not finalized
- No external CI runners; jobs execute on the local host
- No package registry, release UI, notifications, or webhooks

## VCS limitations

- `jj` support is implemented through the CLI, not a library API
- Diff parsing is optimized for the alpha UI and may not perfectly preserve every exotic patch format
- Review-round outdated detection currently marks prior unresolved comments outdated when the source bookmark tip changes; it does not yet do semantic line mapping across rebases

## CI and artifact limitations

- Pipeline definitions must live in `.forge/pipeline.yml`
- Pipeline changes require a manual **Sync pipelines** action after editing the file
- Auto-triggering uses polling, not filesystem hooks or webhook-style events
- Jobs run with `/bin/sh -c` in the repo working directory and do not use sandboxing or isolated workers

## UI limitations

- Tailwind CDN + server-rendered templates only; no rich client-side diff interaction yet
- Review comments are inline and threaded, but thread UX is intentionally minimal
- No pagination yet for large CR discussion histories or large pipeline run histories
