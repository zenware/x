package testutil

import (
	"bytes"
	"testing"

	"github.com/zenware/forge/internal/auth"
)

type GeneratedAdminPasswordFixture struct {
	Password    string
	ConsoleLog  string
	Credentials *auth.AdminCredentials
}

func CaptureGeneratedAdminPassword(t testing.TB, dataDir string) GeneratedAdminPasswordFixture {
	t.Helper()

	var console bytes.Buffer
	credentials, err := auth.LoadOrInit(dataDir, "", &console)
	if err != nil {
		t.Fatalf("load generated admin password: %v", err)
	}
	password, err := auth.ExtractGeneratedPassword(console.String())
	if err != nil {
		t.Fatalf("extract generated admin password: %v", err)
	}
	if credentials.Password != password {
		t.Fatalf("generated admin password mismatch: credentials=%q output=%q", credentials.Password, password)
	}

	return GeneratedAdminPasswordFixture{
		Password:    password,
		ConsoleLog:  console.String(),
		Credentials: credentials,
	}
}
