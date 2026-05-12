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
  Building2,
  ArrowRight,
  HelpCircle,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.15 } },
}

interface PricingTier {
  name: string
  monthlyPrice: number
  annualPrice: number
  description: string
  features: string[]
  popular: boolean
  icon: React.ElementType
  cta: string
}

const TIERS: PricingTier[] = [
  {
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for trying out Hydravoice with basic conversion needs.',
    features: [
      '3 conversions per month',
      '5 minute max per file',
      'Standard voice selection',
      'MP3 download',
      'Email support',
    ],
    popular: false,
    icon: Zap,
    cta: 'Get Started Free',
  },
  {
    name: 'Pro',
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    description: 'For avid readers who convert documents regularly.',
    features: [
      '50 conversions per month',
      '2 hour max per file',
      'All 20+ premium voices',
      'Priority processing',
      'MP3 & WAV download',
      'Chapter splitting',
      'Priority email support',
    ],
    popular: true,
    icon: Zap,
    cta: 'Start Pro Trial',
  },
  {
    name: 'Enterprise',
    monthlyPrice: 29.99,
    annualPrice: 24.99,
    description: 'Unlimited conversions with API access for teams and businesses.',
    features: [
      'Unlimited conversions',
      'Unlimited file length',
      'All 20+ premium voices',
      'REST API access',
      'Priority processing',
      'All audio formats',
      'Dedicated account manager',
      'Custom voice training',
    ],
    popular: false,
    icon: Building2,
    cta: 'Contact Sales',
  },
]

const FAQ_ITEMS = [
  {
    question: 'What file formats are supported?',
    answer: 'Hydravoice supports PDF, TXT, and DOCX files. Our intelligent parser handles complex formatting, tables, footnotes, and multi-chapter documents with ease.',
  },
  {
    question: 'How long does conversion take?',
    answer: 'Most conversions complete within seconds to a few minutes, depending on the document length. Pro and Enterprise users get priority processing for even faster results.',
  },
  {
    question: 'Can I preview voices before converting?',
    answer: 'Absolutely! Every voice in our library has a preview button. Click play to hear a short sample and find the perfect narrator for your content.',
  },
  {
    question: 'What happens when I reach my monthly limit?',
    answer: 'Free users can upgrade to Pro for more conversions, or wait until the next month when the limit resets. Pro users who hit 50 conversions can upgrade to Enterprise for unlimited access.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time from your account settings. You will continue to have access until the end of your current billing period.',
  },
  {
    question: 'Is there an API for integration?',
    answer: 'Yes, Enterprise plan includes full REST API access with comprehensive documentation. You can integrate Hydravoice into your own applications and workflows.',
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)
  const { setCurrentPage, isAuthenticated } = useAppStore()
  const { toast } = useToast()

  const handleSelectPlan = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) {
      if (!isAuthenticated) {
        toast({ title: 'Sign up required', description: 'Create a free account to get started.' })
      } else {
        toast({ title: 'You are on the Starter plan', description: 'Upgrade anytime to access more features.' })
      }
    } else {
      toast({ title: `${tier.name} plan selected`, description: 'Payment integration coming soon. Thank you for your interest!' })
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
          Choose the plan that fits your needs. Start free and scale as you grow.
        </motion.p>

        {/* Annual toggle */}
        <motion.div variants={fadeInUp} className="flex items-center justify-center gap-3">
          <Label htmlFor="billing-toggle" className={`text-sm ${!annual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={annual}
            onCheckedChange={setAnnual}
          />
          <Label htmlFor="billing-toggle" className={`text-sm ${annual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
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
        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20"
      >
        {TIERS.map((tier) => (
          <motion.div key={tier.name} variants={fadeInUp}>
            <Card
              className={`relative h-full flex flex-col transition-all duration-300 ${
                tier.popular
                  ? 'glass border-primary/40 teal-glow-sm scale-[1.02]'
                  : 'glass hover:border-primary/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <tier.icon className={`h-5 w-5 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${annual ? tier.annualPrice : tier.monthlyPrice}
                    </span>
                    {tier.monthlyPrice > 0 && (
                      <span className="text-muted-foreground text-sm">/month</span>
                    )}
                    {tier.monthlyPrice === 0 && (
                      <span className="text-muted-foreground text-sm">forever</span>
                    )}
                  </div>
                  {annual && tier.monthlyPrice > 0 && (
                    <p className="text-xs text-primary mt-1">
                      Billed annually (${(annual ? tier.annualPrice : tier.monthlyPrice) * 12}/year)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(tier)}
                  className={`w-full ${
                    tier.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 teal-glow-sm'
                      : 'variant-outline'
                  }`}
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {tier.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
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
