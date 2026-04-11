import { useState, useCallback, useRef } from 'react'
import { AgentId, AgentState, AnalysisResults } from '../types'

const AGENT_IDS: AgentId[] = ['agent1', 'agent2', 'agent3', 'agent4', 'agent5']

const initialAgentStates = (): Record<AgentId, AgentState> => ({
  agent1: { status: 'idle', messages: [], data: null },
  agent2: { status: 'idle', messages: [], data: null },
  agent3: { status: 'idle', messages: [], data: null },
  agent4: { status: 'idle', messages: [], data: null },
  agent5: { status: 'idle', messages: [], data: null },
  system: { status: 'idle', messages: [], data: null },
})

export function useAgentWebSocket() {
  const [agentStates, setAgentStates] = useState<Record<AgentId, AgentState>>(initialAgentStates())
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const reset = useCallback(() => {
    setAgentStates(initialAgentStates())
    setIsRunning(false)
    setIsComplete(false)
    setResults(null)
    setError(null)
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const connect = useCallback((jobId: string) => {
    const wsBase = import.meta.env.VITE_WS_URL || ''
    // If VITE_WS_URL is set use it directly, otherwise derive from current host
    const wsUrl = wsBase
      ? `${wsBase}/ws/${jobId}`
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/${jobId}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    setIsRunning(true)
    setError(null)

    ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data as string) as {
        agent: string
        status: string
        message: string
        data: unknown
      }
      const { agent, status, message, data } = msg

      if (status === 'complete') {
        setResults(data as AnalysisResults)
        setIsComplete(true)
        setIsRunning(false)
        return
      }

      if (status === 'error') {
        setError(message)
        setIsRunning(false)
        return
      }

      if (AGENT_IDS.includes(agent as AgentId)) {
        setAgentStates(prev => ({
          ...prev,
          [agent]: {
            status: status as AgentState['status'],
            messages: [...prev[agent as AgentId].messages, message],
            data: data ?? prev[agent as AgentId].data
          }
        }))
      }
    }

    ws.onerror = () => {
      setError('WebSocket connection error. Is the backend running on port 8000?')
      setIsRunning(false)
    }

    ws.onclose = () => {
      setIsRunning(false)
    }
  }, [])

  return { agentStates, isRunning, isComplete, results, error, connect, reset }
}
