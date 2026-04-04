"use client";

import type { Policy } from "@/lib/types";

function trunc(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function AddrChip({ address }: { address: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono tracking-wide"
      style={{
        backgroundColor: "rgba(234,97,137,0.06)",
        border: "1px solid rgba(234,97,137,0.12)",
        color: "var(--text-muted)",
      }}
      title={address}
    >
      {trunc(address)}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-[10px] tracking-[0.15em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

export function PolicyDisplay({ policy }: { policy: Policy }) {
  const hasPriceRange = Object.keys(policy.price_range ?? {}).length > 0;

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
          {policy.tokens.map((t) => (
            <AddrChip key={t} address={t} />
          ))}
        </div>
      </Row>

      {/* Contracts */}
      <Row label="Whitelisted Contracts">
        <div className="flex flex-wrap gap-1.5">
          {policy.contracts.map((c) => (
            <AddrChip key={c} address={c} />
          ))}
        </div>
      </Row>

      {/* Price range */}
      {hasPriceRange && (
        <Row label="Price Range">
          <div className="flex flex-col gap-1.5">
            {Object.entries(policy.price_range).map(([addr, [min, max]]) => (
              <div
                key={addr}
                className="flex items-center gap-3 flex-wrap"
              >
                <AddrChip address={addr} />
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  ${Number(min).toLocaleString()} –{" "}
                  <span style={{ color: "var(--text)" }}>
                    ${Number(max).toLocaleString()}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Row>
      )}

      {/* Limits */}
      <div className="grid grid-cols-2 gap-4">
        <Row label="Rate Limit (24h)">
          <p className="text-sm tabular-nums" style={{ color: "var(--text)" }}>
            {policy.rate_limit_24h.toLocaleString()}{" "}
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              trades
            </span>
          </p>
        </Row>
        <Row label="Value Limit (24h)">
          <p className="text-sm tabular-nums" style={{ color: "var(--text)" }}>
            ${Number(policy.value_limit_24h).toLocaleString()}{" "}
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              USD
            </span>
          </p>
        </Row>
      </div>
    </div>
  );
}
