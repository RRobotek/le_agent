"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import { X, ChevronDown } from "lucide-react";
import { fetchTokenMap, type TokenInfo } from "@/lib/tokenList";

const ERC20_APPROVE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface AllowanceModalProps {
  open: boolean;
  onClose: () => void;
  contractAddress: string;
  tokens: string[];
}

export function AllowanceModal({
  open,
  onClose,
  contractAddress,
  tokens,
}: AllowanceModalProps) {
  const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());
  const [selectedToken, setSelectedToken] = useState<string>(tokens[0] ?? "");
  const [amount, setAmount] = useState("");
  const [useMax, setUseMax] = useState(false);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetchTokenMap().then(setTokenMap).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && tokens.length > 0) setSelectedToken(tokens[0]);
  }, [open, tokens]);

  const tokenInfo = tokenMap.get(selectedToken.toLowerCase());
  const decimals = tokenInfo?.decimals ?? 18;

  const { writeContract, data: txHash, isPending, reset, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function handleApprove() {
    if (!selectedToken || (!useMax && !amount)) return;

    const parsedAmount = useMax
      ? maxUint256
      : parseUnits(amount, decimals);

    writeContract({
      address: selectedToken as `0x${string}`,
      abi: ERC20_APPROVE_ABI,
      functionName: "approve",
      args: [contractAddress as `0x${string}`, parsedAmount],
    });
  }

  function handleClose() {
    reset();
    setAmount("");
    setUseMax(false);
    onClose();
  }

  if (!open || !mounted) return null;

  const busy = isPending || isConfirming;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="relative flex flex-col w-full max-w-sm rounded-2xl border p-6 gap-5"
        style={{
          background: "var(--surface)",
          borderColor: "rgba(234,97,137,0.2)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "#EA6189" }}
          >
            Set Allowance
          </p>
          <button
            onClick={handleClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Spender info */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] tracking-widest uppercase text-[var(--text-muted)]">
            Spender
          </p>
          <p
            className="text-xs font-mono break-all"
            style={{ color: "var(--text-muted)" }}
          >
            {contractAddress}
          </p>
        </div>

        {/* Token selector */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] tracking-widest uppercase text-[var(--text-muted)]">
            Token
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTokenDropdownOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm text-left transition-colors"
              style={{
                borderColor: "rgba(107,114,128,0.3)",
                background: "var(--bg)",
                color: "var(--text)",
              }}
            >
              <span className="flex items-center gap-2 min-w-0">
                {tokenInfo?.logoURI && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tokenInfo.logoURI} alt="" className="w-5 h-5 rounded-full shrink-0" />
                )}
                <span className="truncate">
                  {tokenInfo ? `${tokenInfo.symbol} — ${tokenInfo.name}` : selectedToken}
                </span>
              </span>
              <ChevronDown size={14} className="shrink-0 ml-2 text-[var(--text-muted)]" />
            </button>

            {tokenDropdownOpen && (
              <div
                className="absolute z-10 mt-1 w-full rounded-lg border overflow-auto max-h-48"
                style={{
                  background: "var(--surface)",
                  borderColor: "rgba(107,114,128,0.3)",
                }}
              >
                {tokens.map((addr) => {
                  const info = tokenMap.get(addr.toLowerCase());
                  return (
                    <button
                      key={addr}
                      type="button"
                      onClick={() => {
                        setSelectedToken(addr);
                        setTokenDropdownOpen(false);
                        setAmount("");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--bg)]"
                      style={{ color: "var(--text)" }}
                    >
                      {info?.logoURI && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={info.logoURI} alt="" className="w-5 h-5 rounded-full shrink-0" />
                      )}
                      <span className="truncate">
                        {info ? `${info.symbol} — ${info.name}` : addr}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-widest uppercase text-[var(--text-muted)]">
              Amount{tokenInfo ? ` (${tokenInfo.symbol})` : ""}
            </p>
            <button
              type="button"
              onClick={() => setUseMax((v) => !v)}
              className="text-[10px] tracking-widest uppercase transition-colors px-2 py-0.5 rounded"
              style={{
                color: useMax ? "#EA6189" : "var(--text-muted)",
                background: useMax ? "rgba(234,97,137,0.1)" : "transparent",
                border: `1px solid ${useMax ? "rgba(234,97,137,0.3)" : "transparent"}`,
              }}
            >
              Max (unlimited)
            </button>
          </div>
          <input
            type="number"
            min="0"
            placeholder={useMax ? "Unlimited" : "0.0"}
            disabled={useMax}
            value={useMax ? "" : amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors disabled:opacity-40"
            style={{
              borderColor: "rgba(107,114,128,0.3)",
              background: "var(--bg)",
              color: "var(--text)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(234,97,137,0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(107,114,128,0.3)")
            }
          />
        </div>

        {/* Error */}
        {writeError && (
          <p className="text-xs text-red-400 break-all">
            {writeError.shortMessage ?? writeError.message}
          </p>
        )}

        {/* Success */}
        {isSuccess && (
          <p className="text-xs" style={{ color: "#4ade80" }}>
            Allowance set successfully.
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy || isSuccess || !selectedToken || (!useMax && !amount)}
          className="w-full py-2.5 rounded-lg text-xs tracking-widest uppercase font-medium transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #EA6189 0%, #c94f73 100%)",
            color: "#fff",
            boxShadow: busy ? "none" : "0 0 16px rgba(234,97,137,0.3)",
          }}
        >
          {isPending
            ? "Confirm in wallet…"
            : isConfirming
            ? "Confirming…"
            : isSuccess
            ? "Done"
            : "Approve"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
