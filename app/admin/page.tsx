'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Users,
  Fish,
  TrendingUp,
  MapPin,
  Clock,
  DollarSign,
  Settings,
  Plus,
  Scale,
  Trophy,
  Eye,
  RefreshCw,
  Activity
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { useAuth } from "@/lib/auth"
import { useRouter } from 'next/navigation'

const realtimeStats = {
  totalBookings: 127,
  totalRevenue: 5850,
  activeParticipants: 89,
  totalCaught: 234,
  averageWeight: 2.8,
  leadingPond: "Emerald Lake"
}

const pondStatus = [
  { id: 1, name: "Emerald Lake", capacity: 24, occupied: 18, revenue: 900, catches: 67 },
  { id: 2, name: "Golden Creek", capacity: 16, occupied: 12, revenue: 540, catches: 45 },
  { id: 3, name: "Silver Basin", capacity: 20, occupied: 15, revenue: 600, catches: 52 },
  { id: 4, name: "Crystal Pond", capacity: 12, occupied: 8, revenue: 440, catches: 31 }
]

const liveLeaderboard = [
  { rank: 1, name: "Alex Chen", weight: 5.2, pond: "Emerald Lake", time: "10:45 AM" },
  { rank: 2, name: "Maria Santos", weight: 4.8, pond: "Golden Creek", time: "11:20 AM" },
  { rank: 3, name: "John Fisher", weight: 4.5, pond: "Silver Basin", time: "09:30 AM" },
  { rank: 4, name: "Sarah Wilson", weight: 4.2, pond: "Crystal Pond", time: "10:15 AM" },
  { rank: 5, name: "Mike Johnson", weight: 3.9, pond: "Emerald Lake", time: "11:45 AM" }
]

const recentActivity = [
  { id: 1, type: "booking", user: "Tom Brown", action: "Booked seat A3 at Emerald Lake", time: "2 min ago" },
  { id: 2, type: "catch", user: "Lisa Park", action: "Caught 3.2kg fish at Golden Creek", time: "5 min ago" },
  { id: 3, type: "entry", user: "David Lee", action: "Checked in at Silver Basin", time: "8 min ago" },
  { id: 4, type: "booking", user: "Anna Kim", action: "Cancelled booking at Crystal Pond", time: "12 min ago" }
]

export default function AdminPage() {
  const [selectedParticipant, setSelectedParticipant] = useState<string>('')
  const [fishWeight, setFishWeight] = useState<string>('')
  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleWeightCapture = () => {
    if (selectedParticipant && fishWeight) {
      // In real app, would submit to backend
      alert(`Recorded ${fishWeight}kg catch for ${selectedParticipant}`)
      setFishWeight('')
      setSelectedParticipant('')
      setIsWeightDialogOpen(false)
    }
  }

  return (
    <AuthGuard requiredRole="manager">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {user?.role === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard'}
                </h1>
                <p className="text-xs text-gray-500">Competition Management</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog open={isWeightDialogOpen} onOpenChange={setIsWeightDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Scale className="h-4 w-4 mr-1" />
                    Log Catch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm mx-auto">
                  <DialogHeader>
                    <DialogTitle>Record Fish Weight</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Participant</label>
                      <Input
                        placeholder="Enter participant name"
                        value={selectedParticipant}
                        onChange={(e) => setSelectedParticipant(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Weight (kg)</label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={fishWeight}
                        onChange={(e) => setFishWeight(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleWeightCapture} className="w-full">
                      Record Catch
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Real-time Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{realtimeStats.activeParticipants}</div>
              <div className="text-xs text-gray-600">Active Now</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">${realtimeStats.totalRevenue}</div>
              <div className="text-xs text-gray-600">Revenue</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <Fish className="h-6 w-6 mx-auto text-orange-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{realtimeStats.totalCaught}</div>
              <div className="text-xs text-gray-600">Fish Caught</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-6 w-6 mx-auto text-purple-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{realtimeStats.averageWeight}kg</div>
              <div className="text-xs text-gray-600">Avg Weight</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="ponds" className="text-xs">Ponds</TabsTrigger>
            <TabsTrigger value="rankings" className="text-xs">Rankings</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/admin/monitor">
                    <Button variant="outline" className="w-full h-12">
                      <Activity className="h-4 w-4 mr-2" />
                      Live Monitor
                    </Button>
                  </Link>
                  <Link href="/scanner">
                    <Button variant="outline" className="w-full h-12">
                      <Eye className="h-4 w-4 mr-2" />
                      QR Scanner
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full h-12" onClick={() => setIsWeightDialogOpen(true)}>
                    <Scale className="h-4 w-4 mr-2" />
                    Log Weight
                  </Button>
                  {user?.role === 'admin' && (
                    <Link href="/admin/users">
                      <Button variant="outline" className="w-full h-12">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Users
                      </Button>
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link href="/admin/database">
                      <Button variant="outline" className="w-full h-12">
                        <Settings className="h-4 w-4 mr-2" />
                        Database Utils
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bookings</span>
                    <span className="font-bold">{realtimeStats.totalBookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue</span>
                    <span className="font-bold text-green-600">${realtimeStats.totalRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fish Caught</span>
                    <span className="font-bold">{realtimeStats.totalCaught}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leading Pond</span>
                    <span className="font-bold">{realtimeStats.leadingPond}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ponds Tab */}
          <TabsContent value="ponds" className="space-y-4">
            <div className="space-y-3">
              {pondStatus.map((pond) => (
                <Card key={pond.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{pond.name}</h3>
                      <Badge variant={pond.occupied >= pond.capacity * 0.8 ? "default" : "secondary"}>
                        {Math.round((pond.occupied / pond.capacity) * 100)}% full
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Occupied</p>
                        <p className="font-bold text-blue-600">{pond.occupied}/{pond.capacity}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-bold text-green-600">${pond.revenue}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Catches</p>
                        <p className="font-bold text-orange-600">{pond.catches}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(pond.occupied / pond.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Live Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveLeaderboard.map((entry) => (
                    <div key={entry.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                          entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          #{entry.rank}
                        </div>
                        <div>
                          <div className="font-medium">{entry.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {entry.pond}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{entry.weight}kg</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'booking' ? 'bg-blue-500' :
                        activity.type === 'catch' ? 'bg-green-500' :
                        activity.type === 'entry' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AuthGuard>
  )
}
