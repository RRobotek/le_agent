"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { AuthProvider } from "@/lib/auth";
import { http } from "wagmi";
import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "light",
  toggleTheme: () => {},
});
export function useTheme() { return useContext(ThemeContext); }

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === "dark" ? "light" : "dark") }}>
      {children}
    </ThemeContext.Provider>
  );
}

function IPFSFixer() {
  useEffect(() => {
    function fix(el: Element) {
      if (el instanceof HTMLImageElement && el.getAttribute("src")?.startsWith("ipfs://")) {
        el.src = el.src.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
      el.querySelectorAll?.('img[src^="ipfs://"]').forEach((img) => {
        (img as HTMLImageElement).src = (img as HTMLImageElement).src.replace("ipfs://", "https://ipfs.io/ipfs/");
      });
    }

    document.querySelectorAll('img[src^="ipfs://"]').forEach(fix);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) m.addedNodes.forEach((n) => n instanceof Element && fix(n));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const config = getDefaultConfig({
  appName: "le_agent",
  projectId,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http("https://cloudflare-eth.com"),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <IPFSFixer />
            <AuthProvider>{children}</AuthProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
