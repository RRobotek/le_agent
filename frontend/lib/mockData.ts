import { Agent } from './types'

export const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Crisis Seller',
    description: 'Sells ETH into USDC when price drops more than 8% within a 15-minute window.',
    policy: {
      canTradeOn: ['Uniswap'],
      canTradeAssets: ['ETH', 'USDC'],
    },
    strategy: {
      strategyType: 'Live price feeds',
      strategyExplanation:
        'Monitor ETH/USDC price in real time. If ETH drops more than 8% in any 15-minute window, immediately swap 80% of ETH holdings into USDC to preserve value.',
    },
  },
  {
    id: '2',
    name: 'Panic Buyer',
    description: 'Buys ETH with USDC 6 hours after a rapid price dip, once the panic has settled.',
    policy: {
      canTradeOn: ['Uniswap'],
      canTradeAssets: ['ETH', 'USDC'],
    },
    strategy: {
      strategyType: 'Live price feeds',
      strategyExplanation:
        'Detect when ETH drops more than 12% in under an hour. Wait 6 hours for the panic to settle, then swap 50% of USDC holdings into ETH assuming a recovery bounce.',
    },
  },
]
