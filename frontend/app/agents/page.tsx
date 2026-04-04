'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { getAgents, ApiError } from '@/lib/api'
import type { Agent } from '@/lib/types'

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
        {agent.strategy_type}
      </p>
      <h2 className="text-lg tracking-wide text-[var(--text)]">{agent.name}</h2>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
        {agent.description ?? agent.strategy_prompt}
      </p>
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
  const { token, signOut } = useAuth()

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents', token],
    queryFn: () => getAgents(token!),
    enabled: !!token,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 401) return false
      return failureCount < 2
    },
  })

  // Token expired or revoked — force re-auth
  if (error instanceof ApiError && error.status === 401) {
    signOut()
    return null
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">Loading…</p>
      </div>
    )
  }

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
