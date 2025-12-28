# UI Components Implementation Guide

This guide shows how to build the UI components that consume the API routes already created.

---

## 1. Explore Page Component

**File**: `/app/explore/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

interface User {
  id: string
  display_name: string
  email: string
  profile_picture: string
  followers_count: number
  isFollowing: boolean
}

export default function ExplorePage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [gender, setGender] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [search, country, gender, page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(country && { country }),
        ...(gender && { gender }),
      })

      const response = await fetch(`/api/users/all?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Update local state
        setUsers(
          users.map((user) =>
            user.id === userId
              ? { ...user, isFollowing: !user.isFollowing }
              : user
          )
        )
      }
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Explore Users</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select value={country} onValueChange={(v) => {
          setCountry(v)
          setPage(1)
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Countries</SelectItem>
            <SelectItem value="USA">USA</SelectItem>
            <SelectItem value="UK">UK</SelectItem>
            <SelectItem value="Canada">Canada</SelectItem>
            {/* Add more countries */}
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={(v) => {
          setGender(v)
          setPage(1)
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Genders</SelectItem>
            <SelectItem value="m">Male</SelectItem>
            <SelectItem value="f">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            {/* Profile Picture */}
            <div className="relative h-64 bg-gray-200">
              {user.profile_picture && (
                <Image
                  src={user.profile_picture}
                  alt={user.display_name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* User Info */}
            <div className="p-4">
              <h3 className="text-xl font-bold">{user.display_name}</h3>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                👥 {user.followers_count} followers
              </p>

              {/* Follow Button */}
              <Button
                className="w-full mt-4"
                variant={user.isFollowing ? 'outline' : 'default'}
                onClick={() => handleFollow(user.id)}
              >
                {user.isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <span className="text-gray-600">
          Page {page} of {Math.ceil(total / 12)}
        </span>
        <Button
          disabled={page >= Math.ceil(total / 12)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>

      {loading && <p className="text-center text-gray-500 mt-4">Loading...</p>}
    </div>
  )
}
```

---

## 2. Messaging Component

**File**: `/app/dashboard/messages/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

interface Conversation {
  matchId: string
  otherUser: {
    id: string
    display_name: string
    profile_picture: string
  }
  status: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messaging/conversations')
      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return

    setLoading(true)
    try {
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedConversation,
          content: messageInput,
        }),
      })

      if (response.ok) {
        setMessageInput('')
        // Refresh conversations and messages
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full gap-4">
      {/* Conversations List */}
      <div className="w-1/3 border-r">
        <h2 className="text-xl font-bold p-4">Messages</h2>
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.matchId}
              className={`p-3 cursor-pointer hover:bg-gray-100 rounded-lg ${
                selectedConversation === conv.matchId ? 'bg-blue-100' : ''
              }`}
              onClick={() => setSelectedConversation(conv.matchId)}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  {conv.otherUser.profile_picture && (
                    <Image
                      src={conv.otherUser.profile_picture}
                      alt={conv.otherUser.display_name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{conv.otherUser.display_name}</h3>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="w-2/3 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.senderId === selectedConversation ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderId === selectedConversation
                        ? 'bg-gray-200 text-black'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t p-4 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} disabled={loading}>
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 3. Events Browse Component

**File**: `/app/events/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  ticket_price: number
  current_attendees: number
  max_tickets: number
  image_url: string
  isRegistered: boolean
  users: {
    display_name: string
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchEvents()
  }, [category, page])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        upcoming: 'true',
        ...(category && { category }),
      })

      const response = await fetch(`/api/events/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setEvents(data.events)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>

      {/* Category Filter */}
      <div className="mb-8">
        <Input
          placeholder="Search events..."
          className="w-full max-w-md"
        />
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.id}`}>
            <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              {/* Event Image */}
              <div className="relative h-48 bg-gray-200">
                {event.image_url && (
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {/* Event Info */}
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{event.description.substring(0, 100)}...</p>

                {/* Date and Price */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">
                    📅 {new Date(event.event_date).toLocaleDateString()}
                  </span>
                  <span className="font-bold">
                    {event.ticket_price > 0 ? `$${event.ticket_price}` : 'Free'}
                  </span>
                </div>

                {/* Attendees */}
                <p className="text-sm text-gray-500 mb-4">
                  {event.current_attendees} / {event.max_tickets} attending
                </p>

                {/* Register Button */}
                <Button className="w-full" disabled={event.isRegistered}>
                  {event.isRegistered ? 'Registered' : 'Register Now'}
                </Button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <span>Page {page} of {Math.ceil(total / 12)}</span>
        <Button disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
```

---

## 4. Marketplace Browse Component

**File**: `/app/marketplace/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: string
  image_urls: string[]
  seller: {
    display_name: string
  }
  isSaved: boolean
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchProducts()
  }, [search, category, minPrice, maxPrice, page])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(category && { category }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      })

      const response = await fetch(`/api/marketplace?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.products)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Input
          placeholder="Min Price"
          type="number"
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value)
            setPage(1)
          }}
        />
        <Input
          placeholder="Max Price"
          type="number"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value)
            setPage(1)
          }}
        />
        <Select value={category} onValueChange={(v) => {
          setCategory(v)
          setPage(1)
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="fashion">Fashion</SelectItem>
            <SelectItem value="books">Books</SelectItem>
            {/* Add more categories */}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link key={product.id} href={`/marketplace/${product.id}`}>
            <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-200">
                {product.image_urls?.[0] && (
                  <Image
                    src={product.image_urls[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">{product.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{product.description.substring(0, 80)}...</p>

                {/* Price and Condition */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-green-600">${product.price}</span>
                  <span className="text-sm bg-gray-200 px-3 py-1 rounded">
                    {product.condition}
                  </span>
                </div>

                {/* Seller */}
                <p className="text-sm text-gray-500 mb-4">By {product.seller.display_name}</p>

                {/* Save/View Button */}
                <Button className="w-full">View Details</Button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <span>Page {page} of {Math.ceil(total / 12)}</span>
        <Button disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
```

---

## 5. Event Detail & Registration Component

**File**: `/app/events/[eventId]/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface EventDetail {
  id: string
  title: string
  description: string
  event_date: string
  event_time: string
  location: string
  ticket_price: number
  current_attendees: number
  max_tickets: number
  image_url: string
  isRegistered: boolean
  attendees: Array<{
    display_name: string
    profile_picture: string
  }>
  users: {
    display_name: string
  }
}

export default function EventDetailPage({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    fetchEventDetails()
  }, [params.eventId])

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${params.eventId}`)
      const data = await response.json()
      if (data.success) {
        setEvent(data.event)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setRegistering(true)
    try {
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: params.eventId }),
      })

      if (response.ok) {
        // Refresh event details
        fetchEventDetails()
      }
    } catch (error) {
      console.error('Error registering:', error)
    } finally {
      setRegistering(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!event) return <div>Event not found</div>

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Event Header Image */}
      <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
        {event.image_url && (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

          {/* Meta Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
            <p>📅 {new Date(event.event_date).toLocaleDateString()} at {event.event_time}</p>
            <p>📍 {event.location}</p>
            <p>👤 Organized by {event.users.display_name}</p>
          </div>

          {/* Description */}
          <h2 className="text-2xl font-bold mb-4">About this event</h2>
          <p className="text-gray-700 mb-8">{event.description}</p>

          {/* Attendees */}
          <h2 className="text-2xl font-bold mb-4">Attendees ({event.current_attendees})</h2>
          <div className="flex gap-4 flex-wrap">
            {event.attendees.map((attendee, idx) => (
              <div key={idx} className="text-center">
                {attendee.profile_picture && (
                  <div className="relative h-16 w-16 rounded-full overflow-hidden mb-2">
                    <Image
                      src={attendee.profile_picture}
                      alt={attendee.display_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-sm">{attendee.display_name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-4">
            <div className="mb-6">
              <p className="text-gray-600 mb-2">Price</p>
              <p className="text-4xl font-bold">
                {event.ticket_price > 0 ? `$${event.ticket_price}` : 'FREE'}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">Available Spots</p>
              <p className="text-2xl font-bold">
                {event.max_tickets - event.current_attendees} / {event.max_tickets}
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleRegister}
              disabled={
                event.isRegistered ||
                event.current_attendees >= event.max_tickets ||
                registering
              }
            >
              {event.isRegistered ? 'Registered ✓' : 'Register Now'}
            </Button>

            {event.current_attendees >= event.max_tickets && (
              <p className="text-center text-red-500 mt-4">Event is full</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 6. Product Detail & Purchase Component

**File**: `/app/marketplace/[productId]/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

interface ProductDetail {
  id: string
  title: string
  description: string
  price: number
  condition: string
  image_urls: string[]
  delivery_instructions: string
  seller: {
    display_name: string
    followers_count: number
  }
  sellerOtherProducts: Array<{
    id: string
    title: string
    price: number
    image_urls: string[]
  }>
  isSaved: boolean
}

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetchProductDetails()
  }, [params.productId])

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/marketplace/${params.productId}`)
      const data = await response.json()
      if (data.success) {
        setProduct(data.product)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    setPurchasing(true)
    try {
      const response = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: params.productId,
          paymentMethod: 'stripe',
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Redirect to payment processor or show confirmation
        alert('Payment initiated. Check your email for transaction details.')
      }
    } catch (error) {
      console.error('Error purchasing:', error)
    } finally {
      setPurchasing(false)
    }
  }

  const handleSave = async () => {
    try {
      await fetch('/api/posts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: params.productId }),
      })
      // Refetch to update save status
      fetchProductDetails()
    } catch (error) {
      console.error('Error saving:', error)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!product) return <div>Product not found</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden mb-4">
            {product.image_urls?.[currentImageIdx] && (
              <Image
                src={product.image_urls[currentImageIdx]}
                alt={product.title}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {product.image_urls?.map((url, idx) => (
              <button
                key={idx}
                className={`h-20 w-20 rounded border-2 overflow-hidden flex-shrink-0 ${
                  currentImageIdx === idx ? 'border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setCurrentImageIdx(idx)}
              >
                <Image
                  src={url}
                  alt={`View ${idx}`}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.title}</h1>

          <p className="text-gray-600 mb-6">{product.description}</p>

          {/* Price and Condition */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-600 mb-2">Price</p>
            <p className="text-4xl font-bold text-green-600 mb-4">${product.price}</p>
            <p className="text-gray-600 mb-2">Condition</p>
            <p className="text-lg">{product.condition}</p>
          </div>

          {/* Seller Info */}
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold mb-2">{product.seller.display_name}</h3>
            <p className="text-gray-600">{product.seller.followers_count} followers</p>
          </div>

          {/* Delivery Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-bold mb-2">Delivery Information</h3>
            <p className="text-gray-600">{product.delivery_instructions}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button className="flex-1" size="lg" onClick={handlePurchase} disabled={purchasing}>
              {purchasing ? 'Processing...' : 'Buy Now'}
            </Button>
            <Button
              className="flex-1"
              variant={product.isSaved ? 'default' : 'outline'}
              size="lg"
              onClick={handleSave}
            >
              {product.isSaved ? '❤️ Saved' : '🤍 Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Other Products from Seller */}
      {product.sellerOtherProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More from this seller</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {product.sellerOtherProducts.map((p) => (
              <Link key={p.id} href={`/marketplace/${p.id}`}>
                <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-200">
                    {p.image_urls?.[0] && (
                      <Image
                        src={p.image_urls[0]}
                        alt={p.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2">{p.title}</h3>
                    <p className="text-lg font-bold text-green-600">${p.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Implementation Checklist

- [ ] Create Explore page with user discovery
- [ ] Create Messages page with conversations
- [ ] Create Events listing page
- [ ] Create Event details page
- [ ] Create Marketplace listing page
- [ ] Create Product details page
- [ ] Test all components with API routes
- [ ] Add loading states and error handling
- [ ] Add image optimization
- [ ] Mobile responsiveness testing

---

## Next Steps

1. Implement these components using the code examples above
2. Test each component with the corresponding API route
3. Add error handling and loading states
4. Style components to match your design system
5. Add pagination and infinite scroll as needed
6. Integrate payment processor for purchases and event registration

These components are designed to work seamlessly with the API routes already created.
