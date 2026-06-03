package main

import "net/http"

func (s *Server) handleOpenAPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		writeJSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, openAPISpec())
}

func (s *Server) handleDocs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		writeJSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(apiDocsHTML))
}

func openAPISpec() map[string]any {
	return map[string]any{
		"openapi": "3.1.0",
		"info": map[string]any{
			"title":       "Glean API",
			"version":     "0.1.0",
			"description": "Local development API for Glean investigations.",
		},
		"servers": []map[string]any{
			{"url": "http://localhost:8088"},
		},
		"paths": map[string]any{
			"/health": map[string]any{
				"get": map[string]any{
					"summary":     "Health check",
					"operationId": "getHealth",
					"responses": map[string]any{
						"200": map[string]any{
							"description": "Service is healthy",
							"content": map[string]any{
								"application/json": map[string]any{
									"schema": map[string]any{
										"type": "object",
										"properties": map[string]any{
											"status": map[string]any{"type": "string", "example": "ok"},
										},
									},
								},
							},
						},
					},
				},
			},
			"/api/v1/cases": map[string]any{
				"post": map[string]any{
					"summary":     "Create a case",
					"operationId": "createCase",
					"requestBody": jsonBody(map[string]any{"name": "alpha-example.com"}),
					"responses": map[string]any{
						"201": jsonResponse("Created case", "Case"),
					},
				},
			},
			"/api/v1/cases/{caseId}/seeds": map[string]any{
				"post": map[string]any{
					"summary":     "Ingest a seed into a case",
					"operationId": "ingestSeed",
					"parameters": []map[string]any{
						pathParam("caseId", "case-1"),
					},
					"requestBody": jsonBody(map[string]any{"value": "alpha@example.com"}),
					"responses": map[string]any{
						"201": jsonResponse("Seed ingest result", "IngestResult"),
					},
				},
			},
			"/api/v1/cases/{caseId}/graph": map[string]any{
				"get": map[string]any{
					"summary":     "Fetch graph for a case",
					"operationId": "getCaseGraph",
					"parameters": []map[string]any{
						pathParam("caseId", "case-1"),
						queryParam("depth", "1"),
					},
					"responses": map[string]any{
						"200": jsonResponse("Graph payload", "Graph"),
					},
				},
			},
			"/api/v1/playbooks/validate": map[string]any{
				"post": map[string]any{
					"summary":     "Validate playbook YAML",
					"operationId": "validatePlaybook",
					"requestBody": map[string]any{
						"required": true,
						"content": map[string]any{
							"text/plain": map[string]any{
								"example": "name: \"Infrastructure scan\"\npolicy:\n  maxDepth: 2\n  maxParallelTasks: 2\nmodules:\n  - name: dns_lookup\n",
							},
						},
					},
					"responses": map[string]any{
						"200": map[string]any{
							"description": "Playbook is valid",
						},
					},
				},
			},
			"/api/v1/cases/{caseId}/runs": map[string]any{
				"post": map[string]any{
					"summary":     "Create and enqueue a playbook run",
					"operationId": "createRun",
					"parameters": []map[string]any{
						pathParam("caseId", "case-1"),
					},
					"requestBody": jsonBody(map[string]any{
						"seed":           "alpha@example.com",
						"idempotencyKey": "sample-run",
						"playbook":       "name: \"Infrastructure scan\"\npolicy:\n  maxDepth: 2\n  maxParallelTasks: 2\nmodules:\n  - name: dns_lookup\n",
					}),
					"responses": map[string]any{
						"202": jsonResponse("Accepted run details", "RunDetails"),
					},
				},
			},
			"/api/v1/cases/{caseId}/runs/{runId}": map[string]any{
				"get": map[string]any{
					"summary":     "Fetch run details",
					"operationId": "getRun",
					"parameters": []map[string]any{
						pathParam("caseId", "case-1"),
						pathParam("runId", "run-1"),
					},
					"responses": map[string]any{
						"200": jsonResponse("Run details", "RunDetails"),
					},
				},
			},
			"/api/v1/runs/{runId}/dag": map[string]any{
				"get": map[string]any{
					"summary":     "Fetch run DAG",
					"operationId": "getRunDAG",
					"parameters": []map[string]any{
						pathParam("runId", "run-1"),
					},
					"responses": map[string]any{
						"200": jsonResponse("Run DAG", "RunDAG"),
					},
				},
			},
		},
		"components": map[string]any{
			"schemas": map[string]any{
				"Case": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"id":        map[string]any{"type": "string"},
						"name":      map[string]any{"type": "string"},
						"createdAt": map[string]any{"type": "string", "format": "date-time"},
					},
				},
				"IngestResult": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"seedId":        map[string]any{"type": "string"},
						"runId":         map[string]any{"type": "string"},
						"seedNodeId":    map[string]any{"type": "string"},
						"relatedNodeId": map[string]any{"type": "string"},
					},
				},
				"Node": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"id":        map[string]any{"type": "string"},
						"caseId":    map[string]any{"type": "string"},
						"type":      map[string]any{"type": "string"},
						"value":     map[string]any{"type": "string"},
						"isSeed":    map[string]any{"type": "boolean"},
						"source":    map[string]any{"type": "string"},
						"createdAt": map[string]any{"type": "string", "format": "date-time"},
					},
				},
				"Edge": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"id":        map[string]any{"type": "string"},
						"caseId":    map[string]any{"type": "string"},
						"from":      map[string]any{"type": "string"},
						"to":        map[string]any{"type": "string"},
						"relation":  map[string]any{"type": "string"},
						"createdAt": map[string]any{"type": "string", "format": "date-time"},
					},
				},
				"Graph": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"caseId": map[string]any{"type": "string"},
						"nodes": map[string]any{
							"type":  "array",
							"items": map[string]any{"$ref": "#/components/schemas/Node"},
						},
						"edges": map[string]any{
							"type":  "array",
							"items": map[string]any{"$ref": "#/components/schemas/Edge"},
						},
					},
				},
				"Playbook": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"name": map[string]any{"type": "string"},
						"policy": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"maxDepth":         map[string]any{"type": "integer"},
								"maxParallelTasks": map[string]any{"type": "integer"},
							},
						},
						"modules": map[string]any{
							"type": "array",
							"items": map[string]any{
								"type": "object",
								"properties": map[string]any{
									"name":             map[string]any{"type": "string"},
									"dependsOn":        map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
									"maxRetries":       map[string]any{"type": "integer"},
									"simulateFailures": map[string]any{"type": "integer"},
								},
							},
						},
					},
				},
				"TaskTransition": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"state":   map[string]any{"type": "string"},
						"at":      map[string]any{"type": "string", "format": "date-time"},
						"attempt": map[string]any{"type": "integer"},
						"message": map[string]any{"type": "string"},
					},
				},
				"Task": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"id":               map[string]any{"type": "string"},
						"caseId":           map[string]any{"type": "string"},
						"runId":            map[string]any{"type": "string"},
						"module":           map[string]any{"type": "string"},
						"parentTaskId":     map[string]any{"type": "string"},
						"dependsOnTaskIds": map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
						"state":            map[string]any{"type": "string"},
						"attempts":         map[string]any{"type": "integer"},
						"maxRetries":       map[string]any{"type": "integer"},
						"simulateFailures": map[string]any{"type": "integer"},
						"idempotencyKey":   map[string]any{"type": "string"},
						"nextAttemptAt":    map[string]any{"type": "string", "format": "date-time"},
						"lastError":        map[string]any{"type": "string"},
						"createdAt":        map[string]any{"type": "string", "format": "date-time"},
						"updatedAt":        map[string]any{"type": "string", "format": "date-time"},
						"transitions": map[string]any{
							"type":  "array",
							"items": map[string]any{"$ref": "#/components/schemas/TaskTransition"},
						},
					},
				},
				"Run": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"id":        map[string]any{"type": "string"},
						"caseId":    map[string]any{"type": "string"},
						"seed":      map[string]any{"type": "string"},
						"playbook":  map[string]any{"$ref": "#/components/schemas/Playbook"},
						"status":    map[string]any{"type": "string"},
						"createdAt": map[string]any{"type": "string", "format": "date-time"},
						"updatedAt": map[string]any{"type": "string", "format": "date-time"},
					},
				},
				"RunDetails": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"run":   map[string]any{"$ref": "#/components/schemas/Run"},
						"tasks": map[string]any{"type": "array", "items": map[string]any{"$ref": "#/components/schemas/Task"}},
					},
				},
				"TaskEdge": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"fromTaskId": map[string]any{"type": "string"},
						"toTaskId":   map[string]any{"type": "string"},
						"relation":   map[string]any{"type": "string"},
					},
				},
				"RunDAG": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"runId": map[string]any{"type": "string"},
						"tasks": map[string]any{"type": "array", "items": map[string]any{"$ref": "#/components/schemas/Task"}},
						"edges": map[string]any{"type": "array", "items": map[string]any{"$ref": "#/components/schemas/TaskEdge"}},
					},
				},
			},
		},
	}
}

func jsonBody(example any) map[string]any {
	return map[string]any{
		"required": true,
		"content": map[string]any{
			"application/json": map[string]any{
				"example": example,
			},
		},
	}
}

func jsonResponse(description, schema string) map[string]any {
	return map[string]any{
		"description": description,
		"content": map[string]any{
			"application/json": map[string]any{
				"schema": map[string]any{
					"$ref": "#/components/schemas/" + schema,
				},
			},
		},
	}
}

func pathParam(name, example string) map[string]any {
	return map[string]any{
		"name":        name,
		"in":          "path",
		"required":    true,
		"description": name,
		"schema":      map[string]any{"type": "string"},
		"example":     example,
	}
}

func queryParam(name, example string) map[string]any {
	return map[string]any{
		"name":        name,
		"in":          "query",
		"required":    false,
		"description": name,
		"schema":      map[string]any{"type": "string"},
		"example":     example,
	}
}

var apiDocsHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Glean API Docs</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; background: #0b1020; color: #e5e7eb; }
    main { max-width: 1100px; margin: 0 auto; padding: 32px 20px 56px; }
    h1, h2, h3, p { margin-top: 0; }
    .lead { color: #9ca3af; margin-bottom: 24px; }
    .endpoint { background: #111827; border: 1px solid #1f2937; border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
    .endpoint summary { cursor: pointer; list-style: none; padding: 16px 18px; display: flex; gap: 12px; align-items: center; }
    .endpoint summary::-webkit-details-marker { display: none; }
    .method { min-width: 56px; text-align: center; border-radius: 999px; padding: 4px 10px; font-weight: 700; color: #111827; background: #93c5fd; }
    .method.post { background: #86efac; }
    .path { font-family: ui-monospace, SFMono-Regular, monospace; }
    .content { padding: 0 18px 18px; border-top: 1px solid #1f2937; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin: 16px 0; }
    label { display: block; font-weight: 600; }
    input, textarea, button, select { width: 100%; box-sizing: border-box; border-radius: 10px; border: 1px solid #374151; background: #030712; color: #e5e7eb; padding: 10px 12px; font: inherit; }
    textarea { min-height: 160px; resize: vertical; font-family: ui-monospace, SFMono-Regular, monospace; }
    button { cursor: pointer; background: #2563eb; border-color: #2563eb; font-weight: 700; }
    pre { background: #030712; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; overflow: auto; white-space: pre-wrap; word-break: break-word; }
    .meta { color: #9ca3af; font-size: 13px; }
    .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 14px 0; }
    a { color: #93c5fd; }
  </style>
</head>
<body>
  <main>
    <h1>Glean API Docs</h1>
    <p class="lead">OpenAPI-backed local API docs with in-browser request execution. Spec: <a href="/openapi.json">/openapi.json</a></p>
    <div id="app">Loading spec...</div>
  </main>
  <script>
    async function loadSpec() {
      const res = await fetch('/openapi.json');
      if (!res.ok) throw new Error('Failed to load /openapi.json');
      return res.json();
    }

    function getExampleBody(operation) {
      const body = operation.requestBody?.content || {};
      const entry = body['application/json'] || body['text/plain'];
      if (!entry) return '';
      const example = entry.example;
      if (example === undefined) return '';
      return typeof example === 'string' ? example : JSON.stringify(example, null, 2);
    }

    function getContentType(operation) {
      const body = operation.requestBody?.content || {};
      if (body['application/json']) return 'application/json';
      if (body['text/plain']) return 'text/plain';
      return '';
    }

    function resolvePath(path, params) {
      return path.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(params[key] || ''));
    }

    function buildQuery(parameters, values) {
      const query = new URLSearchParams();
      for (const param of parameters.filter((param) => param.in === 'query')) {
        const value = values[param.name];
        if (value) query.set(param.name, value);
      }
      const encoded = query.toString();
      return encoded ? '?' + encoded : '';
    }

    function renderOperation(path, method, operation) {
      const details = document.createElement('details');
      details.className = 'endpoint';
      const summary = document.createElement('summary');
      summary.innerHTML = '<span class="method ' + method + '">' + method.toUpperCase() + '</span><span><div class="path">' + path + '</div><div class="meta">' + (operation.summary || '') + '</div></span>';
      details.appendChild(summary);

      const content = document.createElement('div');
      content.className = 'content';
      const description = document.createElement('p');
      description.className = 'meta';
      description.textContent = operation.operationId || '';
      content.appendChild(description);

      const parameters = operation.parameters || [];
      const inputWrap = document.createElement('div');
      inputWrap.className = 'grid';
      const inputs = {};

      for (const param of parameters) {
        const field = document.createElement('label');
        field.textContent = param.name + ' (' + param.in + ')';
        const input = document.createElement('input');
        input.value = String(param.example || '');
        input.placeholder = param.description || param.name;
        field.appendChild(input);
        inputWrap.appendChild(field);
        inputs[param.name] = input;
      }

      if (parameters.length) content.appendChild(inputWrap);

      const bodyText = getExampleBody(operation);
      let bodyInput = null;
      if (operation.requestBody) {
        const label = document.createElement('label');
        label.textContent = 'Request body';
        bodyInput = document.createElement('textarea');
        bodyInput.value = bodyText;
        label.appendChild(bodyInput);
        content.appendChild(label);
      }

      const actionRow = document.createElement('div');
      actionRow.className = 'row';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Send request';
      actionRow.appendChild(button);
      content.appendChild(actionRow);

      const output = document.createElement('pre');
      output.textContent = 'Response will appear here.';
      content.appendChild(output);

      button.addEventListener('click', async () => {
        const values = {};
        for (const [name, input] of Object.entries(inputs)) values[name] = input.value.trim();
        const url = resolvePath(path, values) + buildQuery(parameters, values);
        const init = { method: method.toUpperCase(), headers: {} };
        if (bodyInput && bodyInput.value.trim()) {
          init.body = bodyInput.value;
          const contentType = getContentType(operation);
          if (contentType) init.headers['Content-Type'] = contentType;
        }

        try {
          const res = await fetch(url, init);
          const text = await res.text();
          output.textContent = 'HTTP ' + res.status + ' ' + res.statusText + '\n\n' + text;
        } catch (error) {
          output.textContent = String(error);
        }
      });

      details.appendChild(content);
      return details;
    }

    loadSpec().then((spec) => {
      const app = document.getElementById('app');
      app.textContent = '';
      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [method, operation] of Object.entries(methods)) {
          app.appendChild(renderOperation(path, method, operation));
        }
      }
    }).catch((error) => {
      document.getElementById('app').textContent = String(error);
    });
  </script>
</body>
</html>
`
