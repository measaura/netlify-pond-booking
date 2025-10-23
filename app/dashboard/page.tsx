'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Fish, Users, Calendar, MapPin, Clock, Star, Target, Trophy, Award, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { LeaderboardEntry, EventLeaderboard } from '@/types'

function LeaderboardCard() {
  const { user } = useAuth()
  const [dbUserId, setDbUserId] = useState<number | null>(null)
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null)
  const [currentEventLeaderboard, setCurrentEventLeaderboard] = useState<EventLeaderboard | null>(null)
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isEventToday, setIsEventToday] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        // Get database user ID by email
        const userRes = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`)
        const userJson = await userRes.json()
        if (!userJson.ok || !userJson.data?.id) return
        
        const userId = userJson.data.id
        setDbUserId(userId)
        
        const resUser = await fetch(`/api/leaderboard/user?userId=${userId}`)
        const jsonUser = await resUser.json()
        if (jsonUser.ok) setUserStats(jsonUser.data)

        // Fetch user's participated events and pick the most recent
        try {
          const partRes = await fetch(`/api/user/participated-events?userId=${userId}`)
          const partJson = await partRes.json()
          if (partJson.ok && Array.isArray(partJson.data) && partJson.data.length > 0) {
            const currentEvent = partJson.data[0]
            
            // Check if event is today
            const eventDate = new Date(currentEvent.date)
            const today = new Date()
            const isSameDay = eventDate.getDate() === today.getDate() &&
                             eventDate.getMonth() === today.getMonth() &&
                             eventDate.getFullYear() === today.getFullYear()
            setIsEventToday(isSameDay)
            
            // Only fetch event leaderboard if event is today
            if (isSameDay) {
              const evRes = await fetch(`/api/leaderboard/event?eventId=${currentEvent.id}`)
              const evJson = await evRes.json()
              if (evJson.ok) setCurrentEventLeaderboard(evJson.data)
            }
          }
        } catch (e) {
          // noop - keep previous behavior (no leaderboard)
        }

        // Fetch overall leaderboard as fallback
        try {
          const overallRes = await fetch(`/api/leaderboard/overall`)
          const overallJson = await overallRes.json()
          if (overallJson.ok) {
            const entries = Array.isArray(overallJson.data) ? overallJson.data : (overallJson.data?.entries || [])
            setOverallLeaderboard(entries)
          }
        } catch (e) {
          console.error('Error fetching overall leaderboard:', e)
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error)
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <div className="animate-pulse">Loading leaderboard...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
      <div className="p-4 border-b border-yellow-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          {currentEventLeaderboard ? `${currentEventLeaderboard.eventName}` : 'Overall Leaderboard'}
        </h3>
      </div>
      <CardContent className="p-4">
        {/* User's Position */}
        {currentEventLeaderboard ? (
          <div className="bg-white rounded-lg p-3 mb-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Your Position in Current Event</div>
                {(() => {
                  const userEntry = currentEventLeaderboard.entries.find(entry => entry.userId === dbUserId)
                  if (userEntry) {
                    return (
                      <>
                        <div className="font-bold text-lg text-gray-900">#{userEntry.rank}</div>
                        <div className="text-xs text-gray-500">
                          {userEntry.totalWeight.toFixed(1)}kg • {userEntry.totalFish} fish
                        </div>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <div className="font-bold text-lg text-gray-900">Not yet ranked</div>
                        <div className="text-xs text-gray-500">Start catching fish to get ranked!</div>
                      </>
                    )
                  }
                })()}
              </div>
              <div className="text-right">
                {(() => {
                  const userEntry = currentEventLeaderboard.entries.find(entry => entry.userId === dbUserId)
                  if (userEntry) {
                    return (
                      <>
                        <div className="text-2xl font-bold text-yellow-600">{userEntry.points}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <div className="text-2xl font-bold text-gray-400">0</div>
                        <div className="text-xs text-gray-500">points</div>
                      </>
                    )
                  }
                })()}
              </div>
            </div>
            {userStats && userStats.competitionsWon > 0 && (
              <div className="mt-2 text-xs text-yellow-700 flex items-center gap-1">
                <Award className="h-3 w-3" />
                {userStats.competitionsWon} competition{userStats.competitionsWon === 1 ? '' : 's'} won!
              </div>
            )}
          </div>
        ) : overallLeaderboard.length > 0 ? (
          <div className="bg-white rounded-lg p-3 mb-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Your Overall Ranking</div>
                {(() => {
                  const userEntry = overallLeaderboard.find(entry => entry.userId === dbUserId)
                  if (userEntry) {
                    return (
                      <>
                        <div className="font-bold text-lg text-gray-900">#{userEntry.rank}</div>
                        <div className="text-xs text-gray-500">
                          {userEntry.totalWeight.toFixed(1)}kg • {userEntry.totalFish} fish
                        </div>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <div className="font-bold text-lg text-gray-900">Not ranked yet</div>
                        <div className="text-xs text-gray-500">Catch some fish to get ranked!</div>
                      </>
                    )
                  }
                })()}
              </div>
              <div className="text-right">
                {(() => {
                  const userEntry = overallLeaderboard.find(entry => entry.userId === dbUserId)
                  if (userEntry) {
                    return (
                      <>
                        <div className="text-2xl font-bold text-yellow-600">{userEntry.points}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <div className="text-2xl font-bold text-gray-400">0</div>
                        <div className="text-xs text-gray-500">points</div>
                      </>
                    )
                  }
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-3 mb-4 border border-yellow-200 text-center">
            <div className="text-sm text-gray-600 mb-1">Start fishing to see rankings!</div>
            <Button size="sm" className="text-xs" asChild>
              <Link href="/book">Book Your First Session</Link>
            </Button>
          </div>
        )}

        {/* Top 3 from Current Event or Overall */}
        {currentEventLeaderboard && currentEventLeaderboard.entries.length > 0 ? (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Current Event Top Performers</div>
            <div className="space-y-2">
              {currentEventLeaderboard.entries.slice(0, 3).map((entry, index) => (
                <div key={entry.userId} className="flex items-center gap-2 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    'bg-orange-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {entry.userName}
                      {entry.userId === dbUserId && <span className="text-blue-600"> (You)</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.totalWeight.toFixed(1)}kg • {entry.points} pts
                    </div>
                  </div>
                  {entry.userId === dbUserId && (
                    <Trophy className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : overallLeaderboard.length > 0 ? (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Top Anglers Overall</div>
            <div className="space-y-2">
              {overallLeaderboard.slice(0, 3).map((entry, index) => (
                <div key={entry.userId} className="flex items-center gap-2 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    'bg-orange-600 text-white'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {entry.userName}
                      {entry.userId === dbUserId && <span className="text-blue-600"> (You)</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.totalWeight.toFixed(1)}kg • {entry.totalFish} fish
                    </div>
                  </div>
                  {entry.userId === dbUserId && (
                    <Trophy className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Button size="sm" variant="outline" className="w-full mt-3 text-xs" asChild>
          <Link href="/leaderboard">View Full Leaderboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function UserStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalCatches: 0,
    totalWeight: 0,
    bestCatch: 0,
    avgCatch: 0,
    competitionsJoined: 0,
    competitionsWon: 0,
    currentRank: 0,
    totalAnglers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        // Fetch user leaderboard stats
        const userRes = await fetch(`/api/leaderboard/user?userId=${user.id}`)
        const userJson = await userRes.json()
        const userLeaderboardStats = userJson.ok ? userJson.data : null

        // Fetch user's catches via catchRecords API (we don't have a direct API yet; use a simplified route if present)
        // For now, reuse the db function via an API route future; fallback: zero values.
        let userCatches: any[] = []
        try {
          const catchesRes = await fetch(`/api/catches?userId=${user.id}`)
          const catchesJson = await catchesRes.json()
          if (catchesJson.ok) userCatches = catchesJson.data
        } catch (e) {
          userCatches = []
        }

        const totalWeight = userCatches.reduce((sum: number, c: any) => sum + (c.weight || 0), 0)
        const bestCatch = userCatches.length > 0 ? Math.max(...userCatches.map(c => c.weight || 0)) : 0
        const avgCatch = userCatches.length > 0 ? totalWeight / userCatches.length : 0

        // Determine current rank (best-effort via user's leaderboard stats)
        let currentRank = userLeaderboardStats?.rank || 0
        let totalAnglers = userLeaderboardStats ? 1 : 0

        setStats({
          totalCatches: userCatches.length,
          totalWeight: totalWeight,
          bestCatch: bestCatch,
          avgCatch: avgCatch,
          competitionsJoined: userLeaderboardStats?.competitionsParticipated || 0,
          competitionsWon: userLeaderboardStats?.competitionsWon || 0,
          currentRank: currentRank,
          totalAnglers: totalAnglers
        })
      } catch (error) {
        console.error('Error loading user stats:', error)
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <div className="animate-pulse bg-gray-200 h-6 w-6 mx-auto mb-1 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-6 w-12 mx-auto mb-1 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-3 w-16 mx-auto rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Card>
        <CardContent className="p-3 text-center">
          <Fish className="h-6 w-6 mx-auto text-blue-600 mb-1" />
          <div className="text-lg font-bold text-gray-900">{stats.totalCatches}</div>
          <div className="text-xs text-gray-600">Total Catches</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 text-center">
          <Target className="h-6 w-6 mx-auto text-purple-600 mb-1" />
          <div className="text-lg font-bold text-gray-900">
            {stats.currentRank > 0 ? `#${stats.currentRank}` : '--'}
          </div>
          <div className="text-xs text-gray-600">Current Rank</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-1" />
          <div className="text-lg font-bold text-gray-900">{stats.totalWeight.toFixed(1)}kg</div>
          <div className="text-xs text-gray-600">Total Weight</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 text-center">
          <Star className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
          <div className="text-lg font-bold text-gray-900">{stats.bestCatch.toFixed(1)}kg</div>
          <div className="text-xs text-gray-600">Best Catch</div>
        </CardContent>
      </Card>
    </div>
  )
}



function RecentBookings() {
  const bookings = [
    {
      id: 1,
      pond: 'Rainbow Lake',
      date: '2024-01-15',
      status: 'completed',
      catch: '3 fish, 12.5kg'
    },
    {
      id: 2,
      pond: 'Silver Stream',
      date: '2024-01-12',
      status: 'completed',
      catch: '1 fish, 8.2kg'
    },
    {
      id: 3,
      pond: 'Golden Pond',
      date: '2024-01-18',
      status: 'upcoming',
      catch: null
    }
  ]

  return (
    <Card>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Recent Bookings
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{booking.pond}</h4>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(booking.date).toLocaleDateString()}</span>
                </div>
                {booking.catch && (
                  <div className="text-xs text-green-600 font-medium">{booking.catch}</div>
                )}
              </div>
              <Badge
                variant={booking.status === 'completed' ? 'default' : 'secondary'}
                className={
                  booking.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }
              >
                {booking.status === 'completed' ? 'Completed' : 'Upcoming'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function UserDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fish className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">FishComp</h1>
                <p className="text-xs text-gray-500">Welcome back, {user?.name}!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/default-avatar.png" />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Leaderboard */}
        <LeaderboardCard />

        {/* Personal Stats */}
        <UserStats />

        {/* Recent Bookings */}
        <RecentBookings />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      // Redirect managers and admins to their specific dashboards
      if (user.role === 'manager' || user.role === 'admin') {
        router.replace('/manager/dashboard')
        return
      }
    }
  }, [user, router])

  // Only render user dashboard for regular users
  if (!user || user.role !== 'user') {
    return <div>Loading...</div>
  }

  return (
    <AuthGuard requiredRole="user">
      <UserDashboard />
    </AuthGuard>
  )
}
