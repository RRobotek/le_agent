export type Policy = {
  tokens: string[]
  contracts: string[]
  price_range: Record<string, [string, string]>
  rate_limit_24h: number
  value_limit_24h: string
}

export type Agent = {
  id: number
  owner: string
  name: string
  description: string | null
  image_uri: string | null
  strategy_type: string
  strategy_prompt: string
  active: boolean
  status: Record<string, unknown> | null
  policy: Record<string, unknown> | null
}

export type AgentCreate = {
  name: string
  strategy_type: string
  strategy_prompt: string
  policy: Record<string, unknown>
  description?: string | null
  image_uri?: string | null
}

export type AgentUpdate = {
  name?: string
  description?: string | null
  image_uri?: string | null
  strategy_type?: string
  strategy_prompt?: string
  policy?: Record<string, unknown>
  active?: boolean
}

export type Trade = {
  tx_hash: string
  agent_id: number
  token_in: string
  token_out: string
  amount_in: string
  amount_out: string | null
  value_usd: number
  timestamp: string
  success: boolean
  tx_info: Record<string, unknown> | null
}
