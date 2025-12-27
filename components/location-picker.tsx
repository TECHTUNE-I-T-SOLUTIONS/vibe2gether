"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Location {
  name: string
  latitude: number
  longitude: number
}

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void
  currentLocation?: Location | null
}

export function LocationPicker({ onLocationSelect, currentLocation }: LocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search for locations using OpenStreetMap Nominatim
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      )

      if (!response.ok) throw new Error("Failed to search locations")

      const data = await response.json()
      const results = data.map((item: any) => ({
        name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }))

      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search locations")
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // Get user's current location
  const getCurrentLocation = async () => {
    setGeoLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setGeoLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Reverse geocode to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          )

          if (!response.ok) throw new Error("Failed to get location name")

          const data = await response.json()
          const location: Location = {
            name: data.address?.city || data.address?.town || data.display_name || "Current Location",
            latitude,
            longitude,
          }

          onLocationSelect(location)
          setOpen(false)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to get location name")
        } finally {
          setGeoLoading(false)
        }
      },
      (error) => {
        setError(error.message || "Failed to get your location")
        setGeoLoading(false)
      }
    )
  }

  const handleSelectLocation = (location: Location) => {
    onLocationSelect(location)
    setOpen(false)
    setSearchQuery("")
    setSearchResults([])
  }

  return (
    <>
      <div>
        <Label htmlFor="location" className="text-base font-semibold">
          Location
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="location"
            readOnly
            value={currentLocation?.name || ""}
            placeholder="Select or search location"
            onClick={() => setOpen(true)}
            className="cursor-pointer"
          />
          <Button onClick={() => setOpen(true)} variant="outline" size="icon" title="Open location picker">
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Select Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Current Location Button */}
            <Button
              onClick={getCurrentLocation}
              disabled={geoLoading}
              className="w-full text-black dark:text-white hover:text-gray-700"
              variant="outline"
            >
              {geoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting your location...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Use My Current Location
                </>
              )}
            </Button>

            {/* Search Input */}
            <div>
              <Label htmlFor="search" className="text-sm">
                Search Location
              </Label>
              <Input
                id="search"
                placeholder="City, address, or place name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchLocations(e.target.value)
                }}
                className="mt-2"
              />
            </div>

            {/* Search Results */}
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((location, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectLocation(location)}
                    className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm break-words whitespace-normal">{location.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No locations found for "{searchQuery}"
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
