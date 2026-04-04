"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createAgent, updateAgent, ApiError } from "@/lib/api";
import type { AgentCreate, AgentUpdate } from "@/lib/types";

const STRATEGY_TYPES = [
  {
    value: "PRICE_ACTION",
    label: "Price Action",
    description: "Reacts to live price movements",
  },
  {
    value: "POLYMARKET",
    label: "Polymarket",
    description: "Trades on prediction market signals",
  },
  {
    value: "X_SENTIMENT",
    label: "X Sentiment",
    description: "Reads social mood on X/Twitter",
  },
];

type FormState = {
  name: string;
  description: string;
  image_uri: string;
  strategy_type: string;
  strategy_prompt: string;
  policy: string;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  image_uri: "",
  strategy_type: "PRICE_ACTION",
  strategy_prompt: "",
  policy: "{}",
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set, the modal operates in edit mode */
  agentId?: number;
  initialValues?: Partial<FormState>;
}

export function CreateAgentModal({
  open,
  onClose,
  agentId,
  initialValues,
}: Props) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = agentId !== undefined;

  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initialValues });
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initialValues });
      setPolicyError(null);
    }
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
    mutationFn: (data: AgentUpdate) => updateAgent(token!, agentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", String(agentId)] });
      onClose();
    },
  });

  const mutation = isEdit ? editMutation : createMutation;

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let policy: Record<string, unknown>;
    try {
      policy = JSON.parse(form.policy);
      setPolicyError(null);
    } catch {
      setPolicyError("Invalid JSON");
      return;
    }

    if (isEdit) {
      editMutation.mutate({
        name: form.name.trim(),
        strategy_type: form.strategy_type,
        strategy_prompt: form.strategy_prompt.trim(),
        policy,
        description: form.description.trim() || null,
        image_uri: form.image_uri.trim() || null,
      });
    } else {
      createMutation.mutate({
        name: form.name.trim(),
        strategy_type: form.strategy_type,
        strategy_prompt: form.strategy_prompt.trim(),
        policy,
        description: form.description.trim() || null,
        image_uri: form.image_uri.trim() || null,
      });
    }
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(9,9,11,0.65)",
          animation: "fadeIn 120ms ease both",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid rgba(234,97,137,0.15)",
            boxShadow:
              "0 0 60px rgba(234,97,137,0.08), 0 24px 64px rgba(0,0,0,0.5)",
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
                  placeholder="e.g. Crisis Seller"
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
              <Field label="Image URL">
                <Input
                  value={form.image_uri}
                  onChange={(v) => set("image_uri", v)}
                  placeholder="https://…"
                />
              </Field>
            </Fieldset>

            {/* Strategy */}
            <Fieldset label="Strategy">
              <Field label="Type" required>
                <div className="grid grid-cols-3 gap-2">
                  {STRATEGY_TYPES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set("strategy_type", s.value)}
                      className="flex flex-col gap-1 p-3 rounded-xl text-left transition-all duration-150"
                      style={{
                        border: `1px solid ${
                          form.strategy_type === s.value
                            ? "rgba(234,97,137,0.5)"
                            : "rgba(234,97,137,0.12)"
                        }`,
                        backgroundColor:
                          form.strategy_type === s.value
                            ? "rgba(234,97,137,0.08)"
                            : "var(--surface)",
                      }}
                    >
                      <span
                        className="text-[10px] tracking-widest uppercase font-medium"
                        style={{
                          color:
                            form.strategy_type === s.value
                              ? "#EA6189"
                              : "var(--text-muted)",
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        className="text-[10px] leading-snug"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {s.description}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Prompt" required>
                <Textarea
                  value={form.strategy_prompt}
                  onChange={(v) => set("strategy_prompt", v)}
                  placeholder="Describe the strategy in plain English…"
                  rows={4}
                  required
                />
              </Field>
            </Fieldset>

            {/* Policy */}
            <Fieldset label="Policy">
              <Field label="JSON" required error={policyError}>
                <Textarea
                  value={form.policy}
                  onChange={(v) => {
                    set("policy", v);
                    setPolicyError(null);
                  }}
                  placeholder="{}"
                  rows={3}
                  mono
                  error={!!policyError}
                />
              </Field>
            </Fieldset>

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
                disabled={mutation.isPending}
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
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px) }
          to   { opacity: 1; transform: scale(1)    translateY(0)    }
        }
      `}</style>
    </>,
    document.body,
  );
}

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
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
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
      {error && <p className="text-xs text-red-400">{error}</p>}
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
        backgroundColor: "var(--surface)",
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
  mono,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  mono?: boolean;
  error?: boolean;
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
        backgroundColor: "var(--surface)",
        border: `1px solid ${error ? "rgba(248,113,113,0.5)" : "rgba(234,97,137,0.15)"}`,
        color: "var(--text)",
        fontFamily: mono ? "monospace" : "inherit",
      }}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = error
          ? "rgba(248,113,113,0.7)"
          : "rgba(234,97,137,0.45)")
      }
      onBlur={(e) =>
        (e.currentTarget.style.borderColor = error
          ? "rgba(248,113,113,0.5)"
          : "rgba(234,97,137,0.15)")
      }
    />
  );
}
