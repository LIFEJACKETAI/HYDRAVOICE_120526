'use client'

import React, { useEffect, createContext, useContext } from 'react'
import { SessionProvider, useSession, signOut } from 'next-auth/react'
import { useAppStore } from '@/lib/store'

/**
 * Inner component that syncs the next-auth session to the Zustand store.
 * This runs inside SessionProvider so useSession() works.
 */
function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { setAuth, logout } = useAppStore()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Hydrate the Zustand store from the next-auth session
      setAuth({
        id: session.user.id || '1',
        email: session.user.email || '',
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        image: session.user.image || undefined,
        role: (session.user as any).role || 'user',
        plan: (session.user as any).plan || 'free',
        createdAt: new Date().toISOString(),
      })
    } else if (status === 'unauthenticated') {
      // If the session is gone (e.g. expired), clear the store
      // Only clear if currently authenticated to avoid loops
      const currentState = useAppStore.getState()
      if (currentState.isAuthenticated) {
        logout()
      }
    }
  }, [session, status, setAuth, logout])

  return <>{children}</>
}

/**
 * AuthProvider wraps the app with next-auth's SessionProvider and syncs
 * session state to the Zustand store so the UI reacts to auth changes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <SessionSync>
        {children}
      </SessionSync>
    </SessionProvider>
  )
}
