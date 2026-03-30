import { useState, useEffect } from 'react'
import {
  Brain, Github, AlertTriangle, LayoutDashboard,
  Network, TrendingUp, Download, Cpu
} from 'lucide-react'
import UploadPanel from './components/UploadPanel'
import AgentStream from './components/AgentStream'
import KnowledgeGraphView from './components/KnowledgeGraphView'
import OpportunityCards from './components/OpportunityCards'
import PatentSummaryCard from './components/PatentSummaryCard'
import ExportButton from './components/ExportButton'
import { useAgentWebSocket } from './hooks/useAgentWebSocket'

type Tab = 'overview' | 'graph' | 'opportunities' | 'export'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
  { id: 'graph', label: 'Knowledge Graph', icon: <Network size={14} /> },
  { id: 'opportunities', label: 'Opportunities', icon: <TrendingUp size={14} /> },
  { id: 'export', label: 'Export', icon: <Download size={14} /> },
]

const API_BASE = import.meta.env.VITE_API_URL || ''

// ── Server Wake Banner ─────────────────────────────────────────────────────────
function WakingBanner() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 3, 95))
    }, 900)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mb-4 p-3.5 bg-amber-900/20 border border-amber-700/40 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={14} className="text-amber-400" />
        <span className="text-amber-300 text-sm font-medium">Server waking up (~30 seconds)</span>
      </div>
      <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-amber-600 text-xs mt-1.5">Free tier containers spin down after inactivity.</p>
    </div>
  )
}

// ── Processing Overlay ─────────────────────────────────────────────────────────
function ProcessingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-brand-purple/20 flex items-center justify-center">
          <Brain size={28} className="text-brand-purple" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-brand-purple animate-ping opacity-30" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold">Agents Processing</p>
        <p className="text-gray-500 text-sm mt-1">Results will appear here when complete</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-brand-purple animate-dot-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Welcome Panel ──────────────────────────────────────────────────────────────
function WelcomePanel() {
  const features = [
    { icon: <Cpu size={16} className="text-brand-purple" />, text: '5 specialized AI agents in sequential pipeline' },
    { icon: <Brain size={16} className="text-brand-cyan" />, text: 'Real-time streaming via WebSocket' },
    { icon: <Network size={16} className="text-green-400" />, text: 'Interactive knowledge graph visualization' },
    { icon: <TrendingUp size={16} className="text-amber-400" />, text: 'Multi-dimensional opportunity scoring' },
  ]

  return (
    <div className="flex flex-col justify-center h-full min-h-[400px] py-8">
      <div className="space-y-6 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan
                          flex items-center justify-center mx-auto shadow-xl shadow-brand-purple/20">
            <Brain size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Patent Intelligence Engine</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Upload any patent and watch 5 AI agents analyze it for cross-industry commercialization opportunities in real time.
          </p>
        </div>

        <div className="grid gap-3">
          {features.map((f, i) => (
            <div key={i}
                 className="flex items-center gap-3 p-3 bg-dark-card border border-dark-border
                            rounded-xl text-sm text-gray-300">
              <div className="flex-shrink-0">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>

        <div className="bg-brand-purple/10 border border-brand-purple/25 rounded-xl p-4 text-sm">
          <p className="text-gray-400 leading-relaxed">
            <span className="text-brand-purple font-medium">How to start:</span> Drop a patent PDF or paste a Google Patents URL on the left, then click{' '}
            <span className="text-white font-medium">Analyze Patent</span>.
            Use the sample patent button for an instant demo.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { n: '5', label: 'AI Agents' },
            { n: '~2min', label: 'Analysis Time' },
            { n: '3', label: 'Top Opportunities' },
          ].map(s => (
            <div key={s.label} className="bg-dark-card border border-dark-border rounded-xl p-3">
              <p className="text-xl font-bold text-white">{s.n}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [serverDown, setServerDown] = useState(false)
  const { agentStates, isRunning, isComplete, results, error, connect, reset } = useAgentWebSocket()

  // Health check
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`)
        setServerDown(!res.ok)
      } catch {
        setServerDown(true)
      }
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleJobStart = (jobId: string) => {
    reset()
    setActiveTab('overview')
    connect(jobId)
  }

  const handleReset = () => {
    reset()
  }

  // Auto-switch to opportunities tab when done
  useEffect(() => {
    if (isComplete && results) {
      const timer = setTimeout(() => setActiveTab('overview'), 500)
      return () => clearTimeout(timer)
    }
  }, [isComplete, results])

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 flex flex-col">
      {/* Nav */}
      <header className="border-b border-dark-border bg-dark-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan
                            flex items-center justify-center shadow-lg shadow-brand-purple/30">
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm sm:text-base">Patent Intelligence Engine</span>
              <span className="hidden sm:block text-xs text-gray-600 leading-none">Agentic AI for IP Commercialization</span>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <Github size={16} />
            <span className="hidden sm:inline">View on GitHub</span>
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {serverDown && <WakingBanner />}

        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-900/20 border border-red-800/40
                          rounded-xl text-red-400 text-sm animate-fade-in">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Analysis Error</p>
              <p className="text-red-400/80 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            {/* Upload */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-brand-purple/20 flex items-center justify-center">
                  <Brain size={13} className="text-brand-purple" />
                </div>
                <h2 className="font-semibold text-white text-sm">Patent Input</h2>
              </div>
              <UploadPanel
                onJobStart={handleJobStart}
                isRunning={isRunning}
                onReset={handleReset}
              />
            </div>

            {/* Agent stream */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-xl">
              <AgentStream
                agentStates={agentStates}
                isRunning={isRunning}
                isComplete={isComplete}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="bg-dark-card border border-dark-border rounded-2xl shadow-xl overflow-hidden
                          flex flex-col min-h-[500px]">
            {/* Tabs */}
            <div className="flex border-b border-dark-border bg-dark-bg/40 flex-shrink-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={!isComplete && tab.id !== 'overview'}
                  className={`
                    flex items-center gap-1.5 px-3 py-3 text-xs font-medium
                    border-b-2 transition-all duration-200 flex-1 justify-center
                    ${activeTab === tab.id
                      ? 'border-brand-purple text-brand-purple'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                    }
                    ${(!isComplete && tab.id !== 'overview') ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'overview' && (
                <>
                  {!isRunning && !isComplete && <WelcomePanel />}
                  {isRunning && !isComplete && <ProcessingPlaceholder />}
                  {isComplete && results && (
                    <PatentSummaryCard
                      metadata={results.patent_metadata}
                      modules={results.modules}
                      opportunities={results.opportunities}
                      summaryBrief={results.summary_brief}
                      scores={results.scores}
                    />
                  )}
                </>
              )}

              {activeTab === 'graph' && (
                <>
                  {isComplete && results ? (
                    <KnowledgeGraphView graphData={results.graph_data} />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                      Complete an analysis to view the knowledge graph
                    </div>
                  )}
                </>
              )}

              {activeTab === 'opportunities' && (
                <>
                  {isComplete && results ? (
                    <OpportunityCards opportunities={results.opportunities} />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                      Complete an analysis to view opportunities
                    </div>
                  )}
                </>
              )}

              {activeTab === 'export' && (
                <>
                  {isComplete && results ? (
                    <ExportButton results={results} />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                      Complete an analysis to export results
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border mt-8 py-4 px-6">
        <p className="text-center text-xs text-gray-700">
          Patent Intelligence Engine · Built with Gemini 2.0 Flash + LangGraph + React Flow
        </p>
      </footer>
    </div>
  )
}
