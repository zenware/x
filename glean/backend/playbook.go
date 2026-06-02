package main

import (
	"bytes"
	"errors"
	"fmt"
	"strings"

	"gopkg.in/yaml.v3"
)

type Playbook struct {
	Name    string         `json:"name" yaml:"name"`
	Policy  PlaybookPolicy `json:"policy" yaml:"policy"`
	Modules []ModuleSpec   `json:"modules" yaml:"modules"`
}

type PlaybookPolicy struct {
	MaxDepth         int `json:"maxDepth" yaml:"maxDepth"`
	MaxParallelTasks int `json:"maxParallelTasks" yaml:"maxParallelTasks"`
}

type ModuleSpec struct {
	Name             string   `json:"name" yaml:"name"`
	DependsOn        []string `json:"dependsOn,omitempty" yaml:"dependsOn,omitempty"`
	MaxRetries       int      `json:"maxRetries,omitempty" yaml:"maxRetries,omitempty"`
	SimulateFailures int      `json:"simulateFailures,omitempty" yaml:"simulateFailures,omitempty"`
}

func ParsePlaybookYAML(payload []byte) (Playbook, error) {
	if len(bytes.TrimSpace(payload)) == 0 {
		return Playbook{}, errors.New("playbook payload is required")
	}
	var pb Playbook
	dec := yaml.NewDecoder(bytes.NewReader(payload))
	dec.KnownFields(true)
	if err := dec.Decode(&pb); err != nil {
		return Playbook{}, fmt.Errorf("invalid playbook yaml: %w", err)
	}
	if err := ValidatePlaybook(pb); err != nil {
		return Playbook{}, err
	}
	return pb, nil
}

func ValidatePlaybook(pb Playbook) error {
	var errs []string
	if strings.TrimSpace(pb.Name) == "" {
		errs = append(errs, "name is required")
	}
	if pb.Policy.MaxDepth < 1 {
		errs = append(errs, "policy.maxDepth must be >= 1")
	}
	if pb.Policy.MaxParallelTasks < 1 {
		errs = append(errs, "policy.maxParallelTasks must be >= 1")
	}
	if len(pb.Modules) == 0 {
		errs = append(errs, "modules must contain at least one module")
	}

	seen := make(map[string]int)
	for i, mod := range pb.Modules {
		name := strings.TrimSpace(mod.Name)
		if name == "" {
			errs = append(errs, fmt.Sprintf("modules[%d].name is required", i))
			continue
		}
		if _, ok := seen[name]; ok {
			errs = append(errs, fmt.Sprintf("modules[%d].name duplicates %q", i, name))
		}
		seen[name] = i
		if mod.MaxRetries < 0 {
			errs = append(errs, fmt.Sprintf("modules[%d].maxRetries must be >= 0", i))
		}
		if mod.SimulateFailures < 0 {
			errs = append(errs, fmt.Sprintf("modules[%d].simulateFailures must be >= 0", i))
		}
	}

	for i, mod := range pb.Modules {
		for _, dep := range mod.DependsOn {
			depName := strings.TrimSpace(dep)
			idx, ok := seen[depName]
			if !ok {
				errs = append(errs, fmt.Sprintf("modules[%d].dependsOn contains unknown module %q", i, depName))
				continue
			}
			if idx >= i {
				errs = append(errs, fmt.Sprintf("modules[%d].dependsOn %q must reference an earlier module", i, depName))
			}
		}
	}

	if len(errs) > 0 {
		return errors.New(strings.Join(errs, "; "))
	}
	return nil
}
