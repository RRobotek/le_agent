"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  getAgentByName,
  getAgentTrades,
  updateAgent,
  deleteAgent,
  ApiError,
} from "@/lib/api";
import type { Agent, Trade, Policy } from "@/lib/types";
import { CreateAgentModal, EMPTY_POLICY } from "@/components/CreateAgentModal";
import { PolicyDisplay } from "@/components/PolicyDisplay";

/* ── Active toggle ────────────────────────────────────────────── */

function ActiveToggle({
  active,
  onChange,
  disabled,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className="relative flex items-center shrink-0 transition-opacity disabled:opacity-50"
      style={{ width: 36, height: 20 }}
    >
      <span
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{
          backgroundColor: active ? "#EA6189" : "rgba(107,114,128,0.35)",
          boxShadow: active ? "0 0 8px rgba(234,97,137,0.4)" : "none",
        }}
      />
      <span
        className="absolute w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: active ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

/* ── Trades table ─────────────────────────────────────────────── */

function fmt(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function TradesTable({ trades, loading }: { trades: Trade[]; loading: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p
          className="text-[10px] tracking-[0.2em] uppercase shrink-0"
          style={{ color: "#EA6189" }}
        >
          Trades
        </p>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "rgba(234,97,137,0.12)" }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
            Loading…
          </p>
        </div>
      ) : trades.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
            No trades yet
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(234,97,137,0.1)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(234,97,137,0.1)" }}>
                {["Date", "Swap", "Value", "Status", "Tx"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] tracking-[0.15em] uppercase font-normal"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, i) => (
                <tr
                  key={trade.tx_hash}
                  style={{
                    borderBottom:
                      i < trades.length - 1
                        ? "1px solid rgba(234,97,137,0.06)"
                        : "none",
                  }}
                >
                  <td
                    className="px-4 py-3 text-xs tabular-nums"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fmt(trade.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs tracking-wider uppercase font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {trade.token_in}
                    </span>
                    <span
                      className="mx-1.5 text-xs"
                      style={{ color: "#EA6189" }}
                    >
                      →
                    </span>
                    <span
                      className="text-xs tracking-wider uppercase font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {trade.token_out}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-xs tabular-nums"
                    style={{ color: "var(--text)" }}
                  >
                    ${Number(trade.value_usd).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                      style={{
                        color: trade.success ? "#4ade80" : "#f87171",
                        backgroundColor: trade.success
                          ? "rgba(74,222,128,0.08)"
                          : "rgba(248,113,113,0.08)",
                        border: `1px solid ${trade.success ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                      }}
                    >
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{
                          backgroundColor: trade.success ? "#4ade80" : "#f87171",
                        }}
                      />
                      {trade.success ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: "var(--text-muted)" }}
                      title={trade.tx_hash}
                    >
                      {truncHash(trade.tx_hash)}
                    </span>
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

/* ── Section helper ───────────────────────────────────────────── */

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

/* ── Main page ────────────────────────────────────────────────── */

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const name = decodeURIComponent(id);

  const {
    data: agent,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["agent", name, token],
    queryFn: () => getAgentByName(token!, name),
    enabled: !!token && !!name,
    retry: (failureCount, err) => {
      if (
        err instanceof ApiError &&
        [401, 403, 404].includes(err.status)
      )
        return false;
      return failureCount < 2;
    },
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ["trades", name, token],
    queryFn: () => getAgentTrades(token!, name),
    enabled: !!token && !!name && !!agent,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 401) return false;
      return failureCount < 2;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (active: boolean) => updateAgent(token!, name, { active }),
    onMutate: async (active) => {
      await queryClient.cancelQueries({ queryKey: ["agent", name] });
      const prev = queryClient.getQueryData<Agent>(["agent", name, token]);
      queryClient.setQueryData(["agent", name, token], (old: Agent) => ({
        ...old,
        active,
      }));
      return { prev };
    },
    onError: (_err, _active, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(["agent", name, token], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", name] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAgent(token!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      router.push("/agents");
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

  if (error || !agent) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-4">
        <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
          {error instanceof ApiError && error.status === 404
            ? "Agent not found"
            : "Failed to load agent"}
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

  const editInitialValues = {
    name: agent.name,
    description: agent.description ?? "",
    image_uri: agent.image_uri ?? "",
    strategy: agent.strategy,
    policy: agent.policy ?? EMPTY_POLICY,
  };

  return (
    <>
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
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{
              background:
                "linear-gradient(to top, var(--bg) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 px-6 pb-10 -mt-2">
          {/* Header row */}
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="mt-1.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl tracking-wide text-[var(--text)]">
                  {agent.name}
                </h1>
                <span
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border"
                  style={{
                    color: agent.active ? "#4ade80" : "var(--text-muted)",
                    borderColor: agent.active
                      ? "rgba(74,222,128,0.3)"
                      : "rgba(107,114,128,0.3)",
                    backgroundColor: agent.active
                      ? "rgba(74,222,128,0.08)"
                      : "transparent",
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
            </div>

            {/* Action controls */}
            <div className="flex items-center gap-3 shrink-0 mt-1">
              <ActiveToggle
                active={agent.active}
                onChange={(v) => toggleMutation.mutate(v)}
                disabled={toggleMutation.isPending}
              />

              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                aria-label="Edit agent"
              >
                <Pencil size={14} />
              </button>

              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] tracking-widest uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Sure?
                  </span>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="text-[10px] tracking-widest uppercase transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="text-[10px] tracking-widest uppercase transition-colors disabled:opacity-50"
                    style={{ color: "#f87171" }}
                  >
                    {deleteMutation.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="p-2 rounded-lg transition-colors text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--surface)]"
                  aria-label="Delete agent"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {agent.description && (
              <Section label="Description">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {agent.description}
                </p>
              </Section>
            )}

            <Section
              label="Strategy"
              className={!agent.description ? "md:col-span-2" : ""}
            >
              <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                {agent.strategy}
              </p>
            </Section>

            {agent.policy && Object.keys(agent.policy).length > 0 && (
              <Section label="Policy">
                <PolicyDisplay policy={agent.policy as unknown as Policy} />
              </Section>
            )}

            {agent.status && Object.keys(agent.status).length > 0 && (
              <Section label="Status">
                <pre
                  className="text-xs leading-relaxed overflow-x-auto rounded-xl p-3"
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

          {/* Trades */}
          <div className="max-w-4xl w-full">
            <TradesTable trades={trades} loading={tradesLoading} />
          </div>
        </div>
      </div>

      <CreateAgentModal
        open={editing}
        onClose={() => setEditing(false)}
        agentName={agent.name}
        initialValues={editInitialValues}
      />
    </>
  );
}
