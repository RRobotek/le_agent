"use client";

import { useAccount, useReadContracts } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, maxUint256 } from "viem";
import { fetchTokenMap, type TokenInfo } from "@/lib/tokenList";

const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

function useTokenMap() {
  return useQuery({
    queryKey: ["uniswap-token-list"],
    queryFn: () => fetchTokenMap(1),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

function formatAllowance(raw: bigint, decimals: number): string {
  if (raw >= maxUint256 / 2n) return "Unlimited";
  const n = parseFloat(formatUnits(raw, decimals));
  if (n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toPrecision(5).replace(/\.?0+$/, "");
}

interface Props {
  contractAddress: string;
  tokens: string[];
  onSetAllowance: () => void;
}

export function AgentAllowances({ contractAddress, tokens, onSetAllowance }: Props) {
  const { address: walletAddress } = useAccount();
  const { data: tokenMap } = useTokenMap();

  // Build batched calls: [allowance, decimals] per token
  const calls = tokens.flatMap((addr) => [
    {
      address: addr as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance" as const,
      args: [walletAddress!, contractAddress as `0x${string}`] as const,
    },
    {
      address: addr as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "decimals" as const,
    },
  ]);

  const { data: results, isLoading } = useReadContracts({
    contracts: calls,
    query: { enabled: !!walletAddress && tokens.length > 0 },
  });

  if (!walletAddress) {
    return (
      <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
        Connect wallet to view allowances.
      </p>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(234,97,137,0.12)" }}>
      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(234,97,137,0.1)", background: "rgba(234,97,137,0.04)" }}>
            {["Token", "Your Allowance", ""].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left font-normal tracking-[0.12em] uppercase"
                style={{ color: "#EA6189", fontSize: "10px" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((addr, i) => {
            const info: TokenInfo | undefined = tokenMap?.get(addr.toLowerCase());
            const allowanceResult = results?.[i * 2];
            const decimalsResult = results?.[i * 2 + 1];
            const allowance = allowanceResult?.status === "success"
              ? (allowanceResult.result as bigint)
              : null;
            const decimals = decimalsResult?.status === "success"
              ? (decimalsResult.result as number)
              : (info?.decimals ?? 18);

            const isUnlimited = allowance !== null && allowance >= maxUint256 / 2n;

            return (
              <tr
                key={addr}
                style={{
                  borderBottom: i < tokens.length - 1 ? "1px solid rgba(107,114,128,0.1)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(107,114,128,0.02)",
                }}
              >
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                    {info?.logoURI && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={info.logoURI}
                        alt={info.symbol}
                        className="w-4 h-4 rounded-full shrink-0"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <span>{info ? info.symbol : <span className="font-mono">{addr.slice(0, 6)}…{addr.slice(-4)}</span>}</span>
                    {info && (
                      <span style={{ color: "var(--text-muted)" }}>{info.name}</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {isLoading ? (
                    <span style={{ color: "var(--text-muted)" }}>…</span>
                  ) : allowance === null ? (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  ) : (
                    <span style={{ color: isUnlimited ? "#4ade80" : allowance === 0n ? "#f87171" : "var(--text)" }}>
                      {formatAllowance(allowance, decimals)}
                      {info && !isUnlimited && allowance > 0n && (
                        <span className="ml-1" style={{ color: "var(--text-muted)" }}>{info.symbol}</span>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    onClick={onSetAllowance}
                    className="text-[10px] tracking-widest uppercase transition-colors px-2 py-1 rounded"
                    style={{ color: "#EA6189", border: "1px solid rgba(234,97,137,0.25)" }}
                  >
                    Set
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
