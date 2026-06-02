export type NodeType = 'domain' | 'email' | 'ip'
export type SeedKind = NodeType | 'unknown'

export interface Provenance {
  source: string
  runId: string
  observedAt: string
}

export interface GraphNode {
  id: string
  caseId: string
  type: NodeType
  value: string
  isSeed: boolean
  provenance: Provenance
  confidence: number
}

export interface GraphEdge {
  id: string
  caseId: string
  fromNodeId: string
  toNodeId: string
  relation: string
  provenance: Provenance
}

export interface GraphPayload {
  caseId: string
  depth: number
  nodes: GraphNode[]
  edges: GraphEdge[]
}
