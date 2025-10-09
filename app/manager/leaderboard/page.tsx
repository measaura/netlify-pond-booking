'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { useAuth } from '@/lib/auth'
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Fish, 
  Trophy, 
  Target, 
  ArrowLeft,
  RefreshCw,
  Award,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { 
  generateOverallLeaderboard,
  getCatches,
  getEvents,
  generateEventLeaderboard,
} from '@/lib/localStorage'
import { LeaderboardEntry, EventLeaderboard } from '@/types'

function LeaderboardCard({ entry, index, showRank = true }: { 
  entry: LeaderboardEntry, 
  index: number, 
  showRank?: boolean 
}) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
    if (rank === 3) return 'bg-gradient-to-r from-orange-300 to-orange-400 text-orange-800'
    return 'bg-gray-100 text-gray-700'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank.toString()
  }

  return (
    <Card className={`mb-3 ${index < 3 ? 'border-2' : ''} ${
      index === 0 ? 'border-yellow-300 bg-yellow-50' :
      index === 1 ? 'border-gray-300 bg-gray-50' :
      index === 2 ? 'border-orange-300 bg-orange-50' :
      ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Rank */}
          {showRank && (
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getRankStyle(entry.rank)}`}>
              {getRankIcon(entry.rank)}
            </div>
          )}

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg text-gray-900 truncate mb-1">
              {entry.userName}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {entry.userEmail}
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Fish className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{entry.totalFish}</span>
                <span className="text-gray-600">fish</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="font-medium">{entry.biggestFish.toFixed(1)}kg</span>
                <span className="text-gray-600">best</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="font-medium">{entry.averageWeight.toFixed(1)}kg</span>
                <span className="text-gray-600">avg</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-orange-600" />
                <span className="font-medium">{entry.points}</span>
                <span className="text-gray-600">pts</span>
              </div>
            </div>
          </div>

          {/* Total Weight */}
          <div className="text-right flex-shrink-0">
            <div className="font-black text-2xl text-gray-900">
              {entry.totalWeight.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 font-medium">kg total</div>
            {entry.competitionsWon > 0 && (
              <Badge variant="secondary" className="mt-1 text-xs">
                🏆 {entry.competitionsWon} wins
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FullLeaderboard() {
  const { user } = useAuth()
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([])
  const [eventLeaderboards, setEventLeaderboards] = useState<EventLeaderboard[]>([])
  const [totalCatches, setTotalCatches] = useState(0)
  const [activeTab, setActiveTab] = useState<'overall' | 'events'>('overall')
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = () => {
    const overall = generateOverallLeaderboard()
    setOverallLeaderboard(overall)
    
    const catches = getCatches()
    setTotalCatches(catches.length)
    
    // Generate leaderboards for open events
    const events = getEvents()
    const openEvents = events.filter(event => event.status === 'open')
    const eventBoards = openEvents.map(event => generateEventLeaderboard(event.id))
    setEventLeaderboards(eventBoards)
    
    setLastUpdated(new Date())
  }

  const topThree = overallLeaderboard.slice(0, 3)
  const remainingEntries = overallLeaderboard.slice(3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manager/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Leaderboard</h1>
                <p className="text-xs text-gray-500">Competition Rankings</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{overallLeaderboard.length}</div>
              <div className="text-xs text-gray-600">Anglers</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <Fish className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{totalCatches}</div>
              <div className="text-xs text-gray-600">Total Catches</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <Trophy className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {overallLeaderboard.length > 0 ? overallLeaderboard[0].totalWeight.toFixed(1) : '0.0'}
              </div>
              <div className="text-xs text-gray-600">Top Weight</div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <Button
            variant={activeTab === 'overall' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('overall')}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Overall
          </Button>
          <Button
            variant={activeTab === 'events' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('events')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </Button>
        </div>

        {/* Overall Leaderboard */}
        {activeTab === 'overall' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Overall Rankings</h3>
              <div className="text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            {overallLeaderboard.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="font-semibold text-gray-900 mb-2">No Rankings Yet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Start recording catches to see the leaderboard!
                  </p>
                  <Link href="/dedicated-scanner">
                    <Button>
                      <Fish className="h-4 w-4 mr-2" />
                      Record Catches
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div>
                {/* Top 3 - Special Display */}
                {topThree.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Top Performers
                    </h4>
                    {topThree.map((entry, index) => (
                      <LeaderboardCard key={entry.userId} entry={entry} index={index} />
                    ))}
                  </div>
                )}

                {/* Remaining entries */}
                {remainingEntries.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      All Rankings
                    </h4>
                    {remainingEntries.map((entry, index) => (
                      <LeaderboardCard key={entry.userId} entry={entry} index={index + 3} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Event Leaderboards */}
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Event Rankings</h3>
            </div>

            {eventLeaderboards.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="font-semibold text-gray-900 mb-2">No Active Events</h3>
                  <p className="text-sm text-gray-600">
                    Event leaderboards will appear here when competitions are active.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {eventLeaderboards.map((eventBoard) => (
                  <Card key={eventBoard.eventId}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        {eventBoard.eventName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {eventBoard.entries.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <Fish className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No catches recorded for this event yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {eventBoard.entries.slice(0, 5).map((entry, index) => (
                            <LeaderboardCard 
                              key={entry.userId} 
                              entry={entry} 
                              index={index}
                              showRank={false}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ManagerNavigation />
    </div>
  )
}

export default function FullLeaderboardPage() {
  return (
    <AuthGuard requiredRole="manager">
      <FullLeaderboard />
    </AuthGuard>
  )
}
