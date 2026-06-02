package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/zenware/forge/internal/auth"
)

type Config struct {
	Host                    string
	Port                    int
	DataDir                 string
	AdminPassword           string
	AdminPasswordMustChange bool
	PollInterval            time.Duration
}

func Load() (*Config, error) {
	cfg := &Config{
		Host:         envOrDefault("FORGE_HOST", "localhost"),
		Port:         3000,
		DataDir:      envOrDefault("FORGE_DATA_DIR", "./data"),
		PollInterval: 30 * time.Second,
	}

	if raw := os.Getenv("FORGE_PORT"); raw != "" {
		port, err := strconv.Atoi(raw)
		if err != nil {
			return nil, fmt.Errorf("parse FORGE_PORT: %w", err)
		}
		cfg.Port = port
	}

	if raw := os.Getenv("FORGE_POLL_INTERVAL_SECONDS"); raw != "" {
		seconds, err := strconv.Atoi(raw)
		if err != nil {
			return nil, fmt.Errorf("parse FORGE_POLL_INTERVAL_SECONDS: %w", err)
		}
		cfg.PollInterval = time.Duration(seconds) * time.Second
	}

	credentials, err := auth.LoadOrInit(cfg.DataDir, os.Getenv("FORGE_ADMIN_PASSWORD"), os.Stdout)
	if err != nil {
		return nil, fmt.Errorf("load admin credentials: %w", err)
	}
	cfg.AdminPassword = credentials.Password
	cfg.AdminPasswordMustChange = credentials.MustChangePassword

	return cfg, nil
}

func (c *Config) Address() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
