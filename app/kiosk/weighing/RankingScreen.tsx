'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Trophy, Medal, Award, TrendingUp, Fish, Scale, X
} from "lucide-react"

interface RankingData {
  rank: number
  totalCatches: number
  totalWeight: number
  biggestCatch: number
  averageWeight: number
  leaderboardSize?: number
}

interface RankingScreenProps {
  isVisible: boolean
  userName: string
  submittedWeight: number
  rankingData: RankingData
  onDismiss: () => void
}

export function RankingScreen({ 
  isVisible, 
  userName, 
  submittedWeight,
  rankingData, 
  onDismiss 
}: RankingScreenProps) {
  const [countdown, setCountdown] = useState(15)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setCountdown(15)
      setShowConfetti(true)
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            onDismiss()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Hide confetti after 3 seconds
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000)

      return () => {
        clearInterval(timer)
        clearTimeout(confettiTimer)
      }
    }
  }, [isVisible, onDismiss])

  if (!isVisible) return null

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50" }
    if (rank === 2) return { icon: Medal, color: "text-gray-400", bg: "bg-gray-50" }
    if (rank === 3) return { icon: Award, color: "text-amber-600", bg: "bg-amber-50" }
    return { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" }
  }

  const rankInfo = getRankDisplay(rankingData.rank)
  const RankIcon = rankInfo.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              {Math.random() > 0.5 ? '🎉' : '⭐'}
            </div>
          ))}
        </div>
      )}

      <Card className="w-full max-w-4xl shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`mx-auto mb-6 w-32 h-32 ${rankInfo.bg} rounded-full flex items-center justify-center`}>
              <RankIcon className={`h-20 w-20 ${rankInfo.color}`} />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Congratulations {userName}!
            </h1>
            <p className="text-2xl text-gray-600">
              Your {submittedWeight}kg catch has been recorded
            </p>
          </div>

          {/* Main Ranking Display */}
          <div className="bg-white rounded-lg p-8 mb-8 shadow-inner">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Current Ranking</h2>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-6xl font-bold text-blue-600">
                  #{rankingData.rank}
                </div>
                <div className="text-xl text-gray-600">
                  out of {rankingData.leaderboardSize || 'all'} anglers
                </div>
              </div>
              {rankingData.rank <= 3 && (
                <p className="text-lg text-green-600 font-semibold mt-2">
                  🏆 You're in the top 3! Keep it up!
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Fish className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-800">
                  {rankingData.totalCatches}
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  Total Catches
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Scale className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-800">
                  {rankingData.totalWeight}kg
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Total Weight
                </div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-800">
                  {rankingData.biggestCatch}kg
                </div>
                <div className="text-sm text-yellow-600 font-medium">
                  Biggest Catch
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-800">
                  {rankingData.averageWeight?.toFixed(2)}kg
                </div>
                <div className="text-sm text-purple-600 font-medium">
                  Average Weight
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-lg text-gray-500">
              Auto-close in {countdown} seconds
            </div>
            <Button
              onClick={onDismiss}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              <X className="mr-2 h-5 w-5" />
              Continue Weighing
            </Button>
          </div>

          {/* Motivational Message */}
          {rankingData.rank === 1 && (
            <div className="mt-6 text-center p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg">
              <h3 className="text-xl font-bold">🎉 You're in 1st place! 🎉</h3>
              <p>You're leading the competition! Keep up the excellent fishing!</p>
            </div>
          )}

          {rankingData.rank > 1 && rankingData.rank <= 5 && (
            <div className="mt-6 text-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
              <h3 className="text-xl font-bold">🚀 You're in the top 5! 🚀</h3>
              <p>Great fishing! You're close to the top spot!</p>
            </div>
          )}

          {rankingData.rank > 5 && (
            <div className="mt-6 text-center p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg">
              <h3 className="text-xl font-bold">🎣 Keep fishing! 🎣</h3>
              <p>Every catch counts! Your next one could be the big one!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}