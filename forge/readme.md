# forge

This is my personal software forge project.
It aims to be a self-hosted GitHub/GitLab/Codeberg/Gitea-style forge with `jj` as a first-class workflow.

## Current alpha scope

The current `v0.01dev-alpha` implementation includes:

- local repository registration
- Git and `jj`-backed repository browsing
- change requests for bookmark-to-bookmark review
- threaded review comments and review rounds
- local CI loaded from `.forge/pipeline.yml`
- artifact storage and download
- a single-user web UI for settings, repos, pipelines, and review

If possible I want it to make `jj` be a first-class citizen, so that I can use `jj` to manage my repositories and workspaces, and have the forge be a nice web UI on top of that.

It should also have CI/CD capabilities, so that I can automate testing and deployment of my projects. And artifact management, so that I can store and manage the artifacts produced by my CI/CD pipelines. -- Ultimately these features may be plug & play and powered by different servers rather than built inside of the forge itself. Because I do think it's nice to be able to swap out CI/CD and artifact management solutions without changing the code-storage part of the forge itself.

## Quick start

```bash
devenv shell
cd forge
make run
```

Then open `http://localhost:3000/login` and sign in with the default alpha password: `admin`.

## Documentation

- [Install guide](docs/install.md)
- [Pipeline syntax](docs/pipeline-syntax.md)
- [Known limitations](docs/known-limitations.md)
- [ADR 0001: initial stack](docs/adr/0001-initial-stack.md)
- [Release notes: v0.01dev-alpha](docs/releases/v0.01dev-alpha.md)
