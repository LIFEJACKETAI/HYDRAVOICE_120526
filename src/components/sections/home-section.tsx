'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HydravoiceIcon } from '@/components/hydravoice-icon'
import { Mic, FileText, Download, Upload, Volume2, Headphones, Star, Users, BookOpen } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function HomeSection() {
  const { setCurrentPage, isAuthenticated } = useAppStore()

  return (
    <div className="relative overflow-hidden">
      {/* Animated background waves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-primary/3 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/4 blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="text-center"
        >
          {/* Sound bar animation */}
          <motion.div variants={fadeInUp} className="flex justify-center items-end gap-1 mb-8 h-12">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 bg-primary/60 rounded-full sound-bar-${i + 1}`}
                style={{ height: '100%' }}
              />
            ))}
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Transform Your Documents
            <br />
            <span className="gradient-text">Into Audiobooks</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Upload any PDF, TXT, or DOCX file and convert it to natural-sounding audio
            with 20+ premium voices. Listen anywhere, anytime.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setCurrentPage('create')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 teal-glow text-lg px-8 py-6"
            >
              <Upload className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentPage('pricing')}
              className="text-lg px-8 py-6"
            >
              View Pricing
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Cards */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Mic,
              title: '20+ Premium Voices',
              description: 'Choose from a diverse collection of natural-sounding voices with various accents and styles to match your content perfectly.',
            },
            {
              icon: FileText,
              title: 'Multiple Formats',
              description: 'Upload PDF, TXT, or DOCX files. Our smart parser handles complex formatting, footnotes, and multi-chapter documents.',
            },
            {
              icon: Download,
              title: 'Instant Download',
              description: 'Get your audiobook in seconds. Download as MP3 for offline listening on any device, anytime, anywhere.',
            },
          ].map((feature, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <Card className="glass hover:teal-glow-sm transition-all duration-300 group h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How it works
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-center max-w-xl mx-auto mb-16">
            Three simple steps to transform your reading material into immersive audio experiences
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

            {[
              {
                step: '01',
                icon: Upload,
                title: 'Upload',
                description: 'Drag and drop your document. We support PDF, TXT, and DOCX formats up to any size.',
              },
              {
                step: '02',
                icon: Volume2,
                title: 'Choose Voice',
                description: 'Browse our voice library and preview each voice. Select the perfect narrator for your content.',
              },
              {
                step: '03',
                icon: Headphones,
                title: 'Download Audio',
                description: 'Your audiobook is ready in seconds. Download the MP3 file and listen on any device.',
              },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center relative">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 relative">
                  <item.icon className="h-10 w-10 text-primary" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <div className="glass rounded-2xl p-8 sm:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {[
                { value: '50K+', label: 'Active Users', icon: Users },
                { value: '1M+', label: 'Pages Converted', icon: BookOpen },
                { value: '4.9★', label: 'Average Rating', icon: Star },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeInUp} className="space-y-2">
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <HydravoiceIcon size={48} className="mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to listen to your documents?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of users who are already transforming their reading material into engaging audiobooks.
          </p>
          <Button
            size="lg"
            onClick={() => setCurrentPage('create')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 teal-glow text-lg px-8 py-6"
          >
            Start Creating — It&apos;s Free
          </Button>
        </motion.div>
      </section>
    </div>
  )
}
