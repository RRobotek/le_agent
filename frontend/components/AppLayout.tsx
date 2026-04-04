'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Sun, Moon } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const pathname = usePathname()

  const pageTitle: Record<string, string> = {
    '/agents': 'Agents',
    '/dashboard': 'Dashboard',
    '/transactions': 'Transactions',
  }
  const title = pageTitle[pathname] ?? ''

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
          <div className="flex items-center gap-3 flex-1">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-[var(--icon)] hover:text-[var(--text)] transition-colors"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            {title && (
              <span className="text-2xl tracking-widest uppercase">
                Le<span style={{ color: '#EA6189' }}>{title}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="text-[var(--icon)] hover:text-[var(--text)] transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 cursor-pointer border transition-colors"
              style={{
                backgroundColor: 'rgba(234,97,137,0.08)',
                borderColor: 'rgba(234,97,137,0.35)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#EA6189' }} />
              <span className="text-xs tracking-wider text-[var(--text)]">0x4f3a...2e</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
