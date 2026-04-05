"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { getAgentTrades } from "@/lib/api";
import { fetchTokenMap, type TokenInfo } from "@/lib/tokenList";
import type { Trade } from "@/lib/types";

function useTokenMap() {
  return useQuery({
    queryKey: ["uniswap-token-list"],
    queryFn: () => fetchTokenMap(1),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

function TokenLabel({ address, map }: { address: string; map?: Map<string, TokenInfo> }) {
  const info = map?.get(address.toLowerCase());
  if (!info) return <span className="font-mono">{address.slice(0, 6)}…{address.slice(-4)}</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {info.logoURI && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={info.logoURI} alt={info.symbol} className="w-4 h-4 rounded-full shrink-0"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      )}
      <span>{info.symbol}</span>
    </span>
  );
}

function formatAmt(raw: string | null): string {
  if (!raw) return "—";
  const n = parseFloat(raw);
  if (isNaN(n)) return raw;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n < 0.0001) return n.toExponential(2);
  return n.toPrecision(5).replace(/\.?0+$/, "");
}

function formatTime(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface Props {
  agentName: string;
  token: string;
}

export function AgentTrades({ agentName, token }: Props) {
  const { data: tokenMap } = useTokenMap();
  const { data: trades, isLoading, error } = useQuery({
    queryKey: ["agent-trades", agentName, token],
    queryFn: () => getAgentTrades(token, agentName),
    enabled: !!token && !!agentName,
    refetchInterval: 30_000,
  });

  return (
    <div className="flex flex-col gap-3">
      {isLoading && (
        <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">Loading trades…</p>
      )}
      {error && (
        <p className="text-xs text-red-400">Failed to load trades.</p>
      )}
      {!isLoading && !error && (!trades || trades.length === 0) && (
        <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">No trades yet.</p>
      )}
      {trades && trades.length > 0 && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgba(234,97,137,0.12)" }}>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(234,97,137,0.1)", background: "rgba(234,97,137,0.04)" }}>
                {["Time", "Swap", "Amount In", "Amount Out", "Value", "Status", "TX"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left font-normal tracking-[0.12em] uppercase whitespace-nowrap"
                    style={{ color: "#EA6189", fontSize: "10px" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade: Trade, i: number) => (
                <tr
                  key={trade.tx_hash}
                  style={{
                    borderBottom: i < trades.length - 1 ? "1px solid rgba(107,114,128,0.1)" : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(107,114,128,0.02)",
                  }}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {formatTime(trade.timestamp)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "var(--text)" }}>
                    <span className="inline-flex items-center gap-1.5">
                      <TokenLabel address={trade.token_in} map={tokenMap} />
                      <span style={{ color: "var(--text-muted)" }}>→</span>
                      <TokenLabel address={trade.token_out} map={tokenMap} />
                    </span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums whitespace-nowrap" style={{ color: "var(--text)" }}>
                    {formatAmt(trade.amount_in)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums whitespace-nowrap" style={{ color: "var(--text)" }}>
                    {formatAmt(trade.amount_out)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums whitespace-nowrap" style={{ color: "var(--text)" }}>
                    {trade.value_usd ? `$${parseFloat(trade.value_usd).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {trade.success === true && <CheckCircle2 size={13} className="text-green-400" />}
                    {trade.success === false && <XCircle size={13} className="text-red-400" />}
                    {trade.success === null && <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <a
                      href={`https://etherscan.io/tx/${trade.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 transition-colors hover:text-[#EA6189]"
                      style={{ color: "var(--text-muted)" }}
                      title={trade.tx_hash}
                    >
                      <span className="font-mono">{trade.tx_hash.slice(0, 6)}…</span>
                      <ExternalLink size={10} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
