"use client"

import { useState, useEffect } from "react"

// Mix of videos and images for carousel
const mediaItems = [
  { type: "video", src: "/videos/video1.mp4" },
  { type: "image", src: "/romantic-couple-sunset-beach.jpg?height=800&width=600" },
  { type: "video", src: "/videos/video2.mp4" },
  { type: "image", src: "/romantic-couple-sunset.png?height=800&width=600" },
  { type: "video", src: "/videos/video3.mp4" },
  { type: "image", src: "/smiling-woman-portrait.png?height=800&width=600" },
  { type: "video", src: "/videos/video4.mp4" },
  // { type: "image", src: "/placeholder.svg?height=800&width=600" },
  { type: "video", src: "/videos/video5.mp4" },
  // { type: "image", src: "/placeholder.svg?height=800&width=600" },
  { type: "video", src: "/videos/video6.mp4" },
  // { type: "image", src: "/placeholder.svg?height=800&width=600" },
]

export function VideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
        setIsTransitioning(false)
      }, 500)
    }, 8000) // Each media item shows for 6 seconds

    return () => clearInterval(interval)
  }, [])

  const currentMedia = mediaItems[currentIndex]

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Video/Image Container */}
      <div className="absolute inset-0">
        {currentMedia.type === "video" ? (
          <video
            key={`video-${currentIndex}`}
            autoPlay
            muted
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <source src={currentMedia.src} type="video/mp4" />
          </video>
        ) : (
          <img
            key={`image-${currentIndex}`}
            src={currentMedia.src}
            alt="Carousel"
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/20" />

      {/* Animated Blobs for extra depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob blob-top-right" />
        <div className="absolute w-96 h-96 bg-secondary/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob blob-middle-left animation-delay-2000" />
        <div className="absolute w-96 h-96 bg-accent/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob blob-middle-right animation-delay-4000" />
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {mediaItems.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-8 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
