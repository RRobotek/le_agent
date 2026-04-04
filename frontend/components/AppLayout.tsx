'use client'

import { useState } from 'react'
import { Menu, Sun, Moon } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const logoSrc = theme === 'dark'
    ? '/main logo long white.svg'
    : '/main logo long black.svg'

  return (
    <div className={`${theme} flex h-full min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300`}>
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        logoSrc={logoSrc}
      />

      <div
        className={`
          flex-1 flex flex-col
          transition-all duration-200 ease-in-out
          ${sidebarOpen ? 'md:ml-64' : 'ml-0'}
        `}
      >
        {/* Top bar */}
        <header className="flex items-center h-14 px-4 border-b border-zinc-800 shrink-0">
          <div className="flex-1">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            )}
          </div>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
