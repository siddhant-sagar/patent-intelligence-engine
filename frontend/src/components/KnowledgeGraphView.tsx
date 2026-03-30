import { useCallback, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  FitViewOptions,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { X, Info } from 'lucide-react'
import { ReactFlowNodeData } from '../types'

// ── Custom Node ────────────────────────────────────────────────────────────────

const NODE_SIZES: Record<string, { w: number; h: number }> = {
  patent: { w: 180, h: 68 },
  module: { w: 150, h: 56 },
  domain: { w: 150, h: 56 },
  application: { w: 140, h: 50 },
}

function CustomNode({ data }: NodeProps<ReactFlowNodeData>) {
  const size = NODE_SIZES[data.type] || NODE_SIZES.module

  return (
    <div
      style={{
        width: size.w,
        minHeight: size.h,
        borderColor: data.color,
        borderTopWidth: 2,
        borderTopStyle: 'solid',
      }}
      className="bg-dark-card border border-dark-border/80 rounded-xl px-3 py-2.5
                 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
    >
      <Handle type="target" position={Position.Top} style={{ background: data.color, border: 'none', width: 6, height: 6 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: data.color, border: 'none', width: 6, height: 6 }} />

      <div className="flex items-start justify-between gap-1">
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2 flex-1">
          {data.label}
        </p>
        {typeof data.score === 'number' && (
          <span
            className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: `${data.color}25`, color: data.color }}
          >
            {data.score}
          </span>
        )}
      </div>

      {data.category && (
        <p className="text-[10px] mt-1 font-medium" style={{ color: `${data.color}99` }}>
          {data.category}
        </p>
      )}

      {data.type === 'patent' && (
        <p className="text-[10px] text-gray-600 mt-0.5">Patent Root</p>
      )}
    </div>
  )
}

const nodeTypes = { customNode: CustomNode }

const fitViewOptions: FitViewOptions = { padding: 0.15, duration: 600 }

// ── Legend ─────────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: '#7C3AED', label: 'Patent' },
    { color: '#9333EA', label: 'Module' },
    { color: '#0891B2', label: 'Domain' },
    { color: '#059669', label: 'Application' },
  ]
  return (
    <div className="absolute bottom-14 left-3 z-10 bg-dark-card/90 border border-dark-border
                    rounded-xl px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 font-medium">Legend</p>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Side Drawer ────────────────────────────────────────────────────────────────

interface DrawerProps {
  node: Node<ReactFlowNodeData> | null
  onClose: () => void
}

function NodeDrawer({ node, onClose }: DrawerProps) {
  if (!node) return null
  const { data } = node

  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-dark-card border-l border-dark-border
                    z-20 overflow-y-auto animate-slide-up shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-dark-border"
           style={{ borderTopColor: data.color, borderTopWidth: 3, borderTopStyle: 'solid' }}>
        <div>
          <span className="text-xs font-medium uppercase tracking-wider"
                style={{ color: data.color }}>
            {data.type}
          </span>
          <h3 className="text-white font-bold text-sm mt-0.5 leading-snug">{data.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-white transition-colors p-1"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {typeof data.score === 'number' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Similarity Score</span>
            <span className="text-sm font-bold" style={{ color: data.color }}>
              {data.score}/100
            </span>
          </div>
        )}

        {data.category && (
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Category</p>
            <span className="text-xs px-2 py-1 rounded-lg bg-dark-bg border border-dark-border text-gray-300">
              {data.category}
            </span>
          </div>
        )}

        {data.description && (
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-gray-300 leading-relaxed">{data.description}</p>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-dark-bg rounded-xl border border-dark-border">
          <Info size={13} className="text-gray-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Node ID: <span className="font-mono text-gray-400">{node.id}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface KnowledgeGraphViewProps {
  graphData: { nodes: object[]; edges: object[] }
}

export default function KnowledgeGraphView({ graphData }: KnowledgeGraphViewProps) {
  const [nodes, , onNodesChange] = useNodesState(graphData.nodes as Node[])
  const [edges, , onEdgesChange] = useEdgesState(graphData.edges as Edge[])
  const [selectedNode, setSelectedNode] = useState<Node<ReactFlowNodeData> | null>(null)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<ReactFlowNodeData>)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  if (!nodes.length) {
    return (
      <div className="h-[600px] flex items-center justify-center text-gray-600 text-sm
                       bg-dark-bg rounded-xl border border-dark-border">
        Graph data not available
      </div>
    )
  }

  return (
    <div className="relative h-[600px] rounded-xl overflow-hidden border border-dark-border bg-dark-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={fitViewOptions}
        minZoom={0.3}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1F2333"
        />
        <Controls
          style={{
            background: '#1A1D26',
            border: '1px solid #2D3748',
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            background: '#0F1117',
            border: '1px solid #2D3748',
            borderRadius: 8,
          }}
          nodeColor={(n) => {
            const d = n.data as ReactFlowNodeData
            return d?.color || '#6B7280'
          }}
          maskColor="#0F111780"
        />
      </ReactFlow>

      <Legend />
      <NodeDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  )
}
