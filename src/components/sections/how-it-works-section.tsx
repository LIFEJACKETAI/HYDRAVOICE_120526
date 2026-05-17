'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Zap,
  Cpu,
  Sparkles,
  Bot,
  Upload,
  Mic2,
  Download,
  FileText,
  Scissors,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
}

const ENGINES = [
  {
    icon: Zap,
    name: 'Standard',
    provider: 'AWS Polly via Puter',
    plan: 'ECHO (Free)',
    planColor: 'text-muted-foreground',
    description:
      'Reliable, wide-language synthesis. Uses your Puter account\'s free allocation — no extra cost for most users on the free tier.',
    voices: ['Joanna', 'Matthew', 'Amy', 'Brian', 'Celine', 'Hans', '+ many more'],
    tag: 'ECHO plan',
    tagClass: 'border-muted-foreground/30 text-muted-foreground',
    puterCost: 'Puter free tier',
  },
  {
    icon: Cpu,
    name: 'Neural',
    provider: 'AWS Neural TTS via Puter',
    plan: 'SPARK (Starter)',
    planColor: 'text-blue-400',
    description:
      'Higher quality, more natural cadence. Uses Puter credits at the neural rate — slightly higher cost per character than standard.',
    voices: ['Joanna (neural)', 'Matthew (neural)', 'Amy (neural)', 'Brian (neural)', '+ more'],
    tag: 'SPARK plan',
    tagClass: 'border-blue-400/30 text-blue-400',
    puterCost: 'Puter neural credits',
  },
  {
    icon: Sparkles,
    name: 'Gemini AI',
    provider: 'Google Gemini via Puter',
    plan: 'ROAR (Pro)',
    planColor: 'text-primary',
    description:
      'Expressive, human-like narration. Supports 30 unique voices and natural language style instructions. Higher Puter credit cost per request.',
    voices: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Leda', '+ 24 more'],
    tag: 'ROAR plan',
    tagClass: 'border-primary/30 text-primary',
    puterCost: 'Puter Gemini credits',
  },
  {
    icon: Bot,
    name: 'xAI (Grok)',
    provider: 'xAI Grok via Puter',
    plan: 'CHORUS (Business)',
    planColor: 'text-purple-400',
    description:
      'Most expressive engine. Supports speech tags like [pause], [laugh], and <whisper> for dynamic narration. Premium Puter credit cost.',
    voices: ['Eve (energetic)', 'Ara (warm)', 'Rex (confident)', 'Sal (smooth)', 'Leo (authoritative)'],
    tag: 'CHORUS plan',
    tagClass: 'border-purple-400/30 text-purple-400',
    puterCost: 'Puter xAI credits',
  },
]

const VALUE_ADD = [
  {
    icon: FileText,
    title: 'Document extraction',
    body: 'Puter only handles plain text strings. Hydravoice extracts clean, structured text from PDFs, DOCX, and TXT files server-side — stripping garbage formatting, headers, footers, and page numbers before anything reaches the TTS engine.',
  },
  {
    icon: Scissors,
    title: 'Smart chunking & orchestration',
    body: 'Passing a 50-page document directly to puter.ai.txt2speech() will crash or time out. Hydravoice splits your text into sentence-boundary-aware chunks, fires each call with an 800ms delay to stay under Puter\'s rate limits, and handles retries automatically.',
  },
  {
    icon: Layers,
    title: 'Seamless audio stitching',
    body: 'Puter returns individual audio buffers — one per chunk. Hydravoice decodes every buffer via the Web Audio API and merges them into a single, perfectly seamless WAV file ready to download. No gaps, no glitches, no manual joining.',
  },
  {
    icon: Mic2,
    title: '20 curated voice profiles',
    body: 'Puter gives you raw voices. Hydravoice wraps them into 20 named profiles with speed tuning, accent grouping, and preview playback — so you can pick the right narrator without knowing anything about the underlying API.',
  },
]

const STEPS = [
  {
    icon: Upload,
    step: '01',
    title: 'Upload your document',
    description: 'Drop a PDF, TXT, or DOCX file. Hydravoice\'s server extracts clean text — no manual copy-paste.',
  },
  {
    icon: Mic2,
    step: '02',
    title: 'Sign into Puter & choose a voice',
    description: 'On first use, Puter will ask you to sign in (free account). Then pick one of 20 voice profiles and hit preview.',
  },
  {
    icon: Zap,
    step: '03',
    title: 'Hydravoice orchestrates Puter',
    description: 'Text is chunked, paced, and sent to Puter\'s TTS engine in your browser. Puter draws on your account\'s credit balance for each call.',
  },
  {
    icon: Download,
    step: '04',
    title: 'Download your audiobook',
    description: 'All audio buffers are stitched into one WAV file and downloaded straight to your device.',
  },
]

function EngineCard({ engine }: { engine: typeof ENGINES[0] }) {
  const [open, setOpen] = useState(false)
  const Icon = engine.icon

  return (
    <motion.div variants={fadeInUp}>
      <Card
        className="glass hover:border-primary/20 transition-all duration-300 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{engine.name}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${engine.tagClass}`}>
                    {engine.tag}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {engine.provider} ·{' '}
                  <span className="text-amber-400">{engine.puterCost}</span>
                </p>
              </div>
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
            )}
          </div>

          {open && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{engine.description}</p>
              <div>
                <p className="text-xs font-medium mb-1.5">Available voices</p>
                <div className="flex flex-wrap gap-1.5">
                  {engine.voices.map((v) => (
                    <span
                      key={v}
                      className="text-[11px] bg-muted/50 rounded px-2 py-0.5 text-muted-foreground"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function HowItWorksSection() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

      {/* Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="text-center mb-16"
      >
        <motion.div variants={fadeInUp} className="flex justify-center mb-4">
          <Badge className="bg-primary/15 text-primary border-primary/30 px-4 py-1">
            Powered by Puter.js
          </Badge>
        </motion.div>
        <motion.h1 variants={fadeInUp} className="text-3xl sm:text-5xl font-bold mb-4">
          How Hydravoice works
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Hydravoice uses{' '}
          <a
            href="https://developer.puter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Puter.js
          </a>{' '}
          to deliver text-to-speech directly in your browser. Here's exactly what that means — and what Hydravoice adds on top.
        </motion.p>
      </motion.div>

      {/* Transparency notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Transparency: how Puter's credits work</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Puter is a platform that routes your TTS requests to providers like AWS, Google, and xAI.
                  It runs inside your browser and uses credits from <strong>your Puter account</strong> — not Hydravoice's servers.
                  A free Puter account comes with a starting credit balance that covers standard-engine usage.
                  Higher-quality engines (Neural, Gemini, xAI) draw on more credits, which Puter replenishes on a
                  pay-as-you-go or subscription basis at <a href="https://puter.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">puter.com</a>.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Standard engine (ECHO plan) — covered by Puter's free account tier for most users
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Neural, Gemini & xAI engines — require Puter credits; usage billed by Puter at their rates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What Hydravoice adds */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
        className="mb-16"
      >
        <motion.h2 variants={fadeInUp} className="text-xl font-bold mb-2 text-center">
          "If Puter is free, why pay for Hydravoice?"
        </motion.h2>
        <motion.p variants={fadeInUp} className="text-muted-foreground text-sm text-center mb-6 max-w-2xl mx-auto">
          Puter handles the raw speech synthesis. Hydravoice is the engineering layer that makes it actually usable for long documents — four things Puter cannot do on its own.
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUE_ADD.map((item) => {
            const Icon = item.icon
            return (
              <motion.div key={item.title} variants={fadeInUp}>
                <Card className="glass h-full border-primary/10">
                  <CardContent className="p-5 flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Step-by-step */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
        className="mb-16"
      >
        <motion.h2 variants={fadeInUp} className="text-xl font-bold mb-6 text-center">
          From document to audiobook — step by step
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <motion.div key={step.step} variants={fadeInUp}>
                <Card className="glass h-full">
                  <CardContent className="p-5 flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-primary">{step.step}</span>
                        <span className="font-semibold text-sm">{step.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Voice engines */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
        className="mb-16"
      >
        <motion.h2 variants={fadeInUp} className="text-xl font-bold mb-2 text-center">
          Voice engines by plan
        </motion.h2>
        <motion.p variants={fadeInUp} className="text-muted-foreground text-sm text-center mb-6">
          Each engine maps to a Puter TTS provider. Tap any row to see voices and credit details.
        </motion.p>
        <div className="space-y-3">
          {ENGINES.map((engine) => (
            <EngineCard key={engine.name} engine={engine} />
          ))}
        </div>
      </motion.section>

      {/* Puter quick-start */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className="glass border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-1">Want to build with Puter yourself?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              One script tag is all you need to add TTS to any web project — no backend, no API key.
              Users sign into their own Puter account and their own credits are used.
            </p>
            <pre className="bg-muted/40 rounded-lg p-4 text-xs overflow-x-auto mb-4">
              <code className="text-primary">{`<script src="https://js.puter.com/v2/"></script>
<script>
  // Puter will prompt sign-in on first use (free account)
  // Standard engine — uses Puter's free credit allocation
  puter.ai.txt2speech("Hello, world!")
    .then(audio => audio.play());

  // Neural (SPARK+) — costs Puter neural credits
  puter.ai.txt2speech("Hello!", { engine: "neural" })
    .then(audio => audio.play());

  // Gemini (ROAR+) — costs Puter Gemini credits
  puter.ai.txt2speech("Hello!", {
    provider: "gemini",
    model: "gemini-2.5-flash-preview-tts",
    voice: "Puck",
    instructions: "Speak warmly and clearly."
  }).then(audio => audio.play());

  // xAI (CHORUS+) — costs Puter xAI credits
  puter.ai.txt2speech("Welcome! [pause] Let's begin.", {
    provider: "xai",
    voice: "eve"
  }).then(audio => audio.play());
</script>`}</code>
            </pre>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://developer.puter.com/tutorials/free-unlimited-text-to-speech-api/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Full TTS tutorial
              </a>
              <a
                href="https://docs.puter.com/AI/txt2speech/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                API reference
              </a>
              <a
                href="https://puter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Manage Puter credits
              </a>
              <a
                href="https://github.com/heyPuter/puter/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub (41.4k ★)
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.section>

    </div>
  )
}
