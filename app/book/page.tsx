'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Fish, Trophy, Users, Calendar, Clock, MapPin, Star } from 'lucide-react'
import Link from 'next/link'
import { formatEventTimeRange} from '@/lib/localStorage'
import { Pond, Event } from '@/types'

function PondsTab() {
  const [ponds, setPonds] = useState<Pond[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadPonds() {
      try {
        const res = await fetch('/api/ponds')
        const json = await res.json()
        if (json.ok && mounted) setPonds(json.data)
      } catch (err) {
        console.error('Error loading ponds from API:', err)
        if (mounted) setPonds([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPonds()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <h2 className="text-lg font-bold text-gray-900">Choose Your Pond</h2>
        <p className="text-sm text-gray-600">Select a pond for your fishing session</p>
      </div>

      <div className="space-y-3">
        {ponds.map((pond) => {
          // Calculate availability status
          const avail = pond.available ?? 0
          const availabilityStatus = pond.bookingEnabled 
            ? (avail > 10 ? 'available' : avail > 0 ? 'limited' : 'full')
            : 'disabled'

          // Generate features based on pond properties
          const features = ['Equipment Rental', 'Parking']
          if (pond.price >= 50) features.push('Premium Location')
          if (pond.capacity >= 20) features.push('Large Capacity')
          if (pond.shape === 'circle') features.push('Scenic Views')

          // Generate rating (mock - in real app this would come from reviews)
          const rating = (4.5 + (pond.id * 0.1)).toFixed(1)

          return (
            <Card key={pond.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Pond Header */}
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{pond.image}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{pond.name}</h3>
                      <p className="text-blue-100 text-sm">
                        {pond.shape === 'circle' ? 'Circular pond with scenic views' :
                         pond.shape === 'square' ? 'Square pond perfect for groups' :
                         'Spacious pond with excellent fishing spots'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">${pond.price}</div>
                      <div className="text-xs text-blue-100">per session</div>
                    </div>
                  </div>
                </div>

                {/* Pond Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Capacity: {pond.capacity} anglers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{rating}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* Availability and Action */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      {availabilityStatus === 'available' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Available</span>
                        </div>
                      )}
                      {availabilityStatus === 'limited' && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium">Limited Spots</span>
                        </div>
                      )}
                      {availabilityStatus === 'full' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium">Fully Booked</span>
                        </div>
                      )}
                      {availabilityStatus === 'disabled' && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          <span className="text-sm font-medium">Temporarily Closed</span>
                        </div>
                      )}
                    </div>

                    {pond.bookingEnabled && (pond.available ?? 0) > 0 ? (
                      <Link href={`/booking/${pond.id}`}>
                        <Button className="bg-gradient-to-r from-blue-600 to-green-600">
                          Book Now
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-green-600"
                        disabled
                      >
                        {!pond.bookingEnabled ? 'Closed' : 'Full'}
                      </Button>
                    )}
                  </div>

                  {!pond.bookingEnabled && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                      Booking temporarily disabled for maintenance
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {ponds.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎣</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ponds Available</h3>
            <p className="text-gray-600">Check back soon for available fishing spots!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EventsTab() {
  const [events, setEvents] = useState<(Event & { participants: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      let mounted = true
      ;(async function loadEvents() {
        try {
          const res = await fetch('/api/events')
          const json = await res.json()
          if (json.ok && mounted) setEvents(json.data)
        } catch (err) {
          console.error('Error loading events from API:', err)
          if (mounted) setEvents([])
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    } finally {
      // handled in async loader
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <h2 className="text-lg font-bold text-gray-900">Join Competitions</h2>
        <p className="text-sm text-gray-600">Compete with other anglers</p>
      </div>

      <div className="space-y-3">
        {events.map((event) => {
          // Compute event status locally using server-provided fields
          const computeEventStatus = (ev: any): 'open' | 'upcoming' | 'full' | 'closed' => {
            try {
              const now = new Date()
              const bookingOpenDate = ev.bookingOpens ? new Date(ev.bookingOpens) : new Date(0)
              const eventDate = ev.date ? new Date(ev.date) : new Date(0)

              // If server supplied a participants count, use it for 'full' calculation
              const participants = typeof ev.participants === 'number' ? ev.participants : null

              if (now > eventDate) return 'closed'
              if (participants !== null && participants >= (ev.maxParticipants ?? Infinity)) return 'full'
              if (now < bookingOpenDate) return 'upcoming'
              // Respect server-side status if provided
              if (ev.status === 'closed') return 'closed'
              return 'open'
            } catch (err) {
              console.error('Error computing event status', err)
              return 'closed'
            }
          }

          const eventStatus = computeEventStatus(event)
          
          // Determine difficulty based on entry fee
          const difficulty = event.entryFee >= 100 ? 'Advanced' : 
                           event.entryFee >= 60 ? 'Intermediate' : 'Beginner'

          return (
            <Card key={event.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Event Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-6 w-6" />
                      <div>
                        <h3 className="font-bold text-lg">{event.name}</h3>
                        <div className="flex items-center gap-1 text-purple-100 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>{event.assignedPonds.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${
                        eventStatus === 'open' ? 'bg-green-100 text-green-800' :
                        eventStatus === 'full' ? 'bg-red-100 text-red-800' :
                        eventStatus === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {eventStatus === 'open' ? 'Open' :
                       eventStatus === 'full' ? 'Full' :
                       eventStatus === 'upcoming' ? 'Soon' :
                       'Closed'}
                    </Badge>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Date</span>
                      </div>
                      <p className="font-medium">{new Date(event.date).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>Time</span>
                      </div>
                      <p className="font-medium">
                        {event.startTime && event.endTime ? 
                          formatEventTimeRange(event.startTime, event.endTime) : 
                          'Time TBD'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Entry Fee</p>
                      <p className="font-medium text-green-600">${event.entryFee}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prize Pool</p>
                      <p className="font-medium text-yellow-600">{event.games.map(game => game.prizes.map(prize => prize.value).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0)}</p>
                    </div>
                  </div>

                  {/* Participants Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Participants</span>
                      <span className="font-medium">{event.participants}/{event.maxParticipants}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (event.participants / event.maxParticipants) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Difficulty and Action */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge 
                      variant="outline" 
                      className={
                        difficulty === 'Beginner' ? 'border-green-200 text-green-700' :
                        difficulty === 'Intermediate' ? 'border-yellow-200 text-yellow-700' :
                        'border-red-200 text-red-700'
                      }
                    >
                      {difficulty}
                    </Badge>

                    {eventStatus === 'open' ? (
                      <Link href={`/event-booking/${event.id}`}>
                        <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                          Register
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                        disabled
                      >
                        {eventStatus === 'full' ? 'Full' :
                         eventStatus === 'upcoming' ? 'Soon' :
                         'Closed'}
                      </Button>
                    )}
                  </div>

                  {/* Additional Information */}
                  {eventStatus === 'upcoming' && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                      Registration opens on {new Date(event.bookingOpens).toLocaleDateString('en-GB')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {events.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Available</h3>
            <p className="text-gray-600">Check back soon for upcoming competitions!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function BookContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Events & Bookings</h1>
            <p className="text-sm text-gray-600">Join competitions or book pond sessions</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="ponds" className="flex items-center gap-2">
              <Fish className="h-4 w-4" />
              Ponds
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4">
            <EventsTab />
          </TabsContent>

          <TabsContent value="ponds" className="mt-4">
            <PondsTab />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default function BookPage() {
  return (
    <AuthGuard requiredRole="user">
      <BookContent />
    </AuthGuard>
  )
}
