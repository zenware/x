package auth

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const GeneratedPasswordMessagePrefix = "Forge generated initial admin password: "

type AdminCredentials struct {
	Password           string `json:"password"`
	MustChangePassword bool   `json:"must_change_password"`
}

func LoadOrInit(dataDir, override string, console io.Writer) (*AdminCredentials, error) {
	if override != "" {
		return &AdminCredentials{Password: override}, nil
	}

	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}

	path := credentialsPath(dataDir)
	credentials, err := load(path)
	if err == nil {
		return credentials, nil
	}
	if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}

	password, err := generatePassword()
	if err != nil {
		return nil, err
	}
	credentials = &AdminCredentials{
		Password:           password,
		MustChangePassword: true,
	}
	if err := save(path, credentials); err != nil {
		return nil, err
	}
	if console != nil {
		if _, err := fmt.Fprintf(console, "%s%s\n", GeneratedPasswordMessagePrefix, password); err != nil {
			return nil, fmt.Errorf("write generated password notice: %w", err)
		}
	}
	return credentials, nil
}

func UpdatePassword(dataDir, password string) error {
	if strings.TrimSpace(password) == "" {
		return errors.New("password cannot be empty")
	}
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return fmt.Errorf("create data dir: %w", err)
	}
	if err := save(credentialsPath(dataDir), &AdminCredentials{Password: password}); err != nil {
		return err
	}
	return nil
}

func ExtractGeneratedPassword(output string) (string, error) {
	for _, line := range strings.Split(output, "\n") {
		if !strings.HasPrefix(line, GeneratedPasswordMessagePrefix) {
			continue
		}
		password := strings.TrimSpace(strings.TrimPrefix(line, GeneratedPasswordMessagePrefix))
		if password == "" {
			return "", errors.New("generated password notice did not include a password")
		}
		return password, nil
	}
	return "", errors.New("generated password notice not found")
}

func credentialsPath(dataDir string) string {
	return filepath.Join(dataDir, "admin-credentials.json")
}

func load(path string) (*AdminCredentials, error) {
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read admin credentials: %w", err)
	}
	var credentials AdminCredentials
	if err := json.Unmarshal(payload, &credentials); err != nil {
		return nil, fmt.Errorf("decode admin credentials: %w", err)
	}
	if credentials.Password == "" {
		return nil, errors.New("stored admin password is empty")
	}
	return &credentials, nil
}

func save(path string, credentials *AdminCredentials) error {
	payload, err := json.Marshal(credentials)
	if err != nil {
		return fmt.Errorf("encode admin credentials: %w", err)
	}
	if err := os.WriteFile(path, payload, 0o600); err != nil {
		return fmt.Errorf("write admin credentials: %w", err)
	}
	return nil
}

func generatePassword() (string, error) {
	secret := make([]byte, 18)
	if _, err := rand.Read(secret); err != nil {
		return "", fmt.Errorf("generate admin password: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(secret), nil
}
