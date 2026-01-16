"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import {
  Bell,
  AlertCircle,
  Megaphone,
  Zap,
  Gift,
  Calendar,
  X,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Eye,
  MousePointerClick,
  Clock,
  Info,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Announcement {
  id: string
  admin_id: string
  title: string
  message: string
  description?: string
  type: "general" | "alert" | "promotion" | "event" | "maintenance"
  priority: "low" | "normal" | "high" | "critical"
  background_color: string
  text_color: string
  icon?: string
  image_url?: string
  action_url?: string
  action_label?: string
  is_active: boolean
  is_published: boolean
  scheduled_at?: string
  expires_at?: string
  views_count: number
  clicks_count: number
  created_at: string
  updated_at: string
}

export function DashboardAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [trackedViewIds, setTrackedViewIds] = useState<Set<string>>(new Set())
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  // Track views when announcements are loaded
  useEffect(() => {
    const visibleAnnouncements = announcements.filter(
      (a) => !dismissedIds.has(a.id) && !trackedViewIds.has(a.id)
    )

    visibleAnnouncements.forEach((announcement) => {
      // Track view with a small delay to ensure it's actually visible
      const timer = setTimeout(() => {
        trackAnnouncementView(announcement.id)
        setTrackedViewIds((prev) => new Set([...prev, announcement.id]))
      }, 100)

      return () => clearTimeout(timer)
    })
  }, [announcements, dismissedIds, trackedViewIds])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/announcements")
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissedIds)
    newDismissed.add(id)
    setDismissedIds(newDismissed)
  }

  const trackAnnouncementView = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isClick: false }),
      })
    } catch (error) {
      console.error("Failed to track announcement view:", error)
    }
  }

  const trackAnnouncementClick = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isClick: true }),
      })
    } catch (error) {
      console.error("Failed to track announcement click:", error)
    }
  }

  const handleAction = (announcement: Announcement) => {
    trackAnnouncementClick(announcement.id)
    if (announcement.action_url) {
      window.open(announcement.action_url, "_blank")
    }
  }

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.has(a.id)
  )

  if (loading || visibleAnnouncements.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return AlertTriangle
      case "promotion":
        return Gift
      case "event":
        return Calendar
      case "maintenance":
        return Zap
      default:
        return Bell
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  }

  const slideVariants = {
    enter: {
      x: 1000,
      opacity: 0,
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
    exit: {
      zIndex: 0,
      x: -1000,
      opacity: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  const pulseVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  }

  return (
    <motion.div
      className="space-y-4 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center gap-2 px-1">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Announcements</h2>
      </div>

      <AnimatePresence mode="wait">
        {visibleAnnouncements.map((announcement, index) => {
          const IconComponent = getIcon(announcement.type)
          const isHighPriority =
            announcement.priority === "critical" ||
            announcement.priority === "high"
          const isMaintenance = announcement.type === "maintenance"

          // Enhanced theme-aware styling
          const getPriorityColor = () => {
            switch (announcement.priority) {
              case "critical":
                return {
                  border: "border-red-500 dark:border-red-400",
                  bg: "bg-red-50 dark:bg-red-950/30",
                  badge: "bg-red-500 dark:bg-red-600",
                  text: "text-red-700 dark:text-red-300",
                }
              case "high":
                return {
                  border: "border-orange-500 dark:border-orange-400",
                  bg: "bg-orange-50 dark:bg-orange-950/30",
                  badge: "bg-orange-500 dark:bg-orange-600",
                  text: "text-orange-700 dark:text-orange-300",
                }
              case "normal":
                return {
                  border: "border-blue-500 dark:border-blue-400",
                  bg: "bg-blue-50 dark:bg-blue-950/30",
                  badge: "bg-blue-500 dark:bg-blue-600",
                  text: "text-blue-700 dark:text-blue-300",
                }
              default:
                return {
                  border: "border-green-500 dark:border-green-400",
                  bg: "bg-green-50 dark:bg-green-950/30",
                  badge: "bg-green-500 dark:bg-green-600",
                  text: "text-green-700 dark:text-green-300",
                }
            }
          }

          const priorityColors = getPriorityColor()

          const getTypeLabel = () => {
            const labels: Record<string, string> = {
              general: "General",
              alert: "Alert",
              promotion: "Promotion",
              event: "Event",
              maintenance: "Maintenance",
            }
            return labels[announcement.type] || "General"
          }

          const formatDate = (dateString?: string) => {
            if (!dateString) return null
            return new Date(dateString).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          }

          return (
            <motion.div
              key={announcement.id}
              variants={itemVariants}
              exit="exit"
              layout
            >
              <Card
                className={`border-l-4 overflow-hidden transition-all duration-300 hover:shadow-lg ${priorityColors.border} ${priorityColors.bg}`}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon with animation */}
                    <motion.div
                      className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted/50"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-2xl">
                        {announcement.icon || (
                          <IconComponent className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      {isHighPriority && (
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-current"
                          style={{
                            borderColor: announcement.background_color,
                          }}
                          variants={pulseVariants}
                          initial="initial"
                          animate="animate"
                        />
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1">
                          <motion.h3
                            className="font-semibold text-base md:text-lg line-clamp-2 text-foreground"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            {announcement.title}
                          </motion.h3>
                          <motion.p
                            className="text-sm text-muted-foreground mt-1 line-clamp-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            {announcement.message}
                          </motion.p>
                        </div>

                        {/* Type & Priority Badges */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${priorityColors.badge} text-white`}>
                            {announcement.priority.toUpperCase()}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                            {getTypeLabel()}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {announcement.description && (
                        <motion.div
                          className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {announcement.description}
                          </p>
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <motion.div
                        className="mt-4 flex items-center gap-2 flex-wrap"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {announcement.action_url && (
                          <a href={announcement.action_url} target="_blank" rel="noopener noreferrer">
                            <Button
                              size="sm"
                              className="text-xs h-8 text-white"
                              style={{
                                backgroundColor: announcement.background_color,
                              }}
                              onClick={() => handleAction(announcement)}
                            >
                              {announcement.action_label || "Learn More"}
                              <ExternalLink className="w-3 h-3 ml-1.5" />
                            </Button>
                          </a>
                        )}
                      </motion.div>

                      {/* Metadata */}
                      {/* <motion.div
                        className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {announcement.views_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{announcement.views_count} views</span>
                          </div>
                        )}
                        {announcement.clicks_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            <span>{announcement.clicks_count} clicks</span>
                          </div>
                        )}
                        {announcement.scheduled_at && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Scheduled: {formatDate(announcement.scheduled_at)}</span>
                          </div>
                        )}
                        {announcement.expires_at && (
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Expires: {formatDate(announcement.expires_at)}</span>
                          </div>
                        )}
                      </motion.div> */}
                    </div>

                    {/* Close Button */}
                    <motion.button
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
                      onClick={() => handleDismiss(announcement.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Image if present */}
                  {announcement.image_url && (
                    <motion.div
                      className="mt-4 rounded-lg overflow-hidden h-40 relative"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
