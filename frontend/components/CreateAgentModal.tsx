"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createAgent, updateAgent, ApiError } from "@/lib/api";
import { fetchTokenMap, type TokenInfo } from "@/lib/tokenList";
import type {
  AgentCreate,
  AgentUpdate,
  Policy,
  PolymarketTrigger,
} from "@/lib/types";

/* ── Uniswap routers on Ethereum mainnet ──────────────────────── */

const UNISWAP_ROUTERS: { name: string; address: string }[] = [
  { name: "V2 Router", address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" },
  { name: "V3 Router", address: "0xE592427A0AEce92De3Edee1F18E0157C05861564" },
  {
    name: "V3 Router 2",
    address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  },
  { name: "Universal", address: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD" },
];

const UNI_LOGO =
  "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png";

export const EMPTY_POLICY: Policy = {
  tokens: [],
  contracts: [],
  triggers: [],
  rate_limit_24h: 10,
  value_limit_24h: 1000,
};

/* ── Types ────────────────────────────────────────────────────── */

type FormState = {
  name: string;
  description: string;
  image_uri: string;
  strategy: string;
  policy: Policy;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  image_uri: "",
  strategy: "",
  policy: EMPTY_POLICY,
};

export interface CreateAgentModalProps {
  open: boolean;
  onClose: () => void;
  agentName?: string;
  initialValues?: Partial<FormState>;
}

/* ── Main modal ───────────────────────────────────────────────── */

export function CreateAgentModal({
  open,
  onClose,
  agentName,
  initialValues,
}: CreateAgentModalProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = agentName !== undefined;

  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initialValues });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...initialValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const createMutation = useMutation({
    mutationFn: (data: AgentCreate) => createAgent(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      onClose();
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: AgentUpdate) => updateAgent(token!, agentName!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", agentName] });
      onClose();
    },
  });

  const mutation = isEdit ? editMutation : createMutation;

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      strategy: form.strategy.trim(),
      policy: form.policy,
      description: form.description.trim() || null,
      image_uri: form.image_uri.trim() || null,
    };
    if (isEdit) editMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  if (!mounted || !open) return null;

  const apiError =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Something went wrong"
        : null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: "rgba(0,0,0,0.75)",
          animation: "fadeIn 120ms ease both",
        }}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid rgba(234,97,137,0.2)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            animation: "panelIn 160ms cubic-bezier(0.16,1,0.3,1) both",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(234,97,137,0.1)" }}
          >
            <div className="flex flex-col gap-0.5">
              <p
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "#EA6189" }}
              >
                {isEdit ? "Edit Agent" : "New Agent"}
              </p>
              <h2 className="text-lg tracking-wide text-[var(--text)]">
                Configure
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1 rounded-lg hover:bg-[var(--surface)]"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 overflow-y-auto px-6 py-6"
          >
            {/* Identity */}
            <Fieldset label="Identity">
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  placeholder="e.g. bullishforever"
                  required
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(v) => set("description", v)}
                  placeholder="What does this agent do?"
                  rows={2}
                />
              </Field>
              <Field label="Image">
                <ImageUpload
                  value={form.image_uri}
                  onChange={(v) => set("image_uri", v)}
                />
              </Field>
            </Fieldset>

            {/* Strategy */}
            <Fieldset label="Strategy">
              <Field label="Prompt" required>
                <Textarea
                  value={form.strategy}
                  onChange={(v) => set("strategy", v)}
                  placeholder="Describe the strategy in plain English…"
                  rows={4}
                  required
                />
              </Field>
            </Fieldset>

            {/* Policy */}
            <PolicyEditor
              value={form.policy}
              onChange={(p) => set("policy", p)}
            />

            {apiError && (
              <p className="text-xs text-red-400 -mt-2">{apiError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs tracking-widest uppercase transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || form.policy.tokens.length === 0}
                className="px-6 py-2.5 rounded-xl text-xs tracking-widest uppercase text-white transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "#EA6189",
                  boxShadow: mutation.isPending
                    ? "none"
                    : "0 0 20px rgba(234,97,137,0.3)",
                }}
              >
                {mutation.isPending
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
                    ? "Save Changes"
                    : "Create Agent"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes panelIn { from { opacity: 0; transform: scale(0.96) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </>,
    document.body,
  );
}

/* ── Image upload (Pinata → IPFS) ─────────────────────────────── */

async function pinFileToIPFS(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
      pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET!,
    },
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const { IpfsHash } = await res.json();
  return `ipfs://${IpfsHash}`;
}

function ImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = value?.startsWith("ipfs://")
    ? value.replace("ipfs://", "https://ipfs.io/ipfs/")
    : value || null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const uri = await pinFileToIPFS(file);
      onChange(uri);
    } catch {
      setError("Upload failed. Check your Pinata keys.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label
        className="relative flex items-center justify-center rounded-xl cursor-pointer transition-colors shrink-0 overflow-hidden"
        style={{
          width: 64, height: 64,
          border: "1px dashed rgba(234,97,137,0.3)",
          backgroundColor: "var(--bg)",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl" style={{ color: "rgba(234,97,137,0.4)" }}>+</span>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
      </label>
      <div className="flex flex-col gap-1 min-w-0">
        {uploading ? (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Uploading to IPFS…</span>
        ) : value ? (
          <>
            <span className="text-[10px] font-mono truncate" style={{ color: "var(--text-muted)" }}>{value}</span>
            <button type="button" onClick={() => onChange("")} className="text-[10px] tracking-widest uppercase text-left transition-colors" style={{ color: "#EA6189" }}>
              Remove
            </button>
          </>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Click to upload an image</span>
        )}
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    </div>
  );
}

/* ── Policy editor ────────────────────────────────────────────── */

function PolicyEditor({
  value,
  onChange,
}: {
  value: Policy;
  onChange: (v: Policy) => void;
}) {
  return (
    <Fieldset label="Policy">
      <TokenSelector
        selected={value.tokens}
        onChange={(tokens) => onChange({ ...value, tokens })}
      />
      <ContractSelector
        selected={value.contracts}
        onChange={(contracts) => onChange({ ...value, contracts })}
      />
      <TriggersEditor
        triggers={value.triggers}
        onChange={(triggers) => onChange({ ...value, triggers })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rate limit (trades / 24h)" required>
          <NumberInput
            value={value.rate_limit_24h}
            onChange={(v) => onChange({ ...value, rate_limit_24h: v })}
            min={1}
          />
        </Field>
        <Field label="Value limit (USD / 24h)" required>
          <NumberInput
            value={value.value_limit_24h}
            onChange={(v) => onChange({ ...value, value_limit_24h: v })}
            min={1}
          />
        </Field>
      </div>
    </Fieldset>
  );
}

/* ── Token selector ───────────────────────────────────────────── */

function TokenSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: tokenMap, isLoading } = useQuery({
    queryKey: ["uniswap-token-list"],
    queryFn: () => fetchTokenMap(1),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const allTokens = useMemo(
    () => (tokenMap ? Array.from(tokenMap.values()) : []),
    [tokenMap],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTokens.slice(0, 30);
    return allTokens
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.address.toLowerCase().startsWith(q),
      )
      .slice(0, 30);
  }, [allTokens, search]);

  const selectedInfos = useMemo(
    () =>
      selected
        .map((addr) => tokenMap?.get(addr.toLowerCase()))
        .filter(Boolean) as TokenInfo[],
    [selected, tokenMap],
  );

  function toggle(token: TokenInfo) {
    const lower = token.address.toLowerCase();
    const isSelected = selected.some((a) => a.toLowerCase() === lower);
    onChange(
      isSelected
        ? selected.filter((a) => a.toLowerCase() !== lower)
        : [...selected, token.address],
    );
  }

  function remove(address: string) {
    onChange(selected.filter((a) => a.toLowerCase() !== address.toLowerCase()));
  }

  return (
    <Field label="Whitelisted Tokens" required>
      {/* Selected chips */}
      {selectedInfos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedInfos.map((t) => (
            <span
              key={t.address}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
              style={{
                backgroundColor: "rgba(234,97,137,0.08)",
                border: "1px solid rgba(234,97,137,0.2)",
                color: "var(--text)",
              }}
            >
              {t.logoURI && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.logoURI}
                  alt={t.symbol}
                  width={12}
                  height={12}
                  className="rounded-full shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              )}
              <span className="tracking-wide">{t.symbol}</span>
              <button
                type="button"
                onClick={() => remove(t.address)}
                className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-left"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid rgba(234,97,137,0.15)",
            color: selected.length ? "var(--text)" : "var(--text-muted)",
          }}
        >
          <Search
            size={13}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
          {open ? (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search by name or symbol…"
              className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
            />
          ) : (
            <span className="flex-1 text-[var(--text-muted)] text-sm">
              {selected.length === 0
                ? "Select tokens…"
                : `${selected.length} token${selected.length > 1 ? "s" : ""} selected`}
            </span>
          )}
          {open ? (
            <ChevronUp
              size={13}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
          ) : (
            <ChevronDown
              size={13}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
          )}
        </button>

        {open && (
          <div
            className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden overflow-y-auto"
            style={{
              maxHeight: 220,
              backgroundColor: "var(--bg)",
              border: "1px solid rgba(234,97,137,0.15)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {isLoading ? (
              <p
                className="text-xs text-center py-4"
                style={{ color: "var(--text-muted)" }}
              >
                Loading token list…
              </p>
            ) : filtered.length === 0 ? (
              <p
                className="text-xs text-center py-4"
                style={{ color: "var(--text-muted)" }}
              >
                No tokens found
              </p>
            ) : (
              filtered.map((t) => {
                const isSelected = selected.some(
                  (a) => a.toLowerCase() === t.address.toLowerCase(),
                );
                return (
                  <button
                    key={t.address}
                    type="button"
                    onClick={() => toggle(t)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--surface-hover,var(--surface))] ${isSelected ? "bg-[var(--surface)]" : ""}`}
                  >
                    {t.logoURI ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.logoURI}
                        alt={t.symbol}
                        width={20}
                        height={20}
                        className="rounded-full shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[8px]"
                        style={{
                          backgroundColor: "rgba(234,97,137,0.15)",
                          color: "#EA6189",
                        }}
                      >
                        {t.symbol[0]}
                      </div>
                    )}
                    <span className="text-xs tracking-wide text-[var(--text)]">
                      {t.symbol}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] truncate">
                      {t.name}
                    </span>
                    {isSelected && (
                      <span
                        className="ml-auto text-[10px] font-bold shrink-0"
                        style={{ color: "#EA6189" }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
      {selected.length === 0 && (
        <p className="text-[10px] text-red-400">At least one token required</p>
      )}
    </Field>
  );
}

/* ── Contract selector ────────────────────────────────────────── */

function ContractSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(address: string) {
    const lower = address.toLowerCase();
    const isSelected = selected.some((c) => c.toLowerCase() === lower);
    onChange(
      isSelected
        ? selected.filter((c) => c.toLowerCase() !== lower)
        : [...selected, address],
    );
  }

  return (
    <Field label="Whitelisted Contracts">
      <div className="grid grid-cols-2 gap-2">
        {UNISWAP_ROUTERS.map((router) => {
          const isSelected = selected.some(
            (c) => c.toLowerCase() === router.address.toLowerCase(),
          );
          return (
            <button
              key={router.address}
              type="button"
              onClick={() => toggle(router.address)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
              style={{
                border: `1px solid ${isSelected ? "rgba(234,97,137,0.45)" : "rgba(234,97,137,0.12)"}`,
                backgroundColor: isSelected
                  ? "rgba(234,97,137,0.08)"
                  : "var(--surface)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={UNI_LOGO}
                alt="Uniswap"
                width={20}
                height={20}
                className="rounded-full shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[10px] tracking-widest uppercase font-medium"
                  style={{
                    color: isSelected ? "#EA6189" : "var(--text-muted)",
                  }}
                >
                  {router.name}
                </span>
                <span
                  className="text-[9px] font-mono truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {router.address.slice(0, 10)}…
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/* ── Triggers editor ──────────────────────────────────────────── */

function TriggersEditor({
  triggers,
  onChange,
}: {
  triggers: PolymarketTrigger[];
  onChange: (v: PolymarketTrigger[]) => void;
}) {
  function remove(i: number) {
    onChange(triggers.filter((_, idx) => idx !== i));
  }

  return (
    <Field label="Polymarket Triggers">
      {triggers.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-2">
          {triggers.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid rgba(234,97,137,0.12)",
              }}
            >
              <span className="font-mono text-[var(--text-muted)]">
                #{t.token_id}
              </span>
              <span style={{ color: "#EA6189" }}>{t.gt ? ">" : "≤"}</span>
              <span className="text-[var(--text)]">{t.threshold}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-auto text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() =>
          onChange([...triggers, { token_id: "", threshold: 0.5, gt: true }])
        }
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] tracking-widest uppercase transition-all"
        style={{
          border: "1px dashed rgba(234,97,137,0.25)",
          color: "var(--text-muted)",
          width: "100%",
        }}
      >
        <Plus size={11} />
        Add Polymarket Trigger
      </button>
    </Field>
  );
}

/* ── Primitives ───────────────────────────────────────────────── */

function Fieldset({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <p
          className="text-[10px] tracking-[0.2em] uppercase shrink-0"
          style={{ color: "#EA6189" }}
        >
          {label}
        </p>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "rgba(234,97,137,0.12)" }}
        />
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5">
        <span
          className="text-[10px] tracking-[0.15em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        {required && (
          <span style={{ color: "#EA6189" }} className="text-xs leading-none">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
      style={{
        backgroundColor: "var(--bg)",
        border: "1px solid rgba(234,97,137,0.15)",
        color: "var(--text)",
      }}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = "rgba(234,97,137,0.45)")
      }
      onBlur={(e) =>
        (e.currentTarget.style.borderColor = "rgba(234,97,137,0.15)")
      }
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={(e) => onChange(Number(e.target.value))}
      required
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
      style={{
        backgroundColor: "var(--bg)",
        border: "1px solid rgba(234,97,137,0.15)",
        color: "var(--text)",
      }}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = "rgba(234,97,137,0.45)")
      }
      onBlur={(e) =>
        (e.currentTarget.style.borderColor = "rgba(234,97,137,0.15)")
      }
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
      style={{
        backgroundColor: "var(--bg)",
        border: "1px solid rgba(234,97,137,0.15)",
        color: "var(--text)",
      }}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = "rgba(234,97,137,0.45)")
      }
      onBlur={(e) =>
        (e.currentTarget.style.borderColor = "rgba(234,97,137,0.15)")
      }
    />
  );
}
