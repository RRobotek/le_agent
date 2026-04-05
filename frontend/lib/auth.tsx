'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { getNonce, verifySignature } from './api'

type AuthContext = {
  token: string | null
  signIn: () => Promise<void>
  signOut: () => void
  isAuthenticating: boolean
  error: string | null
}

const Ctx = createContext<AuthContext | null>(null)

function tokenKey(address: string) {
  return `leagent_token_${address.toLowerCase()}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load / clear token when address changes
  useEffect(() => {
    if (!address) {
      setToken(null)
      return
    }
    const stored = localStorage.getItem(tokenKey(address))
    setToken(stored)
  }, [address])

  const signIn = useCallback(async () => {
    if (!address) return
    setIsAuthenticating(true)
    setError(null)
    try {
      const nonce = await getNonce(address)
      const message = `Sign in nonce: ${nonce}`
      const signature = await signMessageAsync({ message })
      const jwt = await verifySignature(address, message, signature)
      localStorage.setItem(tokenKey(address), jwt)
      setToken(jwt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setIsAuthenticating(false)
    }
  }, [address, signMessageAsync])

  const signOut = useCallback(() => {
    if (address) localStorage.removeItem(tokenKey(address))
    setToken(null)
  }, [address])

  return (
    <Ctx.Provider value={{ token, signIn, signOut, isAuthenticating, error }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
