"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getAgentById, ApiError } from "@/lib/api";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, signOut } = useAuth();

  const { data: agent, isLoading, error } = useQuery({
    queryKey: ["agent", id, token],
    queryFn: () => getAgentById(token!, Number(id)),
    enabled: !!token && !!id,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404)) return false;
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
        <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">Loading…</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-4">
        <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
          {error instanceof ApiError && error.status === 404 ? "Agent not found" : "Failed to load agent"}
        </p>
        <button
          onClick={() => router.back()}
          className="text-xs tracking-widest uppercase transition-colors"
          style={{ color: "#EA6189" }}
        >
          Go back
        </button>
      </div>
    );
  }

  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <div className="relative h-48 shrink-0 overflow-hidden">
        {agent.image_uri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.image_uri}
            alt={agent.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(ellipse at 30% 60%, rgba(234,97,137,0.2) 0%, transparent 65%), var(--surface)",
            }}
          >
            <span
              className="text-8xl font-light tracking-widest select-none"
              style={{ color: "rgba(234,97,137,0.3)" }}
            >
              {initials}
            </span>
          </div>
        )}
        {/* gradient fade to page bg */}
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{
            background: "linear-gradient(to top, var(--bg) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-8 px-6 pb-10 -mt-2">
        {/* Back + header row */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl tracking-wide text-[var(--text)]">{agent.name}</h1>
              <span
                className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border"
                style={{
                  color: agent.active ? "#4ade80" : "var(--text-muted)",
                  borderColor: agent.active ? "rgba(74,222,128,0.3)" : "rgba(107,114,128,0.3)",
                  backgroundColor: agent.active ? "rgba(74,222,128,0.08)" : "transparent",
                }}
              >
                <span
                  className="w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: agent.active ? "#4ade80" : "#6b7280",
                    boxShadow: agent.active ? "0 0 4px #4ade80" : "none",
                  }}
                />
                {agent.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#EA6189" }}>
              {agent.strategy_type}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Description */}
          {agent.description && (
            <Section label="Description">
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{agent.description}</p>
            </Section>
          )}

          {/* Strategy prompt */}
          <Section label="Strategy Prompt" className={!agent.description ? "md:col-span-2" : ""}>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
              {agent.strategy_prompt}
            </p>
          </Section>

          {/* Policy */}
          {agent.policy && Object.keys(agent.policy).length > 0 && (
            <Section label="Policy">
              <pre
                className="text-xs leading-relaxed overflow-x-auto rounded-lg p-3"
                style={{
                  backgroundColor: "rgba(234,97,137,0.05)",
                  color: "var(--text-muted)",
                  border: "1px solid rgba(234,97,137,0.1)",
                }}
              >
                {JSON.stringify(agent.policy, null, 2)}
              </pre>
            </Section>
          )}

          {/* Status */}
          {agent.status && Object.keys(agent.status).length > 0 && (
            <Section label="Status">
              <pre
                className="text-xs leading-relaxed overflow-x-auto rounded-lg p-3"
                style={{
                  backgroundColor: "rgba(234,97,137,0.05)",
                  color: "var(--text-muted)",
                  border: "1px solid rgba(234,97,137,0.1)",
                }}
              >
                {JSON.stringify(agent.status, null, 2)}
              </pre>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{ color: "#EA6189" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
