"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Camera,
  Edit,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  Music,
  Film,
  Utensils,
  Plane,
  BookOpen,
  Plus,
  Check,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n/context"

const interests = [
  { icon: Music, label: "Music" },
  { icon: Film, label: "Movies" },
  { icon: Utensils, label: "Cooking" },
  { icon: Plane, label: "Travel" },
  { icon: BookOpen, label: "Reading" },
  { icon: Heart, label: "Fitness" },
]

const photos = [
  "/placeholder.svg?height=300&width=300",
  "/placeholder.svg?height=300&width=300",
  "/placeholder.svg?height=300&width=300",
  "/placeholder.svg?height=300&width=300",
  "/placeholder.svg?height=300&width=300",
]

export default function ProfilePage() {
  const { t } = useI18n()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState(["Music", "Travel", "Fitness"])

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) => (prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]))
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("editProfile")}</h1>
          <p className="text-muted-foreground">Update your profile information</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full bg-transparent" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button className="rounded-full gradient-bg" onClick={() => setIsEditing(false)}>
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        ) : (
          <Button className="rounded-full gradient-bg" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            {t("editProfile")}
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Photos */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <Image src={photo || "/placeholder.svg"} alt={`Photo ${i + 1}`} fill className="object-cover" />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" className="rounded-full w-8 h-8">
                        <Camera className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="rounded-full w-8 h-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {isEditing && (
                <div className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Display Name</Label>
                <Input defaultValue="Alex Johnson" disabled={!isEditing} className="mt-1.5" />
              </div>
              <div>
                <Label>Username</Label>
                <Input defaultValue="alex_vibes" disabled={!isEditing} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                defaultValue="Adventure seeker, music lover, and coffee addict. Looking for someone to explore the world with."
                disabled={!isEditing}
                className="mt-1.5 min-h-24"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue="New York, USA" disabled={!isEditing} className="pl-10" />
                </div>
              </div>
              <div>
                <Label>Birthday</Label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="date" defaultValue="1995-06-15" disabled={!isEditing} className="pl-10" />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Occupation</Label>
                <div className="relative mt-1.5">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue="Software Engineer" disabled={!isEditing} className="pl-10" />
                </div>
              </div>
              <div>
                <Label>Education</Label>
                <div className="relative mt-1.5">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue="Stanford University" disabled={!isEditing} className="pl-10" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {interests.map((interest) => {
                const Icon = interest.icon
                const isSelected = selectedInterests.includes(interest.label)
                return (
                  <Badge
                    key={interest.label}
                    variant={isSelected ? "default" : "outline"}
                    className={`px-4 py-2 text-sm cursor-pointer transition-all ${
                      isSelected ? "gradient-bg" : "hover:border-primary"
                    } ${!isEditing && "pointer-events-none"}`}
                    onClick={() => isEditing && toggleInterest(interest.label)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {interest.label}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
