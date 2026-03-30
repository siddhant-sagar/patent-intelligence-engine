import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { Opportunity } from '../types'

interface ScoreRadarProps {
  opportunity: Opportunity
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm">
        <span className="text-brand-purple font-semibold">{payload[0].value.toFixed(0)}</span>
        <span className="text-gray-400">/100</span>
      </div>
    )
  }
  return null
}

export default function ScoreRadar({ opportunity }: ScoreRadarProps) {
  const data = [
    { dimension: 'Novelty', value: opportunity.novelty },
    { dimension: 'Modularity', value: opportunity.modularity },
    { dimension: 'Transferability', value: opportunity.transferability },
    { dimension: 'Feasibility', value: opportunity.feasibility },
    { dimension: 'Market', value: opportunity.market_potential },
  ]

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#374151" gridType="polygon" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#7C3AED"
            fill="#7C3AED"
            fillOpacity={0.35}
            dot={{ fill: '#7C3AED', r: 3, strokeWidth: 0 }}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
