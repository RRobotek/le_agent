"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getAgents, ApiError } from "@/lib/api";
import type { Agent } from "@/lib/types";

function AgentTile({ agent }: { agent: Agent }) {
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={`/agents/${agent.id}`} className="group block">
      <div
        className="relative aspect-square rounded-2xl overflow-hidden border transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_0_24px_rgba(234,97,137,0.2)]"
        style={{ borderColor: "rgba(234,97,137,0.15)" }}
      >
        {/* Image or placeholder */}
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

        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/5"
          style={{
            background:
              "linear-gradient(to top, rgba(9,9,11,0.85) 0%, transparent 100%)",
          }}
        />

        {/* Active indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: agent.active ? "#4ade80" : "#6b7280",
              boxShadow: agent.active ? "0 0 6px #4ade80" : "none",
            }}
          />
        </div>

        {/* Name + strategy type */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-0.5">
          <p
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "#EA6189" }}
          >
            {agent.strategy_type}
          </p>
          <h3 className="text-sm tracking-wide text-white leading-tight">
            {agent.name}
          </h3>
        </div>
      </div>
    </Link>
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

  if (error instanceof ApiError && error.status === 401) {
    signOut();
    return null;
  }

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
    <div className="flex flex-1 flex-col p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {agents.map((agent) => (
          <AgentTile key={agent.id} agent={agent} />
        ))}
        <AddTile onClick={() => {/* TODO: open create agent modal */}} />
      </div>
    </div>
  );
}
