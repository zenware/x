package jj

import (
	"testing"
	"time"
)

func TestParseLog(t *testing.T) {
	output := "abc123\tdeadbeefcafebabe\tJane Doe\t2024-12-31T23:59:59Z\tAdd CR review rounds\n" +
		"def456\tfeedface12345678\tJohn Doe\t2025-01-01 10:11:12 -0700\tFix pipeline sync\n"

	revisions := parseLog(output)
	if len(revisions) != 2 {
		t.Fatalf("expected 2 revisions, got %d", len(revisions))
	}
	if revisions[0].ChangeID != "abc123" || revisions[0].CommitHash != "deadbeefcafebabe" {
		t.Fatalf("unexpected first revision identifiers: %#v", revisions[0])
	}
	if revisions[0].Description != "Add CR review rounds" {
		t.Fatalf("unexpected first description: %q", revisions[0].Description)
	}
	if revisions[0].Timestamp.Format(time.RFC3339) != "2024-12-31T23:59:59Z" {
		t.Fatalf("unexpected first timestamp: %s", revisions[0].Timestamp.Format(time.RFC3339))
	}
	if revisions[1].Author != "John Doe" || revisions[1].Description != "Fix pipeline sync" {
		t.Fatalf("unexpected second revision: %#v", revisions[1])
	}
}
