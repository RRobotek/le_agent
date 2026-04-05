export type TokenInfo = {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

type TokenList = {
  tokens: TokenInfo[]
}

const UNISWAP_TOKEN_LIST = "https://tokens.uniswap.org/"

let cache: Map<string, TokenInfo> | null = null

export async function fetchTokenMap(chainId = 1): Promise<Map<string, TokenInfo>> {
  if (cache) return cache

  const res = await fetch(UNISWAP_TOKEN_LIST)
  if (!res.ok) throw new Error("Failed to fetch token list")

  const data: TokenList = await res.json()

  cache = new Map(
    data.tokens
      .filter((t) => t.chainId === chainId)
      .map((t) => [t.address.toLowerCase(), t]),
  )

  return cache
}
