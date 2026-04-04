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
  pkey: string
  policy: Record<string, unknown>
  description?: string | null
  image_uri?: string | null
}
