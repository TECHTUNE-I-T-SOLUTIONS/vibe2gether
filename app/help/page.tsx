"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Search,
  User,
  Settings,
  CreditCard,
  Shield,
  MessageCircle,
  Heart,
  Mail,
  Phone,
  ChevronRight,
  Loader,
  CheckCircle,
} from "lucide-react"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories = [
  { icon: User, title: "Account & Profile", description: "Manage your account and profile settings", count: 12 },
  { icon: Heart, title: "Connection & Messaging", description: "How connection works and messaging tips", count: 15 },
  { icon: MessageCircle, title: "Messaging", description: "Chat features and troubleshooting", count: 8 },
  { icon: CreditCard, title: "Payments & Subscriptions", description: "Billing, refunds, and premium", count: 10 },
  { icon: Shield, title: "Safety & Privacy", description: "Keep your account secure", count: 14 },
  { icon: Settings, title: "Technical Issues", description: "App problems and solutions", count: 9 },
]

const faqs = [
  {
    question: "How do I reset my password?",
    answer:
      "Go to the login page and click 'Forgot Password'. Enter your email address and we'll send you a link to reset your password. The link expires after 24 hours for security.",
  },
  {
    question: "How does connection work?",
    answer:
      "Our AI analyzes your profile, preferences, and behavior to find compatible Vibe. The more you use the app, the better our recommendations become. Swipe right on profiles you like and left on those you don't.",
  },
  {
    question: "How do I earn coins?",
    answer:
      "You earn coins through engagement: 10 profile views = 1 coin, 1 like = 1 coin, 1 new follower = 2 coins. You can also complete daily goals and participate in special events to earn bonus coins.",
  },
  {
    question: "Can I get a refund for my Premium subscription?",
    answer:
      "Yes, you can request a refund within 14 days of purchase if you haven't used Premium features extensively. Contact our support team with your purchase details.",
  },
  {
    question: "How do I report someone?",
    answer:
      "Tap the three dots on their profile or message and select 'Report'. Choose the reason and provide details. Our safety team reviews all reports within 24 hours.",
  },
  {
    question: "Why can't I send messages?",
    answer:
      "You can only message people you've connected with. Make sure you have a mutual connect before trying to send a message. Also check that you haven't been blocked by the user.",
  },
]

export default function HelpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "general",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit form")
      }

      setSubmitted(true)
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "general",
        message: "",
      })

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                How Can We <span className="gradient-text">Help</span>?
              </h1>
              <p className="text-xl text-muted-foreground mb-8">Search our knowledge base or browse categories below</p>
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for answers..."
                  className="pl-12 rounded-full bg-background h-14 text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat, i) => {
                const Icon = cat.icon
                return (
                  <Card
                    key={i}
                    className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <CardContent className="flex items-center gap-4 py-6">
                      <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{cat.title}</h3>
                        <p className="text-sm text-muted-foreground">{cat.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="bg-background border border-border rounded-xl px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
              Send us a message and our support team will get back to you as soon as possible
            </p>

            <div className="max-w-2xl mx-auto">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                      <p className="text-muted-foreground mb-4">
                        Your message has been submitted successfully. We'll get back to you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                          {error}
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Name *</label>
                          <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            required
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Email *</label>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Phone</label>
                          <Input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Category</label>
                          <Select value={formData.category} onValueChange={handleCategoryChange} disabled={loading}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General Inquiry</SelectItem>
                              <SelectItem value="account">Account & Profile</SelectItem>
                              <SelectItem value="technical">Technical Issues</SelectItem>
                              <SelectItem value="billing">Billing & Payments</SelectItem>
                              <SelectItem value="safety">Safety & Privacy</SelectItem>
                              <SelectItem value="feature-request">Feature Request</SelectItem>
                              <SelectItem value="bug-report">Bug Report</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Subject *</label>
                        <Input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="What is this about?"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Message *</label>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us more about your issue or question..."
                          required
                          rows={6}
                          disabled={loading}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-full gradient-bg text-white font-semibold h-12"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Alternative Contact Methods */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-4">Other Ways to Reach Us</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-border/50 text-center">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">Chat with our support team in real-time</p>
                  <a href="/contact">
                    <Button className="rounded-full gradient-bg">Start Chat</Button>
                  </a>
                </CardContent>
              </Card>
              <Card className="border-border/50 text-center">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">We&apos;ll respond within 24 hours</p>
                  <a href="mailto:info@vibe2gether.com">
                    <Button variant="outline" className="rounded-full bg-transparent">
                      info@vibe2gether.com
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
