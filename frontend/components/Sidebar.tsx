'use client'

import Image from 'next/image'
import { PanelLeftClose } from 'lucide-react'

interface SidebarProps {
  open: boolean
  onToggle: () => void
  logoSrc: string
}

export function Sidebar({ open, onToggle, logoSrc }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-30
          bg-zinc-950 border-r border-zinc-800
          flex flex-col
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Top row */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800 shrink-0">
          <Image
            src={logoSrc}
            alt="LeAgent"
            width={100}
            height={33}
            className="shrink-0 mt-1"
          />
          <button
            onClick={onToggle}
            className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Wallet pill */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-full px-3 py-1.5 cursor-pointer">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs tracking-wider text-zinc-300">0x4f3a...2e</span>
          </div>
        </div>

        {/* Agent list — populated later */}
        <div className="flex-1 overflow-y-auto px-2 py-2" />
      </aside>
    </>
  )
}
