export type ApprovalRequest = {
  id: string;
  action: string;
  amountEth: number;
  timestamp: string;
};

export type Agent = {
  id: string;
  name: string;
  strategy: string;
  status: "running" | "paused";
  pnl: number;
  pendingApprovals: ApprovalRequest[];
};

export const mockAgents: Agent[] = [
  {
    id: "1",
    name: "ETH Rebalancer",
    strategy: "Rebalance ETH/USDC LP when price moves more than 5%.",
    status: "running",
    pnl: 142.38,
    pendingApprovals: [
      {
        id: "a1",
        action: "Swap ETH → USDC on Uniswap v3",
        amountEth: 2.5,
        timestamp: "2026-04-03T18:42:00Z",
      },
      {
        id: "a2",
        action: "Add liquidity to ETH/USDC pool",
        amountEth: 1.2,
        timestamp: "2026-04-03T18:55:00Z",
      },
      {
        id: "a3",
        action: "Remove out-of-range LP position",
        amountEth: 0.8,
        timestamp: "2026-04-03T19:10:00Z",
      },
    ],
  },
  {
    id: "2",
    name: "Momentum Trader",
    strategy: "Buy on 3% upward momentum, take profit at 8%.",
    status: "running",
    pnl: -28.91,
    pendingApprovals: [
      {
        id: "b1",
        action: "Market buy ETH on Uniswap",
        amountEth: 5.0,
        timestamp: "2026-04-03T17:30:00Z",
      },
      {
        id: "b2",
        action: "Set limit sell order at $3,400",
        amountEth: 5.0,
        timestamp: "2026-04-03T17:32:00Z",
      },
      {
        id: "b3",
        action: "Swap WBTC → ETH for rebalance",
        amountEth: 3.1,
        timestamp: "2026-04-03T18:01:00Z",
      },
    ],
  },
  {
    id: "3",
    name: "Yield Optimizer",
    strategy: "Rotate idle USDC into highest-yield Aave pool daily.",
    status: "paused",
    pnl: 67.14,
    pendingApprovals: [
      {
        id: "c1",
        action: "Deposit USDC into Aave v3",
        amountEth: 0.5,
        timestamp: "2026-04-03T12:00:00Z",
      },
      {
        id: "c2",
        action: "Withdraw from low-yield Compound pool",
        amountEth: 0.5,
        timestamp: "2026-04-03T12:05:00Z",
      },
      {
        id: "c3",
        action: "Claim accrued AAVE rewards",
        amountEth: 0.05,
        timestamp: "2026-04-03T12:10:00Z",
      },
    ],
  },
];
