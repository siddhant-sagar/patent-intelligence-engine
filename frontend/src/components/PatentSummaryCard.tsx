import { Building2, Calendar, Users, Tag, Quote, TrendingUp, Layers } from 'lucide-react'
import { PatentMetadata, TechnologyModule, Opportunity } from '../types'

interface PatentSummaryCardProps {
  metadata: PatentMetadata
  modules: TechnologyModule[]
  opportunities: Opportunity[]
  summaryBrief: string
  scores: {
    total_opportunities: number
    avg_composite_score: number
    top_domain: string
    top_score: number
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  sensor: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  algorithm: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  mechanism: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  actuator: 'bg-red-900/40 text-red-300 border-red-700/40',
  data_processing: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  control_system: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  material: 'bg-green-900/40 text-green-300 border-green-700/40',
  interface: 'bg-pink-900/40 text-pink-300 border-pink-700/40',
  other: 'bg-gray-700/40 text-gray-400 border-gray-600/40',
}

export default function PatentSummaryCard({
  metadata,
  modules,
  opportunities,
  summaryBrief,
  scores,
}: PatentSummaryCardProps) {
  const topScore = scores.top_score
  const scoreColor =
    topScore >= 80 ? 'text-green-400' : topScore >= 60 ? 'text-amber-400' : 'text-gray-400'

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-purple/20 text-brand-purple
                           border border-brand-purple/30 font-medium">
            {metadata.technical_domain}
          </span>
        </div>
        <h2 className="text-xl font-bold text-white leading-tight">{metadata.title}</h2>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-1.5">
          <Building2 size={14} className="text-gray-600" />
          <span>{metadata.assignee}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-gray-600" />
          <span>{metadata.filing_date}</span>
        </div>
        {metadata.inventors.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-gray-600" />
            <span>{metadata.inventors.slice(0, 2).join(', ')}
              {metadata.inventors.length > 2 && ` +${metadata.inventors.length - 2}`}
            </span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-dark-bg border border-dark-border rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Layers size={13} className="text-brand-purple" />
          </div>
          <p className="text-2xl font-bold text-white">{modules.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Tech Modules</p>
        </div>
        <div className="bg-dark-bg border border-dark-border rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={13} className="text-brand-cyan" />
          </div>
          <p className="text-2xl font-bold text-white">{scores.total_opportunities}</p>
          <p className="text-xs text-gray-500 mt-0.5">Opportunities</p>
        </div>
        <div className="bg-dark-bg border border-dark-border rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Tag size={13} className="text-green-400" />
          </div>
          <p className={`text-2xl font-bold ${scoreColor}`}>{topScore}</p>
          <p className="text-xs text-gray-500 mt-0.5">Top Score</p>
        </div>
      </div>

      {/* Plain English Summary */}
      <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Plain English Summary</p>
        <p className="text-gray-300 text-sm leading-relaxed">{metadata.plain_english_summary}</p>
      </div>

      {/* Key Claims */}
      {metadata.key_claims && metadata.key_claims.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Claims</p>
          <div className="space-y-2">
            {metadata.key_claims.slice(0, 5).map((claim, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-brand-purple/20 text-brand-purple
                                 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-gray-400 text-sm leading-relaxed">{claim}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technology Modules */}
      {modules.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Technology Modules</p>
          <div className="flex flex-wrap gap-2">
            {modules.map((mod, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium
                  ${CATEGORY_COLORS[mod.category] || CATEGORY_COLORS.other}`}
                title={mod.description}
              >
                {mod.module_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary Brief */}
      {summaryBrief && (
        <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Quote size={14} className="text-brand-purple" />
            <p className="text-xs font-semibold text-brand-purple uppercase tracking-wider">Executive Summary</p>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed italic">{summaryBrief}</p>
        </div>
      )}
    </div>
  )
}
