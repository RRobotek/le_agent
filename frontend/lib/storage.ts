import { Agent } from './types'

const STORAGE_KEY = 'leagent_agents'

// TODO: replace with API call
export function getAgents(): Agent[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Agent[]) : []
}

// TODO: replace with API call
export function saveAgent(agent: Agent): void {
  const agents = getAgents()
  const index = agents.findIndex(a => a.id === agent.id)
  if (index >= 0) {
    agents[index] = agent
  } else {
    agents.push(agent)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
}

// TODO: replace with API call
export function deleteAgent(id: string): void {
  const agents = getAgents().filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
}
