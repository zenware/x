import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects seed type and suggests playbooks in omnibox', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Omnibox'), { target: { value: 'analyst@acme.test' } })
    expect(screen.getByText(/Detected seed type:/)).toHaveTextContent('email')
    expect(screen.getByRole('option', { name: 'Identity trace' })).toBeInTheDocument()
  })

  it('loads seed-only graph first, then expands neighbors and supports type filtering', async () => {
    const now = new Date().toISOString()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'case-1', name: 'alpha-acme.test', createdAt: now }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ seedId: 'seed-1', runId: 'run-1' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            caseId: 'case-1',
            nodes: [
              {
                id: 'node-seed',
                caseId: 'case-1',
                type: 'domain',
                value: 'acme.test',
                isSeed: true,
                source: 'seed',
                createdAt: now,
              },
            ],
            edges: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            caseId: 'case-1',
            nodes: [
              {
                id: 'node-seed',
                caseId: 'case-1',
                type: 'domain',
                value: 'acme.test',
                isSeed: true,
                source: 'seed',
                createdAt: now,
              },
              {
                id: 'node-ip',
                caseId: 'case-1',
                type: 'ip',
                value: '203.0.113.10',
                isSeed: false,
                source: 'mock_enrichment',
                createdAt: now,
              },
            ],
            edges: [
              {
                id: 'edge-1',
                caseId: 'case-1',
                from: 'node-seed',
                to: 'node-ip',
                relation: 'enriched_to',
                createdAt: now,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    fireEvent.change(screen.getByLabelText('Omnibox'), { target: { value: 'acme.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create + ingest' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'acme.test' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: '203.0.113.10' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Expand neighbors' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '203.0.113.10' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Hide ip'))
    expect(screen.queryByRole('button', { name: '203.0.113.10' })).not.toBeInTheDocument()

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:8088/api/v1/cases/case-1/graph?depth=0',
      expect.any(Object),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'http://localhost:8088/api/v1/cases/case-1/graph?depth=1',
      expect.any(Object),
    )
  })
})
