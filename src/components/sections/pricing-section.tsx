'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import {
  Check,
  Zap,
  Flame,
  Waves,
  Building2,
  Crown,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
}

interface PricingTier {
  id: string
  name: string
  tagline: string
  monthlyPrice: number | null
  annualTotal: number | null
  charLimit: string
  description: string
  features: string[]
  popular: boolean
  icon: React.ElementType
  cta: string
  engineLabel: string
}

const TIERS: PricingTier[] = [
  {
    id: 'echo',
    name: 'ECHO',
    tagline: 'Free forever',
    monthlyPrice: 0,
    annualTotal: null,
    charLimit: '10,000 chars/mo',
    description: 'Try Hydravoice with no commitment. Perfect for occasional use.',
    features: [
      '10,000 characters per month',
      'Standard voice engine',
      'All 20 voice profiles',
      'WAV download',
      'Community support',
    ],
    popular: false,
    icon: Zap,
    cta: 'Get Started Free',
    engineLabel: 'Standard',
  },
  {
    id: 'spark',
    name: 'SPARK',
    tagline: 'Starter',
    monthlyPrice: 9,
    annualTotal: 86,
    charLimit: '500,000 chars/mo',
    description: 'For regular readers converting books and long documents.',
    features: [
      '500,000 characters per month',
      'Neural voice engine',
      'All 20 voice profiles',
      'WAV download',
      'Priority email support',
    ],
    popular: false,
    icon: Flame,
    cta: 'Start SPARK',
    engineLabel: 'Neural',
  },
  {
    id: 'roar',
    name: 'ROAR',
    tagline: 'Pro',
    monthlyPrice: 19,
    annualTotal: 182,
    charLimit: '2,000,000 chars/mo',
    description: 'The sweet spot for power users who demand premium quality.',
    features: [
      '2,000,000 characters per month',
      'Gemini AI voice engine',
      'All 20 voice profiles',
      'WAV download',
      'Priority processing',
      'Chapter splitting',
      'Priority support',
    ],
    popular: true,
    icon: Waves,
    cta: 'Start ROAR',
    engineLabel: 'Gemini AI',
  },
  {
    id: 'chorus',
    name: 'CHORUS',
    tagline: 'Business',
    monthlyPrice: 39,
    annualTotal: 374,
    charLimit: '6,000,000 chars/mo',
    description: 'Scale your audiobook production with ultra-premium voices.',
    features: [
      '6,000,000 characters per month',
      'xAI voice engine',
      'All 20 voice profiles',
      'WAV download',
      'Priority processing',
      'API access',
      'Dedicated support',
    ],
    popular: false,
    icon: Building2,
    cta: 'Start CHORUS',
    engineLabel: 'xAI',
  },
  {
    id: 'hydra',
    name: 'HYDRA',
    tagline: 'Enterprise',
    monthlyPrice: null,
    annualTotal: null,
    charLimit: 'Unlimited',
    description: 'Custom solutions for large organisations and high-volume teams.',
    features: [
      'Unlimited characters',
      'All voice engines',
      'Custom voice training',
      'REST API access',
      'White-label options',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    popular: false,
    icon: Crown,
    cta: 'Contact Sales',
    engineLabel: 'All engines',
  },
]

const FAQ_ITEMS = [
  {
    question: 'What file formats are supported?',
    answer: 'Hydravoice supports PDF, TXT, and DOCX files up to 20 MB. Our intelligent parser handles complex formatting, tables, footnotes, and multi-chapter documents.',
  },
  {
    question: 'How are characters counted?',
    answer: 'Characters are counted from the text extracted from your uploaded document. Spaces and punctuation count. Your monthly allowance resets on your billing date each month.',
  },
  {
    question: 'What is the difference between voice engines?',
    answer: 'Standard (ECHO) uses AWS Polly for solid baseline quality. Neural (SPARK) adds natural cadence. Gemini AI (ROAR) delivers expressive, human-like narration. xAI (CHORUS/HYDRA) provides the most advanced synthesis available.',
  },
  {
    question: 'Can I preview voices before converting?',
    answer: 'Yes — every voice has a preview button. Click play to hear a short sample and find the perfect narrator before you commit to a full conversion.',
  },
  {
    question: 'What happens when I reach my monthly limit?',
    answer: 'Conversion is paused until your limit resets on your next billing date. You can upgrade your plan at any time to increase your character allowance immediately.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, cancel anytime from account settings. You keep full access until the end of your current billing period — no partial-month charges.',
  },
  {
    question: 'Is there an API for integration?',
    answer: 'CHORUS and HYDRA plans include full REST API access with documentation, so you can integrate Hydravoice into your own applications and workflows.',
  },
]

function formatMonthlyDisplay(tier: PricingTier, annual: boolean): string {
  if (tier.monthlyPrice === null) return 'Custom'
  if (tier.monthlyPrice === 0) return '$0'
  if (annual && tier.annualTotal !== null) {
    return `$${(tier.annualTotal / 12).toFixed(2)}`
  }
  return `$${tier.monthlyPrice}`
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false)
  const { isAuthenticated } = useAppStore()
  const { toast } = useToast()

  const handleSelectPlan = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) {
      if (!isAuthenticated) {
        toast({ title: 'Sign up required', description: 'Create a free account to get started.' })
      } else {
        toast({ title: 'You are on the ECHO plan', description: 'Upgrade anytime to unlock more characters and better voice engines.' })
      }
    } else if (tier.id === 'hydra') {
      toast({ title: 'Enterprise enquiry', description: "We'll be in touch shortly. Thank you for your interest!" })
    } else {
      toast({
        title: `${tier.name} plan selected`,
        description: 'Payment integration coming soon. Thank you for your interest!',
      })
    }
  }

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="text-center mb-16"
      >
        <motion.h1 variants={fadeInUp} className="text-3xl sm:text-5xl font-bold mb-4">
          Simple, transparent pricing
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
          Character-based plans that scale with you. Start free and upgrade when you need more.
        </motion.p>

        {/* Annual toggle */}
        <motion.div variants={fadeInUp} className="flex items-center justify-center gap-3">
          <Label
            htmlFor="billing-toggle"
            className={`text-sm ${!annual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          >
            Monthly
          </Label>
          <Switch id="billing-toggle" checked={annual} onCheckedChange={setAnnual} />
          <Label
            htmlFor="billing-toggle"
            className={`text-sm ${annual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          >
            Annual
          </Label>
          {annual && (
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
              Save 20%
            </Badge>
          )}
        </motion.div>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-5 mb-20"
      >
        {TIERS.map((tier) => (
          <motion.div key={tier.id} variants={fadeInUp} className="flex">
            <Card
              className={`relative w-full flex flex-col transition-all duration-300 ${
                tier.popular
                  ? 'glass border-primary/40 teal-glow-sm lg:scale-[1.04]'
                  : 'glass hover:border-primary/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold whitespace-nowrap">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3 pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <tier.icon
                    className={`h-4 w-4 flex-shrink-0 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <CardTitle className="text-base font-bold tracking-wide">{tier.name}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{tier.tagline}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{tier.description}</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col pt-0">
                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {formatMonthlyDisplay(tier, annual)}
                    </span>
                    {tier.monthlyPrice !== null && tier.monthlyPrice > 0 && (
                      <span className="text-muted-foreground text-xs">/mo</span>
                    )}
                    {tier.monthlyPrice === 0 && (
                      <span className="text-muted-foreground text-xs">forever</span>
                    )}
                  </div>
                  {annual && tier.annualTotal !== null && tier.monthlyPrice !== null && tier.monthlyPrice > 0 && (
                    <p className="text-xs text-primary mt-0.5">
                      ${tier.annualTotal}/year
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{tier.charLimit}</p>
                  <Badge
                    variant="outline"
                    className="mt-1.5 text-[10px] px-1.5 py-0 border-primary/30 text-primary"
                  >
                    {tier.engineLabel}
                  </Badge>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <Check
                        className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                          tier.popular ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(tier)}
                  className={`w-full text-xs h-8 ${
                    tier.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 teal-glow-sm'
                      : ''
                  }`}
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {tier.cta}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <HelpCircle className="h-8 w-8 text-primary mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about Hydravoice</p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="glass rounded-xl px-4 border-none"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  )
}
