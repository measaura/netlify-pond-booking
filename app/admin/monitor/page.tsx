'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, Users, MapPin, Clock, Activity, AlertTriangle, CheckCircle, Eye } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { useAuth } from "@/lib/auth"
import { useRouter } from 'next/navigation'
import { 
  getPonds,
  getAllCurrentCheckIns,
  getTodayCheckIns,
  getCheckInStats,
  getPondCurrentOccupancy
} from "@/lib/localStorage"
import type {
  CheckInRecord
} from '@/types'

export default function MonitorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentCheckIns, setCurrentCheckIns] = useState<CheckInRecord[]>([])
  const [todayStats, setTodayStats] = useState(getCheckInStats())
  const [ponds, setPonds] = useState(getPonds())
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const refreshData = () => {
    setCurrentCheckIns(getAllCurrentCheckIns())
    setTodayStats(getCheckInStats())
    setPonds(getPonds())
    setLastUpdated(new Date())
  }

  useEffect(() => {
    refreshData()
  }, [])

  const getPondStatusColor = (occupancy: { current: number; capacity: number; percentage: number }) => {
    if (occupancy.percentage >= 90) return 'bg-red-100 text-red-800 border-red-200'
    if (occupancy.percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (occupancy.percentage >= 30) return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const getPondUsers = (pondId: number) => {
    return currentCheckIns.filter(checkIn => checkIn.pond.id === pondId)
  }

  return (
    <AuthGuard requiredRole="manager">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Live Monitor</h1>
                  <p className="text-xs text-gray-500">
                    Real-time pond occupancy • Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={refreshData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Link href="/scanner">
                  <Button size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Scanner
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{todayStats.currentlyCheckedIn}</div>
                <div className="text-sm text-gray-600">Currently Active</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{todayStats.totalToday}</div>
                <div className="text-sm text-gray-600">Total Today</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{todayStats.totalCheckOuts}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{todayStats.noShows}</div>
                <div className="text-sm text-gray-600">No-Shows</div>
              </CardContent>
            </Card>
          </div>

          {/* Pond Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {ponds.map((pond) => {
              const occupancy = getPondCurrentOccupancy(pond.id)
              const pondUsers = getPondUsers(pond.id)
              
              return (
                <Card key={pond.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{pond.image}</div>
                        <div>
                          <CardTitle className="text-lg">{pond.name}</CardTitle>
                          <div className="text-sm text-gray-600">
                            Capacity: {pond.capacity} seats
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getPondStatusColor(occupancy)} border`}>
                        {occupancy.percentage}% Full
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Occupancy Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Occupancy</span>
                        <span>{occupancy.current} / {occupancy.capacity}</span>
                      </div>
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
                    {pondUsers.length > 0 ? (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Current Anglers ({pondUsers.length})
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {pondUsers.map((checkIn) => (
                            <div key={checkIn.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                              <div>
                                <span className="font-medium">{checkIn.bookingId}</span>
                                <span className="text-gray-600 ml-2">
                                  Seats: {checkIn.seats.map(s => s.number).join(', ')}
                                </span>
                              </div>
                              <div className="text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(checkIn.checkInTime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                        <div className="text-sm">No active anglers</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recent Activity Stream */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentCheckIns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active sessions</p>
                  <p className="text-sm">Check-ins will appear here in real-time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCheckIns
                    .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
                    .slice(0, 10)
                    .map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-medium">{checkIn.bookingId}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {checkIn.pond.name} • Seats: {checkIn.seats.map(s => s.number).join(', ')}
                          </div>
                          {checkIn.type === 'event' && checkIn.event && (
                            <div className="text-xs text-purple-600 font-medium">
                              🏆 {checkIn.event.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="bg-green-100 text-green-800 mb-1">
                          Active
                        </Badge>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(checkIn.checkInTime).toLocaleTimeString([], { 
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
      </div>
    </AuthGuard>
  )
}
