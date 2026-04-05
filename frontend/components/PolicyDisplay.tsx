"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTokenMap, type TokenInfo } from "@/lib/tokenList";
import type { Policy, PolymarketTrigger } from "@/lib/types";

function useTokenMap() {
  return useQuery({
    queryKey: ["uniswap-token-list"],
    queryFn: () => fetchTokenMap(1),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

const UNISWAP_ROUTERS: Record<string, string> = {
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "V2 Router",
  "0xe592427a0aece92de3edee1f18e0157c05861564": "V3 Router",
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "V3 Router 2",
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Universal Router",
};

const UNI_LOGO =
  "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png";

function trunc(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const chipBase: React.CSSProperties = {
  backgroundColor: "rgba(234,97,137,0.06)",
  border: "1px solid rgba(234,97,137,0.12)",
  color: "var(--text)",
};

function TokenChip({ address, token }: { address: string; token?: TokenInfo }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
      style={chipBase}
      title={address}
    >
      {token?.logoURI && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={token.logoURI}
          alt={token.symbol}
          width={14}
          height={14}
          className="rounded-full shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span className={token ? "tracking-wide" : "font-mono"}>
        {token ? token.symbol : trunc(address)}
      </span>
    </span>
  );
}

function ContractChip({ address }: { address: string }) {
  const name = UNISWAP_ROUTERS[address.toLowerCase()];
  return (
    <a
      href={`https://etherscan.io/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors"
      style={chipBase}
      title={address}
    >
      {name && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={UNI_LOGO} alt="Uniswap" width={13} height={13} className="rounded-full shrink-0" />
      )}
      <span className={name ? "tracking-wide" : "font-mono"}>
        {name ?? trunc(address)}
      </span>
    </a>
  );
}

function TriggerRow({ trigger }: { trigger: PolymarketTrigger }) {
  const { data } = useQuery({
    queryKey: ["polymarket-market", trigger.token_id],
    queryFn: async () => {
      const res = await fetch(`/api/polymarket-market?token_id=${encodeURIComponent(trigger.token_id)}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ question: string; image: string | null; lastTradePrice: number | null } | null>;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs"
      style={{ backgroundColor: "rgba(234,97,137,0.04)", border: "1px solid rgba(234,97,137,0.1)" }}
    >
      {data?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.image}
          alt=""
          width={20}
          height={20}
          className="rounded shrink-0 object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <span className="flex-1 truncate" style={{ color: "var(--text)" }}>
        {data?.question ?? <span className="font-mono text-[10px]">{trigger.token_id.slice(0, 16)}…</span>}
      </span>
      <span className="shrink-0 tabular-nums" style={{ color: "#EA6189" }}>
        {trigger.gt ? ">" : "≤"} {(trigger.threshold * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-[11px] tracking-[0.15em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

export function PolicyDisplay({ policy }: { policy: Policy }) {
  const { data: tokenMap } = useTokenMap();

  function tokenChip(address: string) {
    return (
      <TokenChip
        key={address}
        address={address}
        token={tokenMap?.get(address.toLowerCase())}
      />
    );
  }

  return (
    <div
      className="flex flex-col gap-5 rounded-xl p-4"
      style={{
        backgroundColor: "rgba(234,97,137,0.04)",
        border: "1px solid rgba(234,97,137,0.1)",
      }}
    >
      {/* Tokens */}
      <Row label="Whitelisted Tokens">
        <div className="flex flex-wrap gap-1.5">
          {policy.tokens.map((t) => tokenChip(t))}
        </div>
      </Row>

      {/* Contracts */}
      <Row label="Whitelisted Contracts">
        <div className="flex flex-wrap gap-1.5">
          {policy.contracts.map((c) => (
            <ContractChip key={c} address={c} />
          ))}
        </div>
      </Row>

      {/* Polymarket Triggers */}
      {policy.triggers.length > 0 && (
        <Row label="Polymarket Triggers">
          <div className="flex flex-col gap-1.5">
            {policy.triggers.map((t, i) => (
              <TriggerRow key={i} trigger={t} />
            ))}
          </div>
        </Row>
      )}

      {/* Limits */}
      <div className="grid grid-cols-2 gap-4">
        <Row label="Rate Limit (24h)">
          <p className="text-sm tabular-nums" style={{ color: "var(--text)" }}>
            {policy.rate_limit_24h.toLocaleString()}{" "}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              trades
            </span>
          </p>
        </Row>
        <Row label="Value Limit (24h)">
          <p className="text-sm tabular-nums" style={{ color: "var(--text)" }}>
            ${policy.value_limit_24h.toLocaleString()}{" "}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              USD
            </span>
          </p>
        </Row>
      </div>
    </div>
  );
}
