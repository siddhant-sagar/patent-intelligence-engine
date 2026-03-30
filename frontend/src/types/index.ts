export type AgentId = 'agent1' | 'agent2' | 'agent3' | 'agent4' | 'agent5' | 'system'

export type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export interface AgentEvent {
  agent: AgentId
  status: AgentStatus | 'complete'
  message: string
  data: unknown
}

export interface AgentState {
  status: AgentStatus
  messages: string[]
  data: unknown
}

export interface TechnologyModule {
  module_name: string
  category: string
  description: string
  function: string
  generic_equivalent: string
}

export interface Opportunity {
  domain: string
  use_case: string
  analogy_explanation: string
  supporting_modules: string[]
  composite_score: number
  novelty: number
  modularity: number
  transferability: number
  feasibility: number
  market_potential: number
  action_recommendation: string
  strategy_brief: string
}

export interface PatentMetadata {
  title: string
  filing_date: string
  inventors: string[]
  assignee: string
  abstract: string
  key_claims: string[]
  technical_domain: string
  plain_english_summary: string
}

export interface AnalysisResults {
  patent_metadata: PatentMetadata
  modules: TechnologyModule[]
  graph_data: { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] }
  opportunities: Opportunity[]
  scores: {
    total_opportunities: number
    avg_composite_score: number
    top_domain: string
    top_score: number
  }
  summary_brief: string
}

export interface ReactFlowNodeData {
  label: string
  type: 'patent' | 'module' | 'domain' | 'application'
  description: string
  score?: number
  color: string
  category?: string
}

export interface ReactFlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: ReactFlowNodeData
}

export interface ReactFlowEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: string
  animated?: boolean
  style?: Record<string, string | number>
}
