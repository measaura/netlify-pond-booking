'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Star, Target, Calendar, Users, Award, Fish } from "lucide-react"
import Link from "next/link"
import { getAllBookings } from "@/lib/localStorage"
import type { BookingData } from '@/types'
import { useAuth } from '@/lib/auth'

const achievements = [
  { id: 1, title: "First Catch", description: "Caught your first fish", earned: true, icon: "🎣", category: "milestone" },
  { id: 2, title: "Big Catch", description: "Caught a fish over 3kg", earned: true, icon: "🐟", category: "skill" },
  { id: 3, title: "Regular Visitor", description: "Made 10 bookings", earned: true, icon: "⭐", category: "loyalty" },
  { id: 4, title: "Competition Winner", description: "Won a fishing competition", earned: false, icon: "🏆", category: "competitive" },
  { id: 5, title: "Early Bird", description: "Booked 5 morning slots", earned: true, icon: "🌅", category: "dedication" },
  { id: 6, title: "Master Angler", description: "Caught fish in all ponds", earned: false, icon: "👑", category: "skill" },
  { id: 7, title: "Night Fisher", description: "Complete 3 evening sessions", earned: true, icon: "🌙", category: "dedication" },
  { id: 8, title: "Social Angler", description: "Book 5 group sessions", earned: false, icon: "👥", category: "social" },
  { id: 9, title: "Perfect Session", description: "Complete a session without losing gear", earned: true, icon: "✨", category: "skill" },
  { id: 10, title: "Seasonal Master", description: "Fish in all four seasons", earned: false, icon: "🍂", category: "dedication" }
]

const competitionHistory = [
  {
    id: 1,
    name: "Bass Masters Cup",
    date: "2025-09-01",
    rank: 3,
    participants: 45,
    prize: "$200",
    weight: "4.8 kg",
    type: "tournament"
  },
  {
    id: 2,
    name: "Trout Tournament",
    date: "2025-08-15",
    rank: 7,
    participants: 32,
    prize: "-",
    weight: "3.1 kg",
    type: "tournament"
  },
  {
    id: 3,
    name: "Weekly Championship",
    date: "2025-08-01",
    rank: 2,
    participants: 28,
    prize: "$500",
    weight: "5.2 kg",
    type: "weekly"
  },
  {
    id: 4,
    name: "Night Fishing Derby",
    date: "2025-07-20",
    rank: 1,
    participants: 15,
    prize: "$1000",
    weight: "6.2 kg",
    type: "special"
  }
]

const fishingStats = {
  totalSessions: 24,
  totalFish: 67,
  biggestCatch: "6.2 kg",
  averageCatch: "2.4 kg",
  favoriteSpot: "Emerald Lake",
  bestMonth: "September",
  currentStreak: 5,
  totalDistance: "125 km"
}

export default function FishingJourneyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [bookings, setBookings] = useState<BookingData[]>([])

  useEffect(() => {
    const allBookings = getAllBookings()
    setBookings(allBookings)
  }, [])

  const earnedAchievements = achievements.filter(a => a.earned)
  const upcomingAchievements = achievements.filter(a => !a.earned)

  return (
    <AuthGuard requiredRole="user">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Fishing Journey</h1>
                <p className="text-xs text-gray-500">Your progress & achievements</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="competitions" className="text-xs">Contests</TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs">Awards</TabsTrigger>
              <TabsTrigger value="statistics" className="text-xs">Stats</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Fish className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <div className="text-lg font-bold text-gray-900">{fishingStats.totalFish}</div>
                    <div className="text-xs text-gray-600">Fish Caught</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
                    <div className="text-lg font-bold text-gray-900">{competitionHistory.length}</div>
                    <div className="text-xs text-gray-600">Competitions</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                    <div className="text-lg font-bold text-gray-900">{fishingStats.biggestCatch}</div>
                    <div className="text-xs text-gray-600">Biggest Catch</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Award className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <div className="text-lg font-bold text-gray-900">{earnedAchievements.length}</div>
                    <div className="text-xs text-gray-600">Achievements</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnedAchievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{achievement.title}</p>
                          <p className="text-xs text-gray-600">{achievement.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Earned
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Achievements Card */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab("achievements")}
              >
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Achievements
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {earnedAchievements.length}/{achievements.length}
                    </Badge>
                  </h3>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {achievements.slice(0, 6).map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`text-center p-2 rounded-lg border ${
                          achievement.earned 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : 'bg-gray-50 border-gray-200 opacity-50'
                        }`}
                      >
                        <div className="text-lg mb-1">{achievement.icon}</div>
                        <div className="text-xs font-medium text-gray-900 line-clamp-1">{achievement.title}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Tap to view all achievements and progress
                  </p>
                </CardContent>
              </Card>

              {/* Next Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Next Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingAchievements.slice(0, 2).map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                        <div className="text-2xl grayscale">{achievement.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{achievement.title}</p>
                          <p className="text-xs text-gray-500">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Competitions Tab */}
            <TabsContent value="competitions" className="space-y-4">
              <div className="space-y-3">
                {competitionHistory.map((comp) => (
                  <Card key={comp.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                          <Badge variant={comp.type === 'tournament' ? 'default' : 'secondary'}>
                            {comp.type}
                          </Badge>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          comp.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          comp.rank === 2 ? 'bg-gray-100 text-gray-800' :
                          comp.rank === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          #{comp.rank}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-medium">{new Date(comp.date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Participants</p>
                          <p className="font-medium">{comp.participants}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Best Weight</p>
                          <p className="font-medium">{comp.weight}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Prize</p>
                          <p className="font-medium text-green-600">{comp.prize}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-4">
              {/* Achievement Categories */}
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className={achievement.earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50'}>
                    <CardContent className="p-4 text-center">
                      <div className={`text-2xl mb-2 ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      <h3 className={`font-bold text-sm mb-1 ${achievement.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                        {achievement.title}
                      </h3>
                      <p className={`text-xs ${achievement.earned ? 'text-gray-600' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`mt-2 text-xs ${
                          achievement.earned ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {achievement.earned ? 'Earned' : achievement.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-4">
              {/* Personal Records */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biggest Catch:</span>
                      <span className="font-medium text-green-600">{fishingStats.biggestCatch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Catch:</span>
                      <span className="font-medium">{fishingStats.averageCatch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Streak:</span>
                      <span className="font-medium text-blue-600">{fishingStats.currentStreak} sessions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Distance:</span>
                      <span className="font-medium">{fishingStats.totalDistance} traveled</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fishing Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fishing Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Favorite Spot:</span>
                      <span className="font-medium">{fishingStats.favoriteSpot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Month:</span>
                      <span className="font-medium">{fishingStats.bestMonth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Sessions:</span>
                      <span className="font-medium">{fishingStats.totalSessions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competition Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Competition Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Competitions Entered:</span>
                      <span className="font-medium">{competitionHistory.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wins:</span>
                      <span className="font-medium text-yellow-600">
                        {competitionHistory.filter(c => c.rank === 1).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Top 3 finishes:</span>
                      <span className="font-medium text-orange-600">
                        {competitionHistory.filter(c => c.rank <= 3).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Prize Money:</span>
                      <span className="font-medium text-green-600">$1,700</span>
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
