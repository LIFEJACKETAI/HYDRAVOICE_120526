'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, PageType } from '@/lib/store'
import { HydravoiceIcon } from '@/components/hydravoice-icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu, X, User, Shield, LogOut } from 'lucide-react'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { SignUpModal } from '@/components/auth/sign-up-modal'

const navLinks: { label: string; page: PageType }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Create', page: 'create' },
  { label: 'Pricing', page: 'pricing' },
]

export function Navbar() {
  const { currentPage, setCurrentPage, isAuthenticated, user, logout } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [signUpOpen, setSignUpOpen] = useState(false)

  const handleNavClick = (page: PageType) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 group"
            >
              <HydravoiceIcon size={32} />
              <span className="text-xl font-bold gradient-text">Hydravoice</span>
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.page}
                  onClick={() => handleNavClick(link.page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === link.page
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Auth section - desktop */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass w-56" align="end">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavClick('account')} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => handleNavClick('admin')} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setSignInOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => setSignUpOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 teal-glow-sm"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-strong border-t border-border"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.page}
                    onClick={() => handleNavClick(link.page)}
                    className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === link.page
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                {isAuthenticated && user && (
                  <>
                    <button
                      onClick={() => handleNavClick('account')}
                      className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        currentPage === 'account'
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      Account
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleNavClick('admin')}
                        className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === 'admin'
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        Admin
                      </button>
                    )}
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false) }}
                      className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-accent transition-all"
                    >
                      Sign Out
                    </button>
                  </>
                )}
                {!isAuthenticated && (
                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setSignInOpen(true); setMobileMenuOpen(false) }}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => { setSignUpOpen(true); setMobileMenuOpen(false) }}
                      className="w-full bg-primary text-primary-foreground"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSwitchToSignUp={() => { setSignInOpen(false); setSignUpOpen(true) }}
      />
      <SignUpModal
        open={signUpOpen}
        onClose={() => setSignUpOpen(false)}
        onSwitchToSignIn={() => { setSignUpOpen(false); setSignInOpen(true) }}
      />
    </>
  )
}
