import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Loader } from 'lucide-react'
import { AgentId, AgentState } from '../types'

interface AgentInfo {
  id: AgentId
  name: string
  description: string
  number: number
}

const AGENTS: AgentInfo[] = [
  { id: 'agent1', number: 1, name: 'Ingestion Agent', description: 'Parses patent text from PDF or URL' },
  { id: 'agent2', number: 2, name: 'Decomposition Agent', description: 'Extracts reusable technology modules' },
  { id: 'agent3', number: 3, name: 'Analogy Agent', description: 'Maps modules to cross-industry applications' },
  { id: 'agent4', number: 4, name: 'Knowledge Graph Agent', description: 'Builds relational opportunity graph' },
  { id: 'agent5', number: 5, name: 'Evaluation Agent', description: 'Scores and ranks strategic opportunities' },
]

interface AgentRowProps {
  agent: AgentInfo
  state: AgentState
}

function StatusIcon({ status }: { status: AgentState['status'] }) {
  if (status === 'idle') {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0" />
    )
  }
  if (status === 'running') {
    return (
      <div className="relative flex-shrink-0">
        <div className="w-5 h-5 rounded-full border-2 border-brand-purple animate-spin
                        border-t-transparent" />
      </div>
    )
  }
  if (status === 'done') {
    return <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
  }
  return <XCircle size={20} className="text-red-400 flex-shrink-0" />
}

function AgentRow({ agent, state }: AgentRowProps) {
  const [expanded, setExpanded] = useState(true)
  const hasMessages = state.messages.length > 0
  const isActive = state.status === 'running' || state.status === 'done'

  const numberBgColors: Record<string, string> = {
    idle: 'bg-gray-700 text-gray-400',
    running: 'bg-brand-purple text-white',
    done: 'bg-green-600/30 text-green-400',
    error: 'bg-red-600/30 text-red-400',
  }

  return (
    <div
      className={`
        rounded-xl border transition-all duration-300
        ${state.status === 'running'
          ? 'border-brand-purple/60 bg-dark-card shadow-md shadow-brand-purple/10 animate-glow-border'
          : state.status === 'done'
          ? 'border-green-800/40 bg-dark-card/60'
          : 'border-dark-border bg-dark-card/40'
        }
      `}
    >
      <div
        className={`flex items-center gap-3 p-4 ${hasMessages ? 'cursor-pointer' : ''}`}
        onClick={() => hasMessages && setExpanded(e => !e)}
      >
        {/* Number badge */}
        <div className={`
          w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
          transition-colors duration-300 ${numberBgColors[state.status]}
        `}>
          {agent.number}
        </div>

        {/* Agent info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm transition-colors duration-200
              ${state.status === 'running' ? 'text-white' : state.status === 'done' ? 'text-green-300' : 'text-gray-300'}`}>
              {agent.name}
            </span>
            {state.status === 'running' && (
              <span className="text-xs text-brand-purple/80 font-mono animate-pulse">PROCESSING</span>
            )}
            {state.status === 'done' && (
              <span className="text-xs text-green-500/80 font-mono">COMPLETE</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.description}</p>
        </div>

        {/* Status icon + expand toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon status={state.status} />
          {hasMessages && (
            <span className="text-gray-600 hover:text-gray-400 transition-colors">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </div>
      </div>

      {/* Message log */}
      {hasMessages && expanded && (
        <div className="mx-4 mb-4 rounded-lg bg-dark-bg/80 border border-dark-border overflow-hidden">
          <div className="px-3 py-1.5 border-b border-dark-border/50 flex items-center gap-1.5">
            <Loader size={10} className="text-gray-600" />
            <span className="text-gray-600 text-[10px] font-mono uppercase tracking-wider">Agent Log</span>
          </div>
          <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto scroll-smooth">
            {state.messages.map((msg, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-brand-purple/50 font-mono text-[10px] mt-0.5 flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-gray-400 text-xs font-mono leading-relaxed">{msg}</p>
              </div>
            ))}
            {state.status === 'running' && (
              <div className="flex items-center gap-1.5 pl-7">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-brand-purple animate-dot-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface AgentStreamProps {
  agentStates: Record<AgentId, AgentState>
  isRunning: boolean
  isComplete: boolean
}

export default function AgentStream({ agentStates, isRunning, isComplete }: AgentStreamProps) {
  const activeCount = Object.values(agentStates).filter(s => s.status === 'done').length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">Agent Pipeline</span>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-brand-purple">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse" />
              Live
            </span>
          )}
        </div>
        {(isRunning || isComplete) && (
          <span className="text-xs text-gray-500 font-mono">
            {activeCount}/5 complete
          </span>
        )}
      </div>

      {/* Progress bar */}
      {(isRunning || isComplete) && (
        <div className="h-1 bg-dark-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan rounded-full
                       transition-all duration-700 ease-out"
            style={{ width: `${(activeCount / 5) * 100}%` }}
          />
        </div>
      )}

      {/* Agent rows */}
      {AGENTS.map(agent => (
        <AgentRow
          key={agent.id}
          agent={agent}
          state={agentStates[agent.id]}
        />
      ))}

      {isComplete && (
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/40
                        rounded-xl text-green-400 text-sm font-medium animate-fade-in">
          <CheckCircle size={16} />
          All agents complete — results ready
        </div>
      )}
    </div>
  )
}
