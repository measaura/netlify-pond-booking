'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
// ...existing imports
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Fish, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  TrendingUp,
  QrCode,
  RefreshCw,
  Eye,
  Trophy,
  Award,
  Target
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { CheckInRecord, LeaderboardEntry } from '@/types'

function PondStatusCard({ pond, occupancy, currentUsers }: { 
  pond: any, 
  occupancy: { current: number; capacity: number; percentage: number },
  currentUsers: CheckInRecord[]
}) {
  const getStatusColor = () => {
    if (occupancy.percentage >= 90) return 'text-red-600 bg-red-50 border-red-200'
    if (occupancy.percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (occupancy.percentage >= 30) return 'text-green-600 bg-green-50 border-green-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getStatusIcon = () => {
    if (occupancy.percentage >= 90) return <AlertTriangle className="h-4 w-4" />
    if (occupancy.percentage >= 50) return <Activity className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{pond.image}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{pond.name}</h3>
              <p className="text-sm text-gray-600">{occupancy.current}/{occupancy.capacity} occupied</p>
            </div>
          </div>
          <Badge className={`${getStatusColor()} border flex items-center gap-1`}>
            {getStatusIcon()}
            {occupancy.percentage}%
          </Badge>
        </div>

        {/* Occupancy Bar */}
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                occupancy.percentage >= 90 ? 'bg-red-500' :
                occupancy.percentage >= 70 ? 'bg-yellow-500' :
                occupancy.percentage >= 30 ? 'bg-green-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${occupancy.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Current Users */}
        {currentUsers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">Active Anglers:</p>
            {currentUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                <span className="font-medium">{user.bookingId}</span>
                <span className="text-gray-600">
                  Seats: {user.seats.map(s => s.number).join(', ')}
                </span>
                <span className="text-gray-500">
                  {new Date(user.checkInTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
            {currentUsers.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{currentUsers.length - 3} more anglers
              </p>
            )}
          </div>
        )}

        {currentUsers.length === 0 && (
          <div className="text-center py-2 text-gray-500">
            <Users className="h-6 w-6 mx-auto mb-1 text-gray-300" />
            <p className="text-xs">No active anglers</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ManagerDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [ponds, setPonds] = useState<any[]>([])
  const [currentCheckIns, setCurrentCheckIns] = useState<CheckInRecord[]>([])
  const [todayStats, setTodayStats] = useState<any>({ currentlyCheckedIn: 0, totalToday: 0, totalCheckOuts: 0, noShows: 0 })
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [totalBookings, setTotalBookings] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [totalCatches, setTotalCatches] = useState(0)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const refreshData = async () => {
    try {
      const pondsRes = await fetch('/api/ponds')
      const pondsJson = await pondsRes.json()
      if (pondsJson.ok && Array.isArray(pondsJson.data)) {
        setPonds(pondsJson.data)
      }

      // Fetch current check-ins (today) and stats from check-ins or bookings endpoints
      const occupiedRes = await fetch('/api/bookings/occupied?date=' + encodeURIComponent(new Date().toISOString().split('T')[0]))
      // occupied endpoint expects pondId or eventId; as a fallback, we fetch bookings
      const bookingsRes = await fetch('/api/bookings')
      const bookingsJson = await bookingsRes.json()
      if (bookingsJson.ok && Array.isArray(bookingsJson.data)) {
        setTotalBookings(bookingsJson.data.length)
      }

      const leaderboardRes = await fetch('/api/leaderboard/overall')
      const lbJson = await leaderboardRes.json()
      if (lbJson.ok) {
        const entries = Array.isArray(lbJson.data) ? lbJson.data : (lbJson.data?.entries || [])
        setLeaderboard(entries)
      }

      const catchesRes = await fetch('/api/catches')
      const catchesJson = await catchesRes.json()
      if (catchesJson.ok && Array.isArray(catchesJson.data)) {
        setTotalCatches(catchesJson.data.length)
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error refreshing manager dashboard data', err)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const getPondUsers = (pondId: number) => {
    if (!currentCheckIns || !Array.isArray(currentCheckIns)) return []
    return currentCheckIns.filter(checkIn => checkIn.pond?.id === pondId)
  }

  // Recent activity (last 5 check-ins/check-outs)
  const recentActivity = currentCheckIns.slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fish className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-xs text-gray-500">
                  Welcome back, {user?.name?.split(' ')[0]}!
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Link href="/profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/default-avatar.png" />
                  <AvatarFallback>{user?.name?.charAt(0) || 'M'}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Overall Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No catches recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Start recording catches to see rankings!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                      backgroundColor: 
                        index === 0 ? '#fbbf24' : // Gold
                        index === 1 ? '#9ca3af' : // Silver  
                        index === 2 ? '#f59e0b' : // Bronze
                        '#e5e7eb', // Gray
                      color: 
                        index === 0 ? '#92400e' : // Gold text
                        index === 1 ? '#374151' : // Silver text
                        index === 2 ? '#92400e' : // Bronze text  
                        '#6b7280' // Gray text
                    }}>
                      {index < 3 ? (
                        index === 0 ? '🥇' :
                        index === 1 ? '🥈' : '🥉'
                      ) : (
                        entry.rank
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {entry.userName}
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Fish className="h-3 w-3" />
                          {entry.totalFish} fish
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {entry.biggestFish.toFixed(1)}kg best
                        </span>
                      </div>
                    </div>

                    {/* Total Weight */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-lg text-gray-900">
                        {entry.totalWeight.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">kg total</div>
                    </div>
                  </div>
                ))}
                
                {leaderboard.length > 5 && (
                  <div className="text-center">
                    <Link href="/manager/leaderboard">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View Full Leaderboard
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Activity className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{todayStats.currentlyCheckedIn}</div>
              <div className="text-xs text-gray-600">Active Now</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{todayStats.totalToday}</div>
              <div className="text-xs text-gray-600">Today Total</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <Trophy className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{totalCatches}</div>
              <div className="text-xs text-gray-600">Total Catches</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-6 w-6 mx-auto text-purple-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{totalBookings}</div>
              <div className="text-xs text-gray-600">All Bookings</div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Pond Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Live Pond Status</h3>
            <div className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
          
      {ponds.map((pond) => {
        // Compute a simple occupancy estimate: current checked-in users for this pond
        const currentUsers = getPondUsers(pond.id) || []
        const capacity = pond.capacity ?? pond.maxCapacity ?? 0
        const occupancy = {
          current: currentUsers.length,
          capacity: capacity,
          percentage: capacity > 0 ? Math.min(100, Math.round((currentUsers.length / capacity) * 100)) : 0
        }
            
            return (
              <PondStatusCard 
                key={pond.id} 
                pond={pond} 
                occupancy={occupancy} 
                currentUsers={currentUsers} 
              />
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dedicated-scanner">
                <Button className="w-full h-12 flex flex-col items-center gap-1">
                  <QrCode className="h-5 w-5" />
                  <span className="text-xs">Scanner</span>
                </Button>
              </Link>
              <Link href="/manager/monitor">
                <Button variant="outline" className="w-full h-12 flex flex-col items-center gap-1">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Monitor</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No activity today yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'checked-in' ? 'bg-green-500' :
                        activity.status === 'checked-out' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium">{activity.bookingId}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.pond.name} • Seats: {activity.seats.map(s => s.number).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        activity.status === 'checked-in' ? 'default' :
                        activity.status === 'checked-out' ? 'secondary' :
                        'destructive'
                      } className="text-xs mb-1">
                        {activity.status === 'checked-in' ? 'In' :
                         activity.status === 'checked-out' ? 'Out' :
                         'No-Show'}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.checkInTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manager Bottom Navigation */}
      <ManagerNavigation />
    </div>
  )
}

export default function ManagerDashboardPage() {
  return (
    <AuthGuard requiredRole="manager">
      <ManagerDashboard />
    </AuthGuard>
  )
}
