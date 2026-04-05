"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/app/providers";
import Image from "next/image";
import Link from "next/link";

function ConnectGate() {
  const { theme, toggleTheme } = useTheme();
  const logoSrc =
    theme === "dark"
      ? "/main logo long white.svg"
      : "/main logo long black.svg";

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-10 bg-[var(--bg)]">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 text-[var(--icon)] hover:text-[var(--text)] transition-colors cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <Image src={logoSrc} alt="LeAgent" width={200} height={48} priority />

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm tracking-widest uppercase text-[var(--text)]" style={{ opacity: 0.8 }}>
          Connect your wallet to continue
        </p>
        <ConnectButton />
      </div>
    </div>
  );
}

function SignInGate() {
  const { theme, toggleTheme } = useTheme();
  const { signIn, isAuthenticating, error } = useAuth();
  const logoSrc =
    theme === "dark"
      ? "/main logo long white.svg"
      : "/main logo long black.svg";

  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-10 bg-[var(--bg)]">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 text-[var(--icon)] hover:text-[var(--text)] transition-colors cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <Image src={logoSrc} alt="LeAgent" width={200} height={48} priority />

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm tracking-widest uppercase text-[var(--text)]" style={{ opacity: 0.8 }}>
          Sign a message to authenticate your ledger
        </p>
        <button
          onClick={signIn}
          disabled={isAuthenticating}
          className="px-6 py-2.5 rounded-full text-sm tracking-widest uppercase text-white transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          style={{ backgroundColor: "#EA6189" }}
        >
          {isAuthenticating ? "Waiting for signature…" : "Sign In"}
        </button>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!isConnected) return <ConnectGate />;
  if (!token) return <SignInGate />;

  const pageTitle: Record<string, string> = {
    "/agents": "Agents",
    "/dashboard": "Dashboard",
    "/transactions": "Transactions",
    "/test": "Test",
  };
  const title = pageTitle[pathname] ?? "";

  const logoSrc =
    theme === "dark"
      ? "/main logo long white.svg"
      : "/main logo long black.svg";

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <div
      className={`${theme} flex h-full min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300`}
    >
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center h-14 px-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <Link href="/agents">
              <Image src={logoSrc} alt="LeAgent" width={80} height={24} className="shrink-0 mt-1" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="text-[var(--icon)] hover:text-[var(--text)] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <ConnectButton.Custom>
              {({ openAccountModal }) => (
                <button
                  onClick={openAccountModal}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 cursor-pointer border transition-colors"
                  style={{
                    backgroundColor: "rgba(234,97,137,0.08)",
                    borderColor: "rgba(234,97,137,0.35)",
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "#EA6189" }}
                  />
                  <span className="text-xs tracking-wider text-[var(--text)]">
                    {shortAddress}
                  </span>
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
