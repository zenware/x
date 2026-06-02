import type { GraphPayload, GraphNode, SeedKind } from './types'

const API_BASE_URL =
  (import.meta.env.VITE_GLEAN_API_BASE_URL as string | undefined)?.trim() ||
  (import.meta.env.NEXT_PUBLIC_API_BASE_URL as string | undefined)?.trim() ||
  'http://localhost:8088'

interface CasePayload {
  id: string
  name: string
  createdAt: string
}

interface RawNode {
  id: string
  caseId: string
  type: GraphNode['type']
  value: string
  isSeed: boolean
  source: string
  createdAt: string
}

interface RawEdge {
  id: string
  caseId: string
  from: string
  to: string
  relation: string
  createdAt: string
}

interface RawGraph {
  caseId: string
  nodes: RawNode[]
  edges: RawEdge[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(body?.error || `Request failed (${response.status})`)
  }

  return (await response.json()) as T
}

export async function createCase(name: string): Promise<CasePayload> {
  return request<CasePayload>('/api/v1/cases', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function ingestSeed(caseId: string, value: string): Promise<void> {
  await request(`/api/v1/cases/${caseId}/seeds`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

function confidenceForNode(node: RawNode): number {
  if (node.isSeed) {
    return 1
  }
  if (node.source === 'mock_enrichment') {
    return 0.7
  }
  return 0.6
}

function normalizeGraph(raw: RawGraph, depth: number): GraphPayload {
  return {
    caseId: raw.caseId,
    depth,
    nodes: raw.nodes.map((node) => ({
      id: node.id,
      caseId: node.caseId,
      type: node.type,
      value: node.value,
      isSeed: node.isSeed,
      confidence: confidenceForNode(node),
      provenance: {
        source: node.source,
        runId: 'n/a',
        observedAt: node.createdAt,
      },
    })),
    edges: raw.edges.map((edge) => ({
      id: edge.id,
      caseId: edge.caseId,
      fromNodeId: edge.from,
      toNodeId: edge.to,
      relation: edge.relation,
      provenance: {
        source: edge.relation,
        runId: 'n/a',
        observedAt: edge.createdAt,
      },
    })),
  }
}

export async function fetchCaseGraph(caseId: string, depth = 1): Promise<GraphPayload> {
  const raw = await request<RawGraph>(`/api/v1/cases/${caseId}/graph?depth=${depth}`)
  return normalizeGraph(raw, depth)
}

export async function runAlphaLoop(seed: string): Promise<GraphPayload> {
  const created = await createCase(`alpha-${seed}`)
  await ingestSeed(created.id, seed)
  return fetchCaseGraph(created.id, 1)
}

const ipv4Pattern = /^\d{1,3}(?:\.\d{1,3}){3}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const domainPattern = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

export function detectSeedKind(input: string): SeedKind {
  const seed = input.trim()
  if (!seed) return 'unknown'
  if (emailPattern.test(seed)) return 'email'
  if (ipv4Pattern.test(seed)) return 'ip'
  if (domainPattern.test(seed)) return 'domain'
  return 'unknown'
}

export function suggestedPlaybooks(kind: SeedKind): string[] {
  if (kind === 'email') {
    return ['Identity trace', 'Account exposure sweep']
  }
  if (kind === 'domain') {
    return ['Infrastructure map', 'Subdomain expansion']
  }
  if (kind === 'ip') {
    return ['Host reputation scan', 'Network neighbor trace']
  }
  return ['Quick scan']
}
