package main

import "testing"

func TestNormalizeSeed(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		typeOut NodeType
		value   string
		err     bool
	}{
		{name: "domain", input: " Example.COM ", typeOut: NodeTypeDomain, value: "example.com"},
		{name: "email", input: "User@Example.COM", typeOut: NodeTypeEmail, value: "user@example.com"},
		{name: "ip", input: " 203.0.113.7 ", typeOut: NodeTypeIP, value: "203.0.113.7"},
		{name: "invalid", input: "not-a-seed", err: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			kind, val, err := NormalizeSeed(tt.input)
			if tt.err {
				if err == nil {
					t.Fatalf("expected error")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if kind != tt.typeOut || val != tt.value {
				t.Fatalf("got (%s, %s), want (%s, %s)", kind, val, tt.typeOut, tt.value)
			}
		})
	}
}

func TestGraphDepthOneIncludesSeedsAndChildren(t *testing.T) {
	store := NewStore()
	c := store.CreateCase("demo")
	_, err := store.IngestSeed(c.ID, "example.org")
	if err != nil {
		t.Fatalf("ingest failed: %v", err)
	}

	g, err := store.GetCaseGraph(c.ID, 1)
	if err != nil {
		t.Fatalf("graph failed: %v", err)
	}
	if len(g.Nodes) < 3 {
		t.Fatalf("expected at least 3 nodes, got %d", len(g.Nodes))
	}
	if len(g.Edges) < 2 {
		t.Fatalf("expected at least 2 edges, got %d", len(g.Edges))
	}

	var hasIP, hasEmailOrDomain bool
	for _, n := range g.Nodes {
		if n.IsSeed {
			continue
		}
		if n.Type == NodeTypeIP {
			hasIP = true
		}
		if n.Type == NodeTypeEmail || n.Type == NodeTypeDomain {
			hasEmailOrDomain = true
		}
	}
	if !hasIP || !hasEmailOrDomain {
		t.Fatalf("expected one IP and one email/domain child from mock enrichment")
	}
}
