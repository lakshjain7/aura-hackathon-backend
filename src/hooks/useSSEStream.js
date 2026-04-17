import { useState, useEffect, useRef, useCallback } from 'react'

export function useSSEStream(complaintId, options = {}) {
  const { enabled = true, maxEvents = 50 } = options
  const [nodeStates, setNodeStates] = useState({})
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const retriesRef = useRef(0)
  const eventSourceRef = useRef(null)

  const connect = useCallback(() => {
    if (!complaintId || !enabled) return

    const token = localStorage.getItem('aura_token') || 'demo'
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const url = `${baseURL}/stream/complaint/${complaintId}?token=${token}`

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      setError(null)
      retriesRef.current = 0
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setNodeStates(prev => ({
          ...prev,
          [data.node]: {
            status: data.status,
            duration: data.duration,
            summary: data.summary,
            timestamp: data.timestamp || new Date().toISOString(),
            data: data.data,
          }
        }))
        setEvents(prev => {
          const next = [{ ...data, receivedAt: new Date().toISOString() }, ...prev]
          return next.slice(0, maxEvents)
        })
      } catch (e) {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
      setConnected(false)
      if (retriesRef.current < 5) {
        const delay = Math.min(3000 * Math.pow(2, retriesRef.current), 30000)
        retriesRef.current++
        setTimeout(connect, delay)
      } else {
        setError('Connection lost. Please refresh.')
      }
    }
  }, [complaintId, enabled, maxEvents])

  useEffect(() => {
    connect()
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [connect])

  return { nodeStates, events, connected, error }
}

// Mock SSE for demo mode
export function useMockSSEStream() {
  const [nodeStates, setNodeStates] = useState({})
  const [events, setEvents] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const timeoutRefs = useRef([])

  const runPipeline = useCallback((scenario = 'normal') => {
    // Clear previous
    setNodeStates({})
    setEvents([])
    setIsRunning(true)
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []

    const nodes = [
      { node: 'input', name: 'Input Agent', duration: '0.8s', summary: 'Complaint received via web form' },
      { node: 'supervisor', name: 'Supervisor Agent', duration: '1.2s', summary: scenario === 'blocked' ? 'THREAT DETECTED: Prompt injection' : 'Input validated — no threats' },
      { node: 'translate', name: 'Translation Agent', duration: '2.1s', summary: 'తెలుగు → English translation complete' },
      { node: 'classify', name: 'Classification Agent', duration: '1.8s', summary: 'Category: Sanitation · Severity: HIGH · Confidence: 94%' },
      { node: 'route', name: 'Routing Agent', duration: '0.6s', summary: 'Routed to GHMC Sanitation, Madhapur Zone, Ward 14' },
      { node: 'auditor', name: 'Systemic Auditor', duration: '3.2s', summary: scenario === 'cluster' ? 'CLUSTER DETECTED: 18 complaints, Ward 14' : 'No systemic patterns detected' },
      { node: 'resolution', name: 'Resolution Agent', duration: '0.4s', summary: 'SLA timer started. Officer notified via WhatsApp.' },
      { node: 'learn', name: 'Feedback Agent', duration: '0.3s', summary: 'Classification logged. Model accuracy: 94.2%' },
    ]

    nodes.forEach((nodeData, index) => {
      // Running state
      const runDelay = index * 1200
      const t1 = setTimeout(() => {
        setNodeStates(prev => ({ ...prev, [nodeData.node]: { status: 'running', timestamp: new Date().toISOString() } }))
        setEvents(prev => [{ ...nodeData, status: 'running', type: 'node_transition', receivedAt: new Date().toISOString() }, ...prev])
      }, runDelay)
      timeoutRefs.current.push(t1)

      // Complete / blocked state
      const completeDelay = runDelay + 800
      const t2 = setTimeout(() => {
        if (scenario === 'blocked' && nodeData.node === 'supervisor') {
          setNodeStates(prev => ({ ...prev, [nodeData.node]: { status: 'blocked', duration: nodeData.duration, summary: nodeData.summary, timestamp: new Date().toISOString() } }))
          setEvents(prev => [{ ...nodeData, status: 'blocked', type: 'security_block', receivedAt: new Date().toISOString() }, ...prev])
          setIsRunning(false)
          return
        }
        const status = nodeData.node === 'classify' && scenario === 'low_confidence' ? 'review' : 'complete'
        setNodeStates(prev => ({ ...prev, [nodeData.node]: { status, duration: nodeData.duration, summary: nodeData.summary, timestamp: new Date().toISOString() } }))
        setEvents(prev => [{
          ...nodeData,
          status,
          type: nodeData.node === 'auditor' && scenario === 'cluster' ? 'cluster_detected' : 'node_transition',
          receivedAt: new Date().toISOString()
        }, ...prev])
        if (index === nodes.length - 1) setIsRunning(false)
      }, completeDelay)
      timeoutRefs.current.push(t2)
    })
  }, [])

  const reset = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
    setNodeStates({})
    setEvents([])
    setIsRunning(false)
  }, [])

  return { nodeStates, events, isRunning, runPipeline, reset, connected: true }
}
