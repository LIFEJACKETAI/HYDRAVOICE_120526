'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Navbar } from '@/components/navbar'
import { HomeSection } from '@/components/sections/home-section'
import { CreateSection } from '@/components/sections/create-section'
import { PricingSection } from '@/components/sections/pricing-section'
import { AccountSection } from '@/components/sections/account-section'
import { AdminSection } from '@/components/sections/admin-section'
import { HydravoiceIcon } from '@/components/hydravoice-icon'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export default function Home() {
  const { currentPage } = useAppStore()

  const renderSection = () => {
    switch (currentPage) {
      case 'home':
        return <HomeSection />
      case 'create':
        return <CreateSection />
      case 'pricing':
        return <PricingSection />
      case 'account':
        return <AccountSection />
      case 'admin':
        return <AdminSection />
      default:
        return <HomeSection />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-auto border-t border-border glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HydravoiceIcon size={20} />
              <span className="text-sm text-muted-foreground">© 2024 Hydravoice. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <button className="hover:text-foreground transition-colors">Privacy Policy</button>
              <button className="hover:text-foreground transition-colors">Terms of Service</button>
              <button className="hover:text-foreground transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
