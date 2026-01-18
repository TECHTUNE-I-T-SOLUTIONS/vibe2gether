"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  HelpCircle,
  ShoppingBag,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react"

const contactReasons = [
  { value: "general", label: "General Inquiry", icon: MessageSquare },
  { value: "support", label: "Customer Support", icon: HelpCircle },
  { value: "feature", label: "Feature Product Request", icon: ShoppingBag },
  { value: "report", label: "Report an Issue", icon: AlertCircle },
  { value: "partnership", label: "Partnership Inquiry", icon: Mail },
]

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "officialvibe2gether@gmail.com",
    description: "For general inquiries",
  },
  // {
  //   icon: Phone,
  //   title: "Phone",
  //   value: "+1 (888) 555-VIBE",
  //   description: "Mon-Fri, 9am-6pm EST",
  // },
  // {
  //   icon: MapPin,
  //   title: "Address",
  //   value: "123 Connection Street",
  //   description: "New York, NY 10001, USA",
  // },
]

const faqs = [
  {
    question: "How do I get my product featured?",
    answer:
      "Submit a feature request through this form with details about your product. Our team reviews all submissions and will contact you within 5-7 business days.",
  },
  {
    question: "What are the requirements for featured products?",
    answer:
      "Products must align with our romantic/relationship theme, be high-quality, and have excellent customer reviews. We also consider pricing and availability.",
  },
  {
    question: "How long does the approval process take?",
    answer:
      "Typically 5-7 business days for initial review. If selected, we'll reach out to discuss terms and onboarding.",
  },
  {
    question: "Are there fees for featuring products?",
    answer:
      "We offer various partnership models. Contact us for specific pricing and commission structures based on your product category.",
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    subject: "",
    message: "",
    productName: "",
    productUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen pb-20 lg:pb-0">
        <Header />
        <main className="pt-20 md:pt-24">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Message Sent!</h1>
              <p className="text-muted-foreground mb-8">
                Thank you for reaching out. We've received your message and will get back to you within 24-48 hours.
              </p>
              <Button
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData({
                    name: "",
                    email: "",
                    reason: "",
                    subject: "",
                    message: "",
                    productName: "",
                    productUrl: "",
                  })
                }}
                className="rounded-full gradient-bg"
              >
                Send Another Message
              </Button>
            </div>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Get in <span className="gradient-text">Touch</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Have questions, feedback, or want to feature your product? We'd love to hear from you!
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Contact *</Label>
                        <Select
                          value={formData.reason}
                          onValueChange={(value) => handleChange("reason", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactReasons.map((reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                <div className="flex items-center gap-2">
                                  <reason.icon className="w-4 h-4" />
                                  {reason.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Product Feature Request Fields */}
                      {formData.reason === "feature" && (
                        <div className="space-y-6 p-4 rounded-lg bg-muted/50 border border-border">
                          <p className="text-sm text-muted-foreground">
                            Interested in featuring your product on Vibe2Gether? Please provide the following details:
                          </p>
                          <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="productName">Product Name *</Label>
                              <Input
                                id="productName"
                                placeholder="Your product name"
                                value={formData.productName}
                                onChange={(e) => handleChange("productName", e.target.value)}
                                required={formData.reason === "feature"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="productUrl">Product URL</Label>
                              <Input
                                id="productUrl"
                                type="url"
                                placeholder="https://yourproduct.com"
                                value={formData.productUrl}
                                onChange={(e) => handleChange("productUrl", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          placeholder="Brief summary of your inquiry"
                          value={formData.subject}
                          onChange={(e) => handleChange("subject", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us more about your inquiry..."
                          rows={6}
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full rounded-full gradient-bg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            Send Message
                            <Send className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Info */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {contactInfo.map((info, i) => {
                      const Icon = info.icon
                      return (
                        <div key={i} className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{info.title}</div>
                            <div className="text-foreground">{info.value}</div>
                            <div className="text-sm text-muted-foreground">{info.description}</div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* Response Time */}
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-medium">Response Time</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within 24-48 hours. For urgent matters, please call our support line.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQs */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-8 text-center">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {faqs.map((faq, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
