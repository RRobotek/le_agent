"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useSignMessage,
  useDeployContract,
  useConfig,
  useAccount,
} from "wagmi";
import { getTransactionCount } from "@wagmi/core";
import { getContractAddress } from "viem";
import { X, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createAgent, updateAgent, getAgentWallet, ApiError } from "@/lib/api";
import { fetchTokenMap, type TokenInfo } from "@/lib/tokenList";
import { EXECUTOR_ABI, EXECUTOR_BYTECODE } from "@/lib/contracts";
import type {
  AgentCreate,
  AgentUpdate,
  Policy,
  PolymarketTrigger,
} from "@/lib/types";

const CRE_ADDRESS = (process.env.NEXT_PUBLIC_CRE_ADDRESS ??
  "") as `0x${string}`;

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

/* ── Canonical payload (must match Python's sort_keys=True, separators=(",",":")) ── */

function sortKeys(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(sortKeys);
  if (val !== null && typeof val === "object") {
    return Object.fromEntries(
      Object.keys(val as object)
        .sort()
        .map((k) => [k, sortKeys((val as Record<string, unknown>)[k])]),
    );
  }
  return val;
}

export function buildRecordPayload(
  name: string,
  strategy: string,
  policy: Policy,
  description: string | null,
  image_uri: string | null,
): string {
  return JSON.stringify(
    sortKeys({ name, strategy, policy, description, image_uri }),
  );
}

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
  const { signMessageAsync } = useSignMessage();
  const { deployContractAsync } = useDeployContract();
  const config = useConfig();
  const { address: walletAddress } = useAccount();
  const isEdit = agentName !== undefined;

  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initialValues });
  const [mounted, setMounted] = useState(false);
  const [deployStep, setDeployStep] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

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
    onError: (err) => {
      setDeployError(
        err instanceof Error ? err.message : "Agent creation failed",
      );
      setDeployStep(null);
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
    const name = form.name.trim();
    const strategy = form.strategy.trim();
    const policy = form.policy;
    const description = form.description.trim() || null;
    const image_uri = form.image_uri.trim() || null;

    const sigPayload = buildRecordPayload(
      name,
      strategy,
      policy,
      description,
      image_uri,
    );

    setDeployError(null);
    setDeployStep("signing");

    signMessageAsync({ message: sigPayload })
      .then(async (record_sig) => {
        if (isEdit) {
          setDeployStep(null);
          editMutation.mutate({
            name,
            strategy,
            policy,
            description,
            image_uri,
            record_sig,
          });
          return;
        }

        try {
          setDeployStep("deploying");
          if (!CRE_ADDRESS || CRE_ADDRESS === "0x") {
            throw new Error(
              "CRE contract address is not configured (NEXT_PUBLIC_CRE_ADDRESS)",
            );
          }
          const { wallet: agentWallet } = await getAgentWallet(token!, name);
          if (!agentWallet) {
            throw new Error(
              "Agent wallet address was not returned by the server",
            );
          }
          const nonce = await getTransactionCount(config, {
            address: walletAddress!,
          });
          const contract_address = getContractAddress({
            from: walletAddress!,
            nonce,
          });
          await deployContractAsync({
            abi: EXECUTOR_ABI,
            bytecode: EXECUTOR_BYTECODE,
            args: [agentWallet as `0x${string}`, CRE_ADDRESS],
          });

          setDeployStep("creating");
          createMutation.mutate({
            name,
            strategy,
            policy,
            description,
            image_uri,
            record_sig,
            contract_address,
          });
        } catch (err) {
          setDeployError(
            err instanceof Error ? err.message : "Contract deployment failed",
          );
          setDeployStep(null);
        }
      })
      .catch(() => {
        setDeployStep(null);
      });
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

            {(apiError || deployError) && (
              <p className="text-xs text-red-400 -mt-2">
                {apiError ?? deployError}
              </p>
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
                disabled={
                  mutation.isPending ||
                  deployStep !== null ||
                  form.policy.tokens.length === 0
                }
                className="px-6 py-2.5 rounded-xl text-xs tracking-widest uppercase text-white transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "#EA6189",
                  boxShadow:
                    mutation.isPending || deployStep !== null
                      ? "none"
                      : "0 0 20px rgba(234,97,137,0.3)",
                }}
              >
                {deployStep === "signing"
                  ? "Signing…"
                  : deployStep === "deploying"
                    ? "Deploying contract…"
                    : deployStep === "creating" || mutation.isPending
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

function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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
          width: 64,
          height: 64,
          border: "1px dashed rgba(234,97,137,0.3)",
          backgroundColor: "var(--bg)",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl" style={{ color: "rgba(234,97,137,0.4)" }}>
            +
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>
      <div className="flex flex-col gap-1 min-w-0">
        {uploading ? (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Uploading to IPFS…
          </span>
        ) : value ? (
          <>
            <span
              className="text-[10px] font-mono truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {value}
            </span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] tracking-widest uppercase text-left transition-colors"
              style={{ color: "#EA6189" }}
            >
              Remove
            </button>
          </>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Click to upload an image
          </span>
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

type PolymarketMarket = {
  question: string;
  clobTokenIds: string | string[];
  lastTradePrice: number | null;
  image: string | null;
};

async function searchPolymarkets(q: string): Promise<PolymarketMarket[]> {
  const res = await fetch(`/api/polymarket-search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  const markets: PolymarketMarket[] = [];
  for (const event of data.events ?? []) {
    for (const market of event.markets ?? []) {
      if (market.clobTokenIds && market.question) {
        markets.push({
          question: market.question,
          clobTokenIds: market.clobTokenIds,
          lastTradePrice: market.lastTradePrice ?? null,
          image: market.image ?? null,
        });
      }
    }
  }
  return markets.slice(0, 10);
}

function TriggersEditor({
  triggers,
  onChange,
}: {
  triggers: PolymarketTrigger[];
  onChange: (v: PolymarketTrigger[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PolymarketMarket[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PolymarketMarket | null>(null);
  const [threshold, setThreshold] = useState(50);
  const [gt, setGt] = useState(true);

  useEffect(() => {
    if (search.length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPolymarkets(search));
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  function reset() {
    setAdding(false);
    setSearch("");
    setResults([]);
    setSelected(null);
    setThreshold(50);
    setGt(true);
  }

  function confirm() {
    if (!selected) return;
    const raw = selected.clobTokenIds;
    const ids: string[] = Array.isArray(raw)
      ? (raw as unknown as string[])
      : JSON.parse(raw);
    const token_id = String(ids[0]);
    onChange([...triggers, { token_id, threshold: threshold / 100, gt }]);
    reset();
  }

  function remove(i: number) {
    onChange(triggers.filter((_, idx) => idx !== i));
  }

  return (
    <Field label="Polymarket Triggers">
      {/* Existing triggers */}
      {triggers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {triggers.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid rgba(234,97,137,0.12)",
              }}
            >
              <span
                className="font-mono text-[10px] truncate text-[var(--text-muted)]"
                style={{ maxWidth: 120 }}
              >
                {t.token_id}
              </span>
              <span style={{ color: "#EA6189" }}>{t.gt ? ">" : "≤"}</span>
              <span className="text-[var(--text)]">
                {(t.threshold * 100).toFixed(0)}%
              </span>
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

      {/* Add trigger form */}
      {adding ? (
        <div
          className="flex flex-col gap-3 p-3 rounded-xl"
          style={{
            border: "1px solid rgba(234,97,137,0.2)",
            backgroundColor: "var(--bg)",
          }}
        >
          {!selected ? (
            /* Step 1: search */
            <div className="relative">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid rgba(234,97,137,0.15)",
                }}
              >
                <Search
                  size={12}
                  style={{ color: "var(--text-muted)", flexShrink: 0 }}
                />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Polymarket markets…"
                  className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
                />
                {searching && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    …
                  </span>
                )}
              </div>
              {search.length < 3 && (
                <p
                  className="text-[10px] mt-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Type at least 3 characters to search
                </p>
              )}
              {results.length > 0 && (
                <div
                  className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden overflow-y-auto"
                  style={{
                    maxHeight: 240,
                    backgroundColor: "var(--surface)",
                    border: "1px solid rgba(234,97,137,0.15)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  {results.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelected(m);
                        setResults([]);
                      }}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg)]"
                    >
                      {m.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.image}
                          alt=""
                          width={24}
                          height={24}
                          className="rounded shrink-0 mt-0.5 object-cover"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                      )}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs text-[var(--text)] leading-snug line-clamp-2">
                          {m.question}
                        </span>
                        {m.lastTradePrice != null && (
                          <span
                            className="text-[10px]"
                            style={{ color: "#EA6189" }}
                          >
                            {(m.lastTradePrice * 100).toFixed(1)}% YES
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!searching && search.length >= 3 && results.length === 0 && (
                <p
                  className="text-[10px] mt-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  No markets found
                </p>
              )}
            </div>
          ) : (
            /* Step 2: configure threshold */
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                {selected.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.image}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded shrink-0 mt-0.5 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                )}
                <p className="text-xs text-[var(--text)] leading-snug">
                  {selected.question}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="ml-auto text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
                >
                  <X size={11} />
                </button>
              </div>

              {/* Direction toggle */}
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setGt(v)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] tracking-widest uppercase transition-all"
                    style={{
                      border: `1px solid ${gt === v ? "rgba(234,97,137,0.5)" : "rgba(234,97,137,0.12)"}`,
                      backgroundColor:
                        gt === v ? "rgba(234,97,137,0.1)" : "transparent",
                      color: gt === v ? "#EA6189" : "var(--text-muted)",
                    }}
                  >
                    {v ? "Price >" : "Price ≤"}
                  </button>
                ))}
              </div>

              {/* Threshold */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] tracking-[0.15em] uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Threshold
                  </span>
                  <span className="text-sm tabular-nums text-[var(--text)]">
                    {threshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={99}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-[#EA6189]"
                />
                {selected.lastTradePrice != null && (
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Current price:{" "}
                    <span style={{ color: "#EA6189" }}>
                      {(selected.lastTradePrice * 100).toFixed(1)}%
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={reset}
              className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Cancel
            </button>
            {selected && (
              <button
                type="button"
                onClick={confirm}
                className="px-3 py-1.5 rounded-lg text-[10px] tracking-widest uppercase text-white transition-all"
                style={{ backgroundColor: "#EA6189" }}
              >
                Add Trigger
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] tracking-widest uppercase transition-all w-full"
          style={{
            border: "1px dashed rgba(234,97,137,0.25)",
            color: "var(--text-muted)",
          }}
        >
          <Plus size={11} />
          Add Polymarket Trigger
        </button>
      )}
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
