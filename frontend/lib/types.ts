export type Policy = {
  canTradeOn: string[]       // e.g. ["Uniswap", "Aave"]
  canTradeAssets: string[]   // e.g. ["ETH", "USDC", "WBTC"]
}

export type Strategy = {
  strategyType: string        // e.g. "LP Rebalancing", "Trend Following"
  strategyExplanation: string // plain English description written by the user
}

export type Agent = {
  id: string
  name: string
  description: string
  policy: Policy
  strategy: Strategy
}
