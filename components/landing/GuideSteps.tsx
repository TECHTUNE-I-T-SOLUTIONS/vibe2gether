"use client"

import { useI18n } from "@/lib/i18n/context"
import { motion } from "framer-motion"
import { Users, Search, BookOpen } from "lucide-react"

const steps = [
  {
    id: 1,
    icon: Users,
    titleKey: "networkStepTitle",
    descKey: "networkStepDesc",
    color: "bg-blue-500",
  },
  {
    id: 2,
    icon: Search,
    titleKey: "findOppsStepTitle",
    descKey: "findOppsStepDesc",
    color: "bg-primary",
  },
  {
    id: 3,
    icon: BookOpen,
    titleKey: "learnGrowStepTitle",
    descKey: "learnGrowStepDesc",
    color: "bg-orange-500",
  },
]

export function GuideSteps() {
  const { t } = useI18n()

  return (
    <section className="py-24 bg-background border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="flex flex-col items-start space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl gradient-bg shadow-lg shadow-primary/20">
                  {step.id}
                </div>
                <h3 className="text-2xl font-bold">{t(step.titleKey)}</h3>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed pl-16">
                {t(step.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
