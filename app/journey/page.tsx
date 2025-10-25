'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Target, Award, Fish } from "lucide-react"
import Link from "next/link"
import { useAuth } from '@/lib/auth'

interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  category: string
}

interface UserAchievement {
  id: number
  achievementId: number
  unlockedAt: string
  achievement: Achievement
}

interface UserStats {
  totalBookings: number
  totalCatches: number
  biggestCatch: number | null
  eventsJoined: number
  competitionsWon: number
  totalPrizeMoney: number
  currentStreak: number
  morningSlots: number
  eveningSlots: number
}

export default function JourneyPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const [ach, userAch, st] = await Promise.all([
        fetch('/api/achievements?active=true').then(r => r.json()),
        fetch(`/api/user/${user?.id}/achievements`).then(r => r.json()),
        fetch(`/api/user/${user?.id}/stats`).then(r => r.json())
      ])
      setAchievements(ach)
      setUserAchievements(userAch)
      setStats(st)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const earned = userAchievements.map(ua => ua.achievement)
  const earnedIds = new Set(userAchievements.map(ua => ua.achievementId))

  if (loading) {
    return (
      <AuthGuard requiredRole="user">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="user">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold">Fishing Journey</h1>
                <p className="text-xs text-gray-500">Your progress & achievements</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Awards</TabsTrigger>
              <TabsTrigger value="statistics">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Card><CardContent className="p-4 text-center">
                  <Fish className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <div className="text-lg font-bold">{stats?.totalCatches || 0}</div>
                  <div className="text-xs text-gray-600">Fish Caught</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <Trophy className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
                  <div className="text-lg font-bold">{stats?.eventsJoined || 0}</div>
                  <div className="text-xs text-gray-600">Events</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                  <div className="text-lg font-bold">{stats?.biggestCatch ? `${stats.biggestCatch.toFixed(2)} kg` : '-'}</div>
                  <div className="text-xs text-gray-600">Biggest</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <Award className="h-6 w-6 mx-auto text-green-600 mb-2" />
                  <div className="text-lg font-bold">{earned.length}</div>
                  <div className="text-xs text-gray-600">Achievements</div>
                </CardContent></Card>
              </div>

              {earned.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Recent Achievements</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {earned.slice(0, 3).map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                          <div className="text-2xl">{a.icon}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{a.name}</p>
                            <p className="text-xs text-gray-600">{a.description}</p>
                          </div>
                          <Badge className="text-xs bg-green-100 text-green-800">✓</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4 mt-4">
              {['MILESTONE', 'SKILL', 'LOYALTY', 'COMPETITIVE', 'DEDICATION', 'SOCIAL'].map(cat => {
                const items = achievements.filter(a => a.category === cat)
                if (!items.length) return null
                return (
                  <div key={cat}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">{cat.toLowerCase()}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {items.map(a => {
                        const unlocked = earnedIds.has(a.id)
                        return (
                          <Card key={a.id} className={unlocked ? 'bg-yellow-50' : 'bg-gray-50'}>
                            <CardContent className="p-4 text-center">
                              <div className={`text-2xl mb-2 ${!unlocked && 'grayscale opacity-50'}`}>{a.icon}</div>
                              <h3 className={`font-bold text-sm mb-1 ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>{a.name}</h3>
                              <p className={`text-xs ${unlocked ? 'text-gray-700' : 'text-gray-400'}`}>{a.description}</p>
                              {unlocked && <Badge className="mt-2 text-xs">✓ Unlocked</Badge>}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-sm text-gray-600">Bookings</p><p className="text-2xl font-bold">{stats?.totalBookings || 0}</p></div>
                      <div><p className="text-sm text-gray-600">Fish Caught</p><p className="text-2xl font-bold">{stats?.totalCatches || 0}</p></div>
                      <div><p className="text-sm text-gray-600">Events</p><p className="text-2xl font-bold">{stats?.eventsJoined || 0}</p></div>
                      <div><p className="text-sm text-gray-600">Wins</p><p className="text-2xl font-bold">{stats?.competitionsWon || 0}</p></div>
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between"><span className="text-sm">Biggest Catch</span><span className="font-medium">{stats?.biggestCatch ? `${stats.biggestCatch.toFixed(3)} kg` : 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Prize Money</span><span className="font-medium text-green-600">RM {(stats?.totalPrizeMoney || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Morning Slots</span><span className="font-medium">{stats?.morningSlots || 0}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Evening Slots</span><span className="font-medium">{stats?.eveningSlots || 0}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Current Streak</span><span className="font-medium">{stats?.currentStreak || 0} 🔥</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <BottomNavigation />
      </div>
    </AuthGuard>
  )
}
