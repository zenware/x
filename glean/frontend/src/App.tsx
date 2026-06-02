import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createCase, detectSeedKind, fetchCaseGraph, ingestSeed, suggestedPlaybooks } from './api'
import type { GraphNode, GraphPayload, NodeType, SeedKind } from './types'
import './App.css'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface PositionedNode {
  node: GraphNode
  x: number
  y: number
}

function computeNodePositions(graph: GraphPayload): Map<string, PositionedNode> {
  const seed = graph.nodes.find((node) => node.isSeed) ?? graph.nodes[0]
  const map = new Map<string, PositionedNode>()

  if (!seed) {
    return map
  }

  map.set(seed.id, { node: seed, x: 320, y: 170 })

  const others = graph.nodes.filter((node) => node.id !== seed.id)
  const radius = 120

  others.forEach((node, index) => {
    const angle = (index / Math.max(others.length, 1)) * Math.PI * 2
    map.set(node.id, {
      node,
      x: Math.round(320 + radius * Math.cos(angle)),
      y: Math.round(170 + radius * Math.sin(angle)),
    })
  })

  return map
}

function App() {
  const [seed, setSeed] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [graph, setGraph] = useState<GraphPayload | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [detectedKind, setDetectedKind] = useState<SeedKind>('unknown')
  const [selectedPlaybook, setSelectedPlaybook] = useState<string>('Quick scan')
  const [minConfidence, setMinConfidence] = useState(0)
  const [hiddenTypes, setHiddenTypes] = useState<Record<NodeType, boolean>>({
    domain: false,
    email: false,
    ip: false,
  })
  const [timelineCutoff, setTimelineCutoff] = useState<number | null>(null)

  const playbookOptions = useMemo(() => suggestedPlaybooks(detectedKind), [detectedKind])

  const timelineRange = useMemo(() => {
    if (!graph || graph.nodes.length === 0) {
      return { min: 0, max: 0 }
    }
    const stamps = graph.nodes.map((node) => Date.parse(node.provenance.observedAt)).filter(Number.isFinite)
    if (stamps.length === 0) {
      return { min: 0, max: 0 }
    }
    return { min: Math.min(...stamps), max: Math.max(...stamps) }
  }, [graph])

  const visibleNodes = useMemo(() => {
    if (!graph) return []
    return graph.nodes.filter((node) => {
      if (hiddenTypes[node.type]) return false
      if (node.confidence < minConfidence) return false
      if (timelineCutoff !== null) {
        const observed = Date.parse(node.provenance.observedAt)
        if (Number.isFinite(observed) && observed > timelineCutoff) return false
      }
      return true
    })
  }, [graph, hiddenTypes, minConfidence, timelineCutoff])

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes])

  const visibleEdges = useMemo(() => {
    if (!graph) return []
    return graph.edges.filter(
      (edge) => visibleNodeIds.has(edge.fromNodeId) && visibleNodeIds.has(edge.toNodeId),
    )
  }, [graph, visibleNodeIds])

  const selectedNode = useMemo(
    () => visibleNodes.find((node) => node.id === selectedNodeId) ?? null,
    [selectedNodeId, visibleNodes],
  )

  const positionedGraph = useMemo(() => {
    if (!graph) return new Map<string, PositionedNode>()
    return computeNodePositions({ ...graph, nodes: visibleNodes, edges: visibleEdges })
  }, [graph, visibleEdges, visibleNodes])

  const isExpanded = graph?.depth === 1

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = seed.trim()
    if (!trimmed) {
      setError('Seed is required.')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const created = await createCase(`alpha-${trimmed}`)
      await ingestSeed(created.id, trimmed)
      const nextGraph = await fetchCaseGraph(created.id, 0)
      setCaseId(created.id)
      setGraph(nextGraph)
      setSelectedNodeId(null)
      setStatus('ready')
      const stamps = nextGraph.nodes.map((node) => Date.parse(node.provenance.observedAt))
      const max = Math.max(...stamps.filter(Number.isFinite), 0)
      setTimelineCutoff(max || null)
    } catch (requestError) {
      setStatus('error')
      setError(requestError instanceof Error ? requestError.message : 'Unexpected request error')
    }
  }

  async function handleExpandNeighbors() {
    if (!caseId) return
    setStatus('loading')
    setError(null)
    try {
      const nextGraph = await fetchCaseGraph(caseId, 1)
      setGraph(nextGraph)
      if (timelineCutoff === null) {
        const stamps = nextGraph.nodes.map((node) => Date.parse(node.provenance.observedAt))
        const max = Math.max(...stamps.filter(Number.isFinite), 0)
        setTimelineCutoff(max || null)
      }
      setStatus('ready')
    } catch (requestError) {
      setStatus('error')
      setError(requestError instanceof Error ? requestError.message : 'Unexpected request error')
    }
  }

  function handleSeedChange(value: string) {
    setSeed(value)
    const kind = detectSeedKind(value)
    setDetectedKind(kind)
    const suggestions = suggestedPlaybooks(kind)
    setSelectedPlaybook(suggestions[0] ?? 'Quick scan')
  }

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">Glean alpha</p>
        <h1>Investigation launchpad</h1>
      </header>

      <section className="card">
        <form className="seed-form" onSubmit={handleSubmit}>
          <label htmlFor="seed-input">Omnibox</label>
          <div className="seed-row">
            <input
              id="seed-input"
              value={seed}
              onChange={(event) => handleSeedChange(event.target.value)}
              placeholder="domain, email, or IP"
            />
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Running…' : 'Create + ingest'}
            </button>
          </div>
        </form>
        <div className="omnibox-meta">
          <p className="hint">
            Detected seed type: <strong>{detectedKind}</strong>
          </p>
          <label>
            Suggested playbook
            <select
              aria-label="Suggested playbook"
              value={selectedPlaybook}
              onChange={(event) => setSelectedPlaybook(event.target.value)}
            >
              {playbookOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        {graph && <p className="hint">Case: {graph.caseId}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="workspace">
        <div className="card graph-panel">
          <div className="panel-row">
            <h2>Graph view (progressive disclosure)</h2>
            <button type="button" onClick={handleExpandNeighbors} disabled={!caseId || isExpanded || status === 'loading'}>
              {isExpanded ? 'Neighbors loaded' : 'Expand neighbors'}
            </button>
          </div>
          <div className="filters">
            <label>
              Minimum confidence
              <input
                aria-label="Minimum confidence"
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={minConfidence}
                onChange={(event) => setMinConfidence(Number(event.target.value))}
              />
            </label>
            <fieldset>
              <legend>Node types</legend>
              {(['domain', 'email', 'ip'] as NodeType[]).map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    aria-label={`Hide ${type}`}
                    checked={hiddenTypes[type]}
                    onChange={(event) =>
                      setHiddenTypes((prev) => ({ ...prev, [type]: event.target.checked }))
                    }
                  />
                  Hide {type}
                </label>
              ))}
            </fieldset>
            <label>
              Timeline
              <input
                aria-label="Timeline"
                type="range"
                min={timelineRange.min}
                max={timelineRange.max}
                step={1}
                value={timelineCutoff ?? timelineRange.max}
                onChange={(event) => setTimelineCutoff(Number(event.target.value))}
                disabled={timelineRange.max === timelineRange.min}
              />
            </label>
          </div>
          {!graph && <p className="hint">Run seed ingest to load graph from API.</p>}

          {graph && (
            <div className="graph-stage" role="group" aria-label="Case graph">
              <svg className="graph-edges" viewBox="0 0 640 340" aria-hidden="true">
                {visibleEdges.map((edge) => {
                  const from = positionedGraph.get(edge.fromNodeId)
                  const to = positionedGraph.get(edge.toNodeId)

                  if (!from || !to) {
                    return null
                  }

                  return (
                    <line
                      key={edge.id}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#7f8aa3"
                      strokeWidth="1.5"
                    />
                  )
                })}
              </svg>

              {visibleNodes.map((node) => {
                const position = positionedGraph.get(node.id)
                if (!position) {
                  return null
                }

                const selected = selectedNodeId === node.id

                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`graph-node ${node.isSeed ? 'is-seed' : ''} ${selected ? 'is-selected' : ''}`}
                    style={{ left: `${position.x}px`, top: `${position.y}px` }}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    {node.value}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <aside className="card inspector" aria-live="polite">
          <h2>Node inspector</h2>
          {!selectedNode && <p className="hint">Select a graph node for details.</p>}

          {selectedNode && (
            <div className="inspector-body">
              <p>
                <strong>Value:</strong> {selectedNode.value}
              </p>
              <p>
                <strong>Type:</strong> {selectedNode.type}
              </p>
              <p>
                <strong>Confidence:</strong> {selectedNode.confidence.toFixed(1)}
              </p>
              <p>
                <strong>Source:</strong> {selectedNode.provenance.source}
              </p>
              <p>
                <strong>Run:</strong> {selectedNode.provenance.runId}
              </p>
              <p>
                <strong>Observed:</strong> {new Date(selectedNode.provenance.observedAt).toLocaleString()}
              </p>
              <details open>
                <summary>Raw JSON</summary>
                <pre>{JSON.stringify(selectedNode, null, 2)}</pre>
              </details>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

export default App
