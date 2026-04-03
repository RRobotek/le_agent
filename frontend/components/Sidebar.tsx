"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { mockAgents, Agent } from "@/lib/mockAgents";
import { Plus, Activity } from "lucide-react";

export default function Sidebar() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);

  function toggleAgent(id: string, e: React.MouseEvent) {
    e.preventDefault();
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "running" ? "paused" : "running" }
          : a
      )
    );
  }

  return (
    <aside className="flex flex-col w-64 shrink-0 h-screen bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <span className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          LeAgent
        </span>
      </div>

      {/* New Agent button */}
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-zinc-300 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </div>

      {/* Agent list */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        <p className="px-2 pt-2 pb-1 text-xs text-zinc-500 uppercase tracking-wider">
          Agents
        </p>
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/agents/${agent.id}`}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-zinc-800 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  agent.status === "running" ? "bg-green-500" : "bg-zinc-500"
                }`}
              />
              <span className="text-sm text-zinc-200 truncate">{agent.name}</span>
            </div>
            <Switch
              checked={agent.status === "running"}
              onCheckedChange={() => {}}
              onClick={(e) => toggleAgent(agent.id, e)}
              className="shrink-0 ml-2"
            />
          </Link>
        ))}
      </nav>

      {/* Monitor Feed link */}
      <div className="p-3 border-t border-zinc-800">
        <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
          <Activity className="w-4 h-4" />
          Monitor Feed
        </button>
      </div>
    </aside>
  );
}
