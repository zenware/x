package main

import (
	"log"
	"net/http"

	artifactslocal "github.com/zenware/forge/internal/artifacts/local"
	cilocal "github.com/zenware/forge/internal/ci/local"
	"github.com/zenware/forge/internal/config"
	"github.com/zenware/forge/internal/db"
	"github.com/zenware/forge/internal/domain"
	gitvcs "github.com/zenware/forge/internal/vcs/git"
	jjvcs "github.com/zenware/forge/internal/vcs/jj"
	"github.com/zenware/forge/internal/web"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	database, err := db.Open(cfg.DataDir)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer database.Close()

	providers := map[domain.VCSType]web.VCSProvider{
		domain.VCSTypeJJ:  jjvcs.New(),
		domain.VCSTypeGit: gitvcs.New(),
	}

	artifactStore := artifactslocal.New(cfg.DataDir, database)
	ciExecutor := cilocal.New(database, artifactStore)

	handler, err := web.New(cfg, database, providers, ciExecutor, artifactStore)
	if err != nil {
		log.Fatalf("create server: %v", err)
	}

	addr := cfg.Address()
	log.Printf("forge listening on http://%s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
