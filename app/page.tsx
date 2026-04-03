"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <ConnectButton />
      {isConnected && (
        <p className="text-sm text-gray-600 break-all">{address}</p>
      )}
    </main>
  );
}
