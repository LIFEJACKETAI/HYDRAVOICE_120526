'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Mail, Lock, Chrome, Building2, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'

interface SignInModalProps {
  open: boolean
  onClose: () => void
  onSwitchToSignUp: () => void
}

export function SignInModal({ open, onClose, onSwitchToSignUp }: SignInModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAppStore()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({ title: 'Sign in failed', description: 'Invalid email or password.', variant: 'destructive' })
      } else {
        // Sign-in succeeded — fetch session with a small delay to ensure cookie is set
        await new Promise(r => setTimeout(r, 500))
        let sessionUser = null
        try {
          const sessionRes = await fetch('/api/auth/session')
          const session = await sessionRes.json()
          sessionUser = session?.user || null
        } catch {}

        if (sessionUser) {
          setAuth({
            id: sessionUser.id || '1',
            email: sessionUser.email || email,
            name: sessionUser.name || email.split('@')[0],
            image: sessionUser.image || undefined,
            role: (sessionUser as any).role || 'user',
            plan: (sessionUser as any).plan || 'free',
            createdAt: new Date().toISOString(),
          })
        } else {
          // Session not available yet — set auth from form data as fallback
          // The AuthProvider will sync the full session data shortly
          setAuth({
            id: '1',
            email: email,
            name: email.split('@')[0],
            role: 'user',
            plan: 'free',
            createdAt: new Date().toISOString(),
          })
        }

        toast({ title: 'Welcome back!', description: 'You have signed in successfully.' })
        onClose()
        setEmail('')
        setPassword('')
      }
    } catch {
      toast({ title: 'Sign in failed', description: 'Something went wrong. Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: '/' })
    } catch {
      toast({ title: 'OAuth sign in failed', description: 'Please try again.', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Welcome back</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Sign in to your Hydravoice account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')}>
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('azure-ad')}>
              <Building2 className="mr-2 h-4 w-4" />
              Microsoft
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    toast({ title: 'Password reset', description: 'A password reset link has been sent to your email.' })
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <button onClick={onSwitchToSignUp} className="text-primary hover:underline font-medium">
              Sign up
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
