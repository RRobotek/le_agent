"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, Bot, FlaskConical } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  logoSrc: string;
}

const navItems = [{ href: "/agents", label: "Agents", icon: Bot }];

export function Sidebar({ open, onToggle, logoSrc }: SidebarProps) {
  const pathname = usePathname();
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
          bg-[var(--surface)] border-r border-[var(--text)]/10
          text-[var(--text)]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Top row */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--text)]/10 shrink-0">
          <Link href="/agents">
            <Image
              src={logoSrc}
              alt="LeAgent"
              width={100}
              height={33}
              className="shrink-0 mt-1"
            />
          </Link>
          <button
            onClick={onToggle}
            className="text-[var(--icon)] hover:text-[var(--text)] transition-colors"
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2 py-3 border-b border-[var(--text)]/10">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm tracking-wide transition-colors
                  ${
                    active
                      ? "bg-[var(--text)]/10 text-[var(--text)]"
                      : "text-[var(--icon)] hover:bg-[var(--text)]/5 hover:text-[var(--text)]"
                  }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Agent list — populated later */}
        <div className="flex-1 overflow-y-auto px-2 py-2" />
      </aside>
    </>
  );
}
