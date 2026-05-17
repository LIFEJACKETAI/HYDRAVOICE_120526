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
  Globe,
  Lock,
  Infinity,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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
    provider: 'AWS Polly',
    plan: 'ECHO (Free)',
    planColor: 'text-muted-foreground',
    description:
      'Solid, reliable synthesis with wide language support. Great for long documents where natural pacing matters more than expressiveness.',
    voices: ['Joanna', 'Matthew', 'Amy', 'Brian', 'Celine', 'Hans', '+ many more'],
    tag: 'Free — no credits',
    tagClass: 'border-muted-foreground/30 text-muted-foreground',
  },
  {
    icon: Cpu,
    name: 'Neural',
    provider: 'AWS Neural TTS',
    plan: 'SPARK (Starter)',
    planColor: 'text-blue-400',
    description:
      'Higher quality, more natural cadence using neural network synthesis. Noticeably more lifelike than standard, especially for long-form reading.',
    voices: ['Joanna (neural)', 'Matthew (neural)', 'Amy (neural)', 'Brian (neural)', '+ more'],
    tag: 'Starter+',
    tagClass: 'border-blue-400/30 text-blue-400',
  },
  {
    icon: Sparkles,
    name: 'Gemini AI',
    provider: 'Google Gemini',
    plan: 'ROAR (Pro)',
    planColor: 'text-primary',
    description:
      'Expressive, human-like narration powered by Google\'s Gemini models. Supports 30 unique voices and natural language style instructions — e.g. "speak warmly and slowly".',
    voices: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Leda', '+ 24 more'],
    tag: 'Pro+',
    tagClass: 'border-primary/30 text-primary',
  },
  {
    icon: Bot,
    name: 'xAI (Grok)',
    provider: 'xAI / Grok',
    plan: 'CHORUS (Business)',
    planColor: 'text-purple-400',
    description:
      'The most expressive engine available. Supports speech tags like [pause], [laugh], and <whisper> for dramatic, dynamic narration.',
    voices: ['Eve (energetic)', 'Ara (warm)', 'Rex (confident)', 'Sal (smooth)', 'Leo (authoritative)'],
    tag: 'Business+',
    tagClass: 'border-purple-400/30 text-purple-400',
  },
]

const STEPS = [
  {
    icon: Upload,
    step: '01',
    title: 'Upload your document',
    description:
      'Drop in a PDF, TXT, or DOCX file up to 20 MB. Hydravoice extracts the text server-side — no manual copy-paste needed.',
  },
  {
    icon: Mic2,
    step: '02',
    title: 'Choose your voice',
    description:
      'Pick from 20 curated voice profiles across American and British accents. Hit the preview button to hear a sample before committing.',
  },
  {
    icon: Zap,
    step: '03',
    title: 'Puter converts it',
    description:
      'Your text is chunked and sent to Puter.js running right in your browser. No API keys, no backend TTS server — Puter handles everything client-side.',
  },
  {
    icon: Download,
    step: '04',
    title: 'Download your audiobook',
    description:
      'The audio chunks are decoded and stitched into a single clean WAV file using the Web Audio API, then downloaded straight to your device.',
  },
]

const WHY_PUTER = [
  {
    icon: Lock,
    title: 'Zero API keys',
    body: 'Puter authenticates silently via its CDN script. You never register with AWS, Google, or xAI — Puter handles all provider credentials behind the scenes.',
  },
  {
    icon: Globe,
    title: 'Runs in your browser',
    body: 'All TTS synthesis happens client-side. Your document text never passes through Hydravoice\'s servers on the way to a speech engine — it goes directly from your browser to Puter.',
  },
  {
    icon: Infinity,
    title: 'No usage meter',
    body: 'Puter imposes no hard usage caps on its free tier. Your plan limit (10k–6M chars/mo) is a Hydravoice service tier, not a Puter constraint.',
  },
]

function EngineCard({ engine, index }: { engine: typeof ENGINES[0]; index: number }) {
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
                  Powered by {engine.provider} · Available on{' '}
                  <span className={engine.planColor}>{engine.plan}</span>
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
        <motion.p
          variants={fadeInUp}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Hydravoice uses{' '}
          <a
            href="https://developer.puter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Puter.js
          </a>{' '}
          to deliver free, unlimited text-to-speech directly in your browser — no API keys,
          no backend speech server, no sign-ups with AWS or Google.
        </motion.p>
      </motion.div>

      {/* How-to steps */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
        className="mb-20"
      >
        <motion.h2 variants={fadeInUp} className="text-xl font-bold mb-6 text-center">
          Four steps from document to audiobook
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

      {/* Why Puter */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
        className="mb-20"
      >
        <motion.h2 variants={fadeInUp} className="text-xl font-bold mb-6 text-center">
          Why Puter.js?
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {WHY_PUTER.map((item) => {
            const Icon = item.icon
            return (
              <motion.div key={item.title} variants={fadeInUp}>
                <Card className="glass h-full">
                  <CardContent className="p-5 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <p className="font-semibold text-sm mb-2">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
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
        className="mb-20"
      >
        <motion.h2 variants={fadeInUp} className="text-xl font-bold mb-2 text-center">
          Voice engines by plan
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="text-muted-foreground text-sm text-center mb-6"
        >
          Tap any engine to expand details and available voices.
        </motion.p>
        <div className="space-y-3">
          {ENGINES.map((engine, i) => (
            <EngineCard key={engine.name} engine={engine} index={i} />
          ))}
        </div>
      </motion.section>

      {/* Puter quick-start */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <Card className="glass border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-1">Puter.js quick-start</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Want to add free TTS to your own project? Drop one script tag and you're done.
            </p>
            <pre className="bg-muted/40 rounded-lg p-4 text-xs overflow-x-auto mb-4">
              <code className="text-primary">{`<script src="https://js.puter.com/v2/"></script>

<script>
  // Basic usage — no API key needed
  puter.ai.txt2speech("Hello, world!")
    .then(audio => audio.play());

  // Neural engine (SPARK plan+)
  puter.ai.txt2speech("Hello!", { engine: "neural" })
    .then(audio => audio.play());

  // Gemini with style instructions
  puter.ai.txt2speech("Hello!", {
    provider: "gemini",
    model: "gemini-2.5-flash-preview-tts",
    voice: "Puck",
    instructions: "Speak in a warm, friendly tone."
  }).then(audio => audio.play());

  // xAI with expressive tags
  puter.ai.txt2speech("Welcome! [pause] Let's begin.", {
    provider: "xai",
    voice: "eve"
  }).then(audio => audio.play());
</script>`}</code>
            </pre>
            <div className="flex flex-wrap gap-3">
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
                href="https://docs.puter.com/playground/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Live playground
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
