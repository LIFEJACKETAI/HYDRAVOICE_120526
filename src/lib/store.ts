import { create } from 'zustand'

export type PageType = 'home' | 'create' | 'pricing' | 'how-it-works' | 'account' | 'admin'

interface User {
  id: string
  email: string
  name: string
  image?: string
  role: string
  plan: string
  createdAt: string
}

interface AppState {
  currentPage: PageType
  isAuthenticated: boolean
  user: User | null
  setCurrentPage: (page: PageType) => void
  setAuth: (user: User) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'home',
  isAuthenticated: false,
  user: null,
  setCurrentPage: (page) => set({ currentPage: page }),
  setAuth: (user) => set({ isAuthenticated: true, user }),
  logout: () => {
    set({ isAuthenticated: false, user: null, currentPage: 'home' })
    // Also sign out from next-auth so the session cookie is cleared
    import('next-auth/react').then(({ signOut }) => {
      signOut({ redirect: false })
    }).catch(() => {
      // Ignore if signOut fails (e.g. no session)
    })
  },
}))
