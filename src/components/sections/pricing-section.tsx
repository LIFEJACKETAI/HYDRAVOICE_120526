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
  Flame,
  Users,
  Infinity,
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
  tagline: string
  monthlyPrice: number
  annualPrice: number
  charLimit: string
  description: string
  features: string[]
  popular: boolean
  icon: React.ElementType
  cta: string
  enterprise?: boolean
}

const TIERS: PricingTier[] = [
  {
    name: 'ECHO',
    tagline: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    charLimit: '10,000 chars/month',
    description: 'Perfect for trying out Hydravoice with everyday reading needs.',
    features: [
      '10,000 characters per month',
      'All 20 premium voices',
      'WAV download',
      'PDF, TXT & DOCX support',
      'Community support',
    ],
    popular: false,
    icon: Zap,
    cta: 'Get Started Free',
  },
  {
    name: 'SPARK',
    tagline: 'Starter',
    monthlyPrice: 9,
    annualPrice: 7,
    charLimit: '500,000 chars/month',
    description: 'For avid readers who convert documents regularly.',
    features: [
      '500,000 characters per month',
      'All 20 premium voices',
      'WAV download',
      'PDF, TXT & DOCX support',
      'Priority email support',
      'Conversion history',
    ],
    popular: false,
    icon: Flame,
    cta: 'Start SPARK',
  },
  {
    name: 'ROAR',
    tagline: 'Pro',
    monthlyPrice: 19,
    annualPrice: 15,
    charLimit: '2,000,000 chars/month',
    description: 'For power users and content creators who need serious volume.',
    features: [
      '2,000,000 characters per month',
      'All 20 premium voices',
      'WAV download',
      'PDF, TXT & DOCX support',
      'Priority processing',
      'Priority support',
      'Conversion history',
    ],
    popular: true,
    icon: Zap,
    cta: 'Start ROAR',
  },
  {
    name: 'CHORUS',
    tagline: 'Business',
    monthlyPrice: 39,
    annualPrice: 31,
    charLimit: '6,000,000 chars/month',
    description: 'For teams and businesses with high-volume conversion needs.',
    features: [
      '6,000,000 characters per month',
      'All 20 premium voices',
      'WAV download',
      'PDF, TXT & DOCX support',
      'Priority processing',
      'Dedicated account support',
      'Usage analytics',
      'Team management',
    ],
    popular: false,
    icon: Users,
    cta: 'Start CHORUS',
  },
  {
    name: 'HYDRA',
    tagline: 'Enterprise',
    monthlyPrice: 0,
    annualPrice: 0,
    charLimit: 'Unlimited',
    description: 'Custom solutions for enterprises and large-scale deployments.',
    features: [
      'Unlimited characters',
      'All 20 premium voices',
      'All audio formats',
      'API access',
      'Custom voice training',
      'SLA guarantee',
      'Dedicated account manager',
      'Custom integrations',
    ],
    popular: false,
    icon: Infinity,
    cta: 'Contact Sales',
    enterprise: true,
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
    if (tier.enterprise) {
      toast({ title: 'HYDRA Enterprise', description: 'Contact us at hello@hydravoice.ai for custom pricing and integrations.' })
    } else if (tier.monthlyPrice === 0) {
      if (!isAuthenticated) {
        toast({ title: 'Sign up required', description: 'Create a free account to get started with ECHO.' })
      } else {
        toast({ title: 'You are on the ECHO plan', description: 'Upgrade anytime to unlock more characters.' })
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-20"
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
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <tier.icon className={`h-4 w-4 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-base font-bold">{tier.name}</CardTitle>
                </div>
                <p className={`text-xs font-medium ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`}>
                  {tier.tagline}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0">
                <div className="mb-4">
                  {tier.enterprise ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">Custom</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        ${tier.monthlyPrice === 0 ? '0' : annual ? tier.annualPrice : tier.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {tier.monthlyPrice === 0 ? '/forever' : '/mo'}
                      </span>
                    </div>
                  )}
                  {annual && tier.monthlyPrice > 0 && !tier.enterprise && (
                    <p className="text-xs text-primary mt-0.5">
                      Billed annually
                    </p>
                  )}
                  <p className="text-xs text-primary font-medium mt-1">{tier.charLimit}</p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(tier)}
                  className={`w-full text-sm ${
                    tier.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 teal-glow-sm'
                      : ''
                  }`}
                  variant={tier.popular ? 'default' : 'outline'}
                  size="sm"
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
