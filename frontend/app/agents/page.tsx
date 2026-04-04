'use client'

import { useEffect, useState } from 'react'
import { Agent } from '@/lib/types'
import { getAgents } from '@/lib/storage'

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div
      className="rounded-xl p-5 border flex flex-col gap-2 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'rgba(234,97,137,0.2)',
      }}
    >
      <p className="text-xs tracking-widest uppercase" style={{ color: '#EA6189' }}>
        {agent.strategy.strategyType}
      </p>
      <h2 className="text-lg tracking-wide text-[var(--text)]">{agent.name}</h2>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{agent.description}</p>
    </div>
  )
}

function AgentSlot({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-5 border flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01] group min-h-[160px]"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'rgba(234,97,137,0.25)',
        borderStyle: 'dashed',
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: '#EA6189' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span className="text-xs tracking-widest uppercase" style={{ color: '#EA6189' }}>
        Add Agent
      </span>
    </button>
  )
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setAgents(getAgents())
    setLoaded(true)
  }, [])

  if (!loaded) return null

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
        <AgentSlot onClick={() => { /* TODO: open create agent modal */ }} />
      </div>
    </div>
  )
}
