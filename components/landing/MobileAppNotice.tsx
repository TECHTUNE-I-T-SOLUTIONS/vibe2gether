"use client"

import { useI18n } from "@/lib/i18n/context"
import { motion } from "framer-motion"
import { Apple, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function MobileAppNotice() {
  const { t } = useI18n()

  return (
    <section className="py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-[3rem] p-8 md:p-16 border border-primary/10 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                {t("getAppTitle")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                {t("getAppDesc")}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-16 px-8 rounded-2xl bg-black text-white hover:bg-zinc-900 border-none">
                  <Apple className="mr-3 w-6 h-6 fill-current" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase leading-none opacity-60">Download on the</p>
                    <p className="text-lg font-bold leading-none mt-1">App Store</p>
                  </div>
                </Button>
                <Button size="lg" className="h-16 px-8 rounded-2xl bg-black text-white hover:bg-zinc-900 border-none">
                  <PlayCircle className="mr-3 w-6 h-6 fill-current" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase leading-none opacity-60">Get it on</p>
                    <p className="text-lg font-bold leading-none mt-1">Google Play</p>
                  </div>
                </Button>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative flex justify-center"
            >
              <div className="relative w-[300px] h-[600px] scale-90 md:scale-100">
                {/* Mock Phone Frame */}
                <div className="absolute inset-0 bg-zinc-900 rounded-[3rem] border-8 border-zinc-800 shadow-2xl overflow-hidden">
                  <Image 
                    src="https://pixabay.com/get/gf057ebd016c1de4d3180abfee9932b2e0a10bc6835e9033bc3193790f42c0ee17c18d7a01ed8769c3c52b985656a4f64.svg" 
                    alt="App Screenshot. Attribution: marcmanhart on Pixabay"
                    fill
                    className="object-cover bg-white"
                  />
                </div>
                {/* Camera Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-20" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
