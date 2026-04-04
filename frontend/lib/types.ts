export type PolymarketTrigger = {
  token_id: string
  threshold: number
  gt: boolean
}

export type Policy = {
  tokens: string[]
  contracts: string[]
  triggers: PolymarketTrigger[]
  rate_limit_24h: number
  value_limit_24h: number
}

export type Agent = {
  name: string
  owner: string
  description: string | null
  image_uri: string | null
  strategy: string
  active: boolean
  status: Record<string, unknown> | null
  policy: Policy | null
}

export type AgentCreate = {
  name: string
  strategy: string
  policy: Policy
  description?: string | null
  image_uri?: string | null
}

export type AgentUpdate = {
  name?: string
  description?: string | null
  image_uri?: string | null
  strategy?: string
  policy?: Policy
  active?: boolean
}

export type Trade = {
  tx_hash: string
  agent_name: string
  token_in: string
  token_out: string
  amount_in: string
  amount_out: string | null
  value_usd: string
  timestamp: string | null
  success: boolean | null
  tx_info: Record<string, unknown> | null
}
