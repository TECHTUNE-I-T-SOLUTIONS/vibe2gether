"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  category: string
  message: string
  status: "new" | "read" | "responded" | "closed"
  priority: "low" | "normal" | "high" | "urgent"
  created_at: string
  updated_at: string
  response_notes: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [responseNotes, setResponseNotes] = useState("")
  const [filter, setFilter] = useState<"all" | "new" | "read" | "responded" | "closed">("all")

  useEffect(() => {
    fetchContacts()
  }, [filter])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      let query = supabase.from("contacts").select("*").order("created_at", { ascending: false })

      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      const { data, error } = await query

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error("Error fetching contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .update({ status: newStatus })
        .eq("id", id)

      if (error) throw error
      fetchContacts()
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const submitResponse = async () => {
    if (!selectedContact || !responseNotes.trim()) return

    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          status: "responded",
          response_notes: responseNotes,
          responded_at: new Date().toISOString(),
        })
        .eq("id", selectedContact.id)

      if (error) throw error

      setResponseNotes("")
      setSelectedContact(null)
      fetchContacts()
    } catch (error) {
      console.error("Error submitting response:", error)
    }
  }

  const openEmailReply = (contact: Contact) => {
    const subject = encodeURIComponent(`Re: ${contact.subject}`)
    const messageSummary = contact.message.substring(0, 100).replace(/"/g, '\\"')
    const body = encodeURIComponent(
      `Reply to your message "${messageSummary}..."\n\n[Your response here]\n\nBest regards,\nVibe2Gether Support Team`
    )
    const mailtoLink = `mailto:${contact.email}?cc=officialvibe2gether@gmail.com&subject=${subject}&body=${body}`
    window.location.href = mailtoLink
  }

  const priorityColor = {
    low: "bg-blue-100 text-blue-800",
    normal: "bg-gray-100 text-gray-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  }

  const statusColor = {
    new: "bg-yellow-100 text-yellow-800",
    read: "bg-blue-100 text-blue-800",
    responded: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-4xl font-bold">Contact Submissions</h1>
          <div className="flex flex-wrap gap-2">
            {["all", "new", "read", "responded", "closed"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                onClick={() => setFilter(status as any)}
                className="capitalize text-sm md:text-base px-3 md:px-4 py-1 md:py-2"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {contacts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No contact submissions found</p>
              </CardContent>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card
                key={contact.id}
                className="border-l-4"
                style={{
                  borderLeftColor:
                    contact.priority === "urgent"
                      ? "#ef4444"
                      : contact.priority === "high"
                        ? "#f97316"
                        : contact.priority === "normal"
                          ? "#6b7280"
                          : "#3b82f6",
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{contact.subject}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={statusColor[contact.status as keyof typeof statusColor]}>
                          {contact.status}
                        </Badge>
                        <Badge className={priorityColor[contact.priority as keyof typeof priorityColor]}>
                          {contact.priority}
                        </Badge>
                        {contact.category && (
                          <Badge variant="outline">{contact.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Contact Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">From:</span>
                        <span>{contact.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                          {contact.email}
                        </a>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <p className="font-semibold text-sm mb-2">Message:</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{contact.message}</p>
                    </div>

                    {/* Response Notes */}
                    {contact.response_notes && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="font-semibold text-sm mb-2">Response Notes:</p>
                        <p className="text-muted-foreground whitespace-pre-wrap">{contact.response_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap pt-4">
                      {contact.status === "new" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(contact.id, "read")}
                          className="text-xs md:text-sm"
                        >
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => openEmailReply(contact)}
                        className="text-xs md:text-sm"
                      >
                        {contact.status === "responded" ? "Edit Response" : "Add Response"}
                      </Button>
                      {contact.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(contact.id, "closed")}
                          className="text-xs md:text-sm"
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
