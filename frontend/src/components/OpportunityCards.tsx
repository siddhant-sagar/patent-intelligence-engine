import { Zap, TrendingUp } from 'lucide-react'
import { Opportunity } from '../types'
import ScoreRadar from './ScoreRadar'

interface OpportunityCardsProps {
  opportunities: Opportunity[]
}

const RANK_COLORS = [
  { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
  { badge: 'bg-gray-400/20 text-gray-300 border-gray-400/40', border: 'border-gray-600/30', glow: 'shadow-gray-400/5' },
  { badge: 'bg-orange-700/20 text-orange-400 border-orange-700/40', border: 'border-orange-700/20', glow: '' },
]

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-gray-400'
  const bgColor =
    score >= 80 ? 'bg-green-900/30 border-green-700/40' : score >= 60 ? 'bg-amber-900/30 border-amber-700/40' : 'bg-gray-700/30 border-gray-600/40'

  return (
    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border ${bgColor}`}>
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{score.toFixed(0)}</span>
      <div className="flex flex-col leading-none">
        <span className="text-gray-600 text-[9px]">/100</span>
        <span className={`text-[9px] font-medium ${color}`}>score</span>
      </div>
    </div>
  )
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? 'text-green-400' : value >= 60 ? 'text-amber-400' : 'text-gray-400'
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-dark-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${value}%`,
              background: value >= 80 ? '#4ade80' : value >= 60 ? '#f59e0b' : '#6B7280'
            }}
          />
        </div>
        <span className={`text-xs font-mono font-semibold w-7 text-right ${color}`}>
          {value.toFixed(0)}
        </span>
      </div>
    </div>
  )
}

function OpportunityCard({ opportunity, rank }: { opportunity: Opportunity; rank: number }) {
  const colors = RANK_COLORS[rank] || RANK_COLORS[2]

  return (
    <div className={`bg-dark-card border rounded-2xl overflow-hidden
                     shadow-xl ${colors.glow} ${colors.border} animate-slide-up`}
         style={{ animationDelay: `${rank * 0.1}s` }}>

      {/* Card Header */}
      <div className="p-5 pb-4 border-b border-dark-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`flex-shrink-0 w-8 h-8 rounded-xl border text-xs font-bold
                              flex items-center justify-center ${colors.badge}`}>
              #{rank + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-base truncate">{opportunity.domain}</h3>
              <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                <TrendingUp size={10} />
                Cross-industry opportunity
              </p>
            </div>
          </div>
          <ScoreBadge score={opportunity.composite_score} />
        </div>

        <h4 className="text-brand-purple font-semibold text-sm mt-3 leading-snug">
          {opportunity.use_case}
        </h4>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Analogy explanation */}
        <p className="text-gray-400 text-sm leading-relaxed">{opportunity.analogy_explanation}</p>

        {/* Supporting modules */}
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 font-medium">
            Supporting Modules
          </p>
          <div className="flex flex-wrap gap-1.5">
            {opportunity.supporting_modules.map((mod, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-brand-purple/10 border border-brand-purple/25
                                       text-brand-purple/80 rounded-lg font-medium">
                {mod}
              </span>
            ))}
          </div>
        </div>

        {/* Action recommendation */}
        <div className="bg-dark-bg border border-amber-700/30 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-amber-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Action Recommendation
            </span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{opportunity.action_recommendation}</p>
        </div>

        {/* Dimension scores */}
        <div className="bg-dark-bg/60 rounded-xl p-3.5">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-3 font-medium">
            Dimension Scores
          </p>
          <div className="space-y-1">
            <ScorePill label="Novelty" value={opportunity.novelty} />
            <ScorePill label="Modularity" value={opportunity.modularity} />
            <ScorePill label="Transferability" value={opportunity.transferability} />
            <ScorePill label="Feasibility" value={opportunity.feasibility} />
            <ScorePill label="Market Potential" value={opportunity.market_potential} />
          </div>
        </div>

        {/* Radar chart */}
        <ScoreRadar opportunity={opportunity} />

        {/* Strategy brief */}
        <p className="text-gray-500 text-xs italic leading-relaxed border-t border-dark-border pt-3">
          {opportunity.strategy_brief}
        </p>
      </div>
    </div>
  )
}

export default function OpportunityCards({ opportunities }: OpportunityCardsProps) {
  if (opportunities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
        No opportunities found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Top Opportunities</h3>
        <span className="text-xs text-gray-500 bg-dark-bg border border-dark-border
                         px-2.5 py-1 rounded-lg">
          {opportunities.length} domains ranked
        </span>
      </div>
      {opportunities.map((opp, i) => (
        <OpportunityCard key={opp.domain} opportunity={opp} rank={i} />
      ))}
    </div>
  )
}
