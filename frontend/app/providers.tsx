"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { AuthProvider } from "@/lib/auth";
import { http } from "wagmi";
import { useEffect } from "react";

function IPFSFixer() {
  useEffect(() => {
    function fix(el: Element) {
      if (
        el instanceof HTMLImageElement &&
        el.getAttribute("src")?.startsWith("ipfs://")
      ) {
        el.src = el.src.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
      el.querySelectorAll?.('img[src^="ipfs://"]').forEach((img) => {
        (img as HTMLImageElement).src = (img as HTMLImageElement).src.replace(
          "ipfs://",
          "https://ipfs.io/ipfs/",
        );
      });
    }

    document.querySelectorAll('img[src^="ipfs://"]').forEach(fix);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations)
        m.addedNodes.forEach((n) => n instanceof Element && fix(n));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
const rpcProvider = process.env.NEXT_PUBLIC_RPC ?? "";

const config = getDefaultConfig({
  appName: "le_agent",
  projectId,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(rpcProvider),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <IPFSFixer />
          <AuthProvider>{children}</AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
