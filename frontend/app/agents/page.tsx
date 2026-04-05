"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getAgents, ApiError } from "@/lib/api";
import type { Agent } from "@/lib/types";
import { CreateAgentModal } from "@/components/CreateAgentModal";

function AgentTile({ agent }: { agent: Agent }) {
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const shortWallet = agent.wallet
    ? `${agent.wallet.slice(0, 6)}...${agent.wallet.slice(-4)}`
    : null;

  return (
    <div className="flex flex-col">
      <Link href={`/agents/${encodeURIComponent(agent.name)}`} className="group block">
        <div
          className="relative aspect-square rounded-t-2xl overflow-hidden border-x border-t transition-all duration-150 group-hover:shadow-[0_0_24px_rgba(234,97,137,0.2)]"
          style={{ borderColor: "rgba(234,97,137,0.15)" }}
        >
          {agent.image_uri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.image_uri}
              alt={agent.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 40%, rgba(234,97,137,0.18) 0%, transparent 70%), var(--surface)",
              }}
            >
              <span
                className="text-5xl font-light tracking-widest select-none"
                style={{ color: "rgba(234,97,137,0.5)" }}
              >
                {initials}
              </span>
            </div>
          )}

          <div
            className="absolute inset-x-0 bottom-0 h-2/5"
            style={{
              background:
                "linear-gradient(to top, rgba(9,9,11,0.85) 0%, transparent 100%)",
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-150" />

          <div className="absolute top-3 right-3">
            <span
              className="w-1.5 h-1.5 rounded-full block"
              style={{
                backgroundColor: agent.running ? "#4ade80" : "#6b7280",
                boxShadow: agent.running ? "0 0 6px #4ade80" : "none",
              }}
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-sm tracking-wide text-white leading-tight">
              {agent.name}
            </h3>
          </div>
        </div>
      </Link>

      {shortWallet && (
        <a
          href={`https://etherscan.io/address/${agent.wallet}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group/sliver flex items-center justify-between px-3 py-1.5 rounded-b-2xl border-x border-b transition-all duration-150 hover:bg-[#EA6189]"
          style={{ borderColor: "rgba(234,97,137,0.15)" }}
        >
          <span className="text-xs font-mono text-[var(--text-muted)] group-hover/sliver:text-white transition-colors duration-150">
            {shortWallet}
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="stroke-[#EA6189] group-hover/sliver:stroke-white transition-colors duration-150">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}
    </div>
  );
}

function AddTile({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(234,97,137,0.15)]"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "rgba(234,97,137,0.2)",
        borderStyle: "dashed",
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: "rgba(234,97,137,0.12)" }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EA6189"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{ color: "#EA6189" }}
      >
        New Agent
      </span>
    </button>
  );
}

export default function AgentsPage() {
  const { token, signOut } = useAuth();
  const [creating, setCreating] = useState(false);

  const {
    data: agents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["agents", token],
    queryFn: () => getAgents(token!),
    enabled: !!token,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 401) return false;
      return failureCount < 2;
    },
  });

  const is401 = error instanceof ApiError && error.status === 401;
  useEffect(() => {
    if (is401) signOut();
  }, [is401, signOut]);

  if (is401) return null;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {agents.map((agent) => (
            <AgentTile key={agent.name} agent={agent} />
          ))}
          <AddTile onClick={() => setCreating(true)} />
        </div>
      </div>
      <CreateAgentModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
