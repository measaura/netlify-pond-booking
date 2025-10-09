'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Fish, ArrowLeft, Trophy, Award, Target, TrendingUp, 
  Calendar, Users, Star, Medal
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { 
  generateEventLeaderboard, 
  getEvents, 
  getUserParticipatedEvents,
} from '@/lib/localStorage'
import type { Event, EventLeaderboard, LeaderboardEntry } from '@/types'

function CurrentEventLeaderboard() {
  const { user } = useAuth()
  const [currentEventLeaderboard, setCurrentEventLeaderboard] = useState<EventLeaderboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    
    try {
      // Get the most recent event that the user participated in
      const participatedEvents = getUserParticipatedEvents(user.id)
      
      if (participatedEvents.length > 0) {
        const mostRecentEvent = participatedEvents[0] // Already sorted by date desc
        const leaderboard = generateEventLeaderboard(mostRecentEvent.id)
        setCurrentEventLeaderboard(leaderboard)
      }
    } catch (error) {
      console.error('Error loading current event leaderboard:', error)
    }
    setLoading(false)
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <div className="animate-pulse">Loading current event leaderboard...</div>
        </CardContent>
      </Card>
    )
  }

  if (!currentEventLeaderboard) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Fish className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Current Event</h3>
          <p className="text-gray-500 text-sm mb-4">
            Join a fishing event to see your current competition rankings!
          </p>
          <Button asChild>
            <Link href="/book">Join an Event</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Event Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{currentEventLeaderboard.eventName}</h3>
          </div>
          <p className="text-sm text-gray-600">
            Current Competition Rankings
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {new Date(currentEventLeaderboard.lastUpdated).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <div className="space-y-3">
        {currentEventLeaderboard.entries.map((entry, index) => {
          const isCurrentUser = entry.userId === user?.id
          return (
            <Card key={entry.userId} className={`${isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {index < 3 ? (
                      index === 0 ? <Trophy className="h-5 w-5" /> :
                      index === 1 ? <Medal className="h-5 w-5" /> :
                      <Award className="h-5 w-5" />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {entry.userName}
                        {isCurrentUser && <span className="text-blue-600">(You)</span>}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <div className="text-gray-500">Weight</div>
                        <div className="font-medium">{entry.totalWeight.toFixed(1)}kg</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Fish</div>
                        <div className="font-medium">{entry.totalFish}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Points</div>
                        <div className="font-medium text-blue-600">{entry.points}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-gray-500">
                      <div>Biggest: {entry.biggestFish.toFixed(1)}kg</div>
                      <div>Avg: {entry.averageWeight.toFixed(1)}kg</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function PastEventLeaderboards() {
  const { user } = useAuth()
  const [participatedEvents, setParticipatedEvents] = useState<Event[]>([])
  const [eventLeaderboards, setEventLeaderboards] = useState<{ [eventId: number]: EventLeaderboard }>({})
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    
    try {
      const userEvents = getUserParticipatedEvents(user.id)
      // Remove the most recent event (current) to show only past events
      const pastEvents = userEvents.slice(1)
      setParticipatedEvents(pastEvents)
      
      // Generate leaderboards for past events
      const leaderboards: { [eventId: number]: EventLeaderboard } = {}
      pastEvents.forEach(event => {
        try {
          const eventLeaderboard = generateEventLeaderboard(event.id)
          leaderboards[event.id] = eventLeaderboard
        } catch (error) {
          console.error(`Error generating leaderboard for event ${event.id}:`, error)
        }
      })
      
      setEventLeaderboards(leaderboards)
      
      // Set default selected event to the first past event
      if (pastEvents.length > 0) {
        setSelectedEventId(pastEvents[0].id)
      }
    } catch (error) {
      console.error('Error loading past event leaderboards:', error)
    }
    setLoading(false)
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <div className="animate-pulse">Loading past event leaderboards...</div>
        </CardContent>
      </Card>
    )
  }
  
  if (participatedEvents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Past Events</h3>
          <p className="text-gray-500 text-sm mb-4">
            Your past competition results will appear here!
          </p>
        </CardContent>
      </Card>
    )
  }

  const currentLeaderboard = selectedEventId ? eventLeaderboards[selectedEventId] : null

  return (
    <div className="space-y-4">
      {/* Event Selector */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Past Competitions</h3>
        </div>
        <CardContent className="p-4">
          <div className="grid gap-2">
            {participatedEvents.map(event => {
              const leaderboard = eventLeaderboards[event.id]
              if (!leaderboard) return null

              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedEventId === event.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{event.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()} • 
                    {leaderboard.entries.length} participant{leaderboard.entries.length === 1 ? '' : 's'}
                  </div>
                  {/* Show user's rank in this event */}
                  {(() => {
                    const userEntry = leaderboard.entries.find(entry => entry.userId === user?.id)
                    if (userEntry) {
                      return (
                        <div className="text-xs text-blue-600 font-medium">
                          Your rank: #{userEntry.rank} • {userEntry.totalWeight.toFixed(1)}kg
                        </div>
                      )
                    }
                    return null
                  })()}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Event Leaderboard */}
      {currentLeaderboard && (
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {currentLeaderboard.eventName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Final Results
            </p>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              {currentLeaderboard.entries.map((entry, index) => {
                const isCurrentUser = entry.userId === user?.id
                return (
                  <div key={entry.userId} className={`flex items-center gap-3 ${isCurrentUser ? 'bg-blue-50 rounded-lg p-2' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {entry.rank}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {entry.userName}
                        {isCurrentUser && <span className="text-blue-600 text-sm"> (You)</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.totalWeight.toFixed(1)}kg • {entry.totalFish} fish • 
                        Biggest: {entry.biggestFish.toFixed(1)}kg
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-blue-600">{entry.points}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuth()

  return (
    <AuthGuard requiredRole="user">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Current
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Past Events
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <TabsContent value="current" className="mt-0">
                <CurrentEventLeaderboard />
              </TabsContent>
              
              <TabsContent value="past" className="mt-0">
                <PastEventLeaderboards />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <BottomNavigation />
      </div>
    </AuthGuard>
  )
}
