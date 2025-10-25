'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Scale, ArrowRight, Lock, Unlock, QrCode, X
} from "lucide-react"
import { AuthGuard } from '@/components/AuthGuard'
import { useAuth } from '@/lib/auth'
import { RankingScreen } from './RankingScreen'

type KioskMode = 'locked' | 'unlocked'

export default function WeighingKioskPage() {
  const { user } = useAuth()
  const [kioskMode, setKioskMode] = useState<KioskMode>('locked')
  const [scannedQrCode, setScannedQrCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string>('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [weightData, setWeightData] = useState({ weight: '', notes: '' })
  const [isError, setIsError] = useState(false)
  const [rankingData, setRankingData] = useState<any>(null)
  const [showRankingScreen, setShowRankingScreen] = useState(false)
  const [lastSubmittedWeight, setLastSubmittedWeight] = useState(0)
  const scanInputRef = useRef<HTMLInputElement>(null)

  const unlockKiosk = () => {
    setKioskMode('unlocked')
    console.log('Weighing kiosk unlocked by', user?.name)
  }

  const lockKiosk = () => {
    setKioskMode('locked')
    setScannedQrCode('')
    setResult('')
    setUserInfo(null)
    setWeightData({ weight: '', notes: '' })
    setIsError(false)
    setRankingData(null)
    setShowRankingScreen(false)
    setLastSubmittedWeight(0)
    console.log('Weighing kiosk locked by', user?.name)
  }

  const handleValidateRod = async (qrCode: string) => {
    if (!qrCode.trim()) return

    setProcessing(true)
    setResult('')
    setUserInfo(null)
    setWeightData({ weight: '', notes: '' })
    setIsError(false)

    try {
      // Use the updated QR validation endpoint with rod type
      const response = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: qrCode.trim(),
          type: 'rod',
          validatedBy: user?.email || 'kiosk',
          stationId: 'WEIGHING-STATION-01'
        })
      })

      const data = await response.json()
      console.log('Rod validation response:', data)

      if (data.ok && data.data) {
        setUserInfo(data.data)
        setIsError(false)
        const userName = data.data.assignedUser?.name || 'Unknown User'
        const seatNumber = data.data.seat?.seatNumber
        const pondName = data.data.booking?.pond?.name || 'N/A'
        setResult(`🎣 Rod validated! Welcome ${userName} from seat #${seatNumber} at ${pondName}. Ready to weigh your catch!`)
      } else {
        setIsError(true)
        if (data.error?.includes('Rod QR code is not active')) {
          setResult(`❌ ERROR: This rod QR code is no longer active. Please contact staff for assistance.`)
        } else if (data.error?.includes('Rod is not assigned')) {
          setResult(`❌ ERROR: This rod is not properly assigned. Please contact staff for assistance.`)
        } else if (data.error?.includes('Invalid rod QR code')) {
          setResult(`❌ ERROR: Invalid rod QR code. Please scan a valid rod QR code for weighing.`)
        } else {
          setResult(`❌ ERROR: ${data.error || 'QR code not recognized. Please check the rod QR code and try again.'}`)
        }
      }

      if (data.error) {
        setTimeout(() => {
          setScannedQrCode('')
          setResult('')
          setUserInfo(null)
          setIsError(false)
          scanInputRef.current?.focus()
        }, 6000)
      }

    } catch (error) {
      console.error('Rod validation error:', error)
      setIsError(true)
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Connection failed - please check network'}`)
      
      setTimeout(() => {
        setScannedQrCode('')
        setResult('')
        setUserInfo(null)
        setIsError(false)
        scanInputRef.current?.focus()
      }, 5000)
    } finally {
      setProcessing(false)
    }
  }

  // Handle QR scanner input - just update the value
  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setScannedQrCode(value)
  }

  // Handle Enter key press (CRLF from QR scanner)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scannedQrCode.trim() && !processing) {
      e.preventDefault()
      handleValidateRod(scannedQrCode.trim())
    }
  }

  const handleSubmitWeight = async () => {
    if (!userInfo || !weightData.weight) return

    try {
      const response = await fetch('/api/weighing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: userInfo.booking.id,
          weight: parseFloat(weightData.weight),
          notes: weightData.notes,
          weighedBy: user?.email || 'kiosk',
          stationId: 'WEIGHING-STATION-01'
        })
      })

      const data = await response.json()
      
      if (data.ok) {
        const userName = userInfo.assignedUser?.name || 'Angler'
        const weight = parseFloat(weightData.weight)
        
        // Set ranking data and show ranking screen
        if (data.data?.userRanking) {
          setRankingData({
            ...data.data.userRanking,
            leaderboardSize: data.data.leaderboardSize
          })
          setLastSubmittedWeight(weight)
          setShowRankingScreen(true)
        }
        
        // Clear the form immediately
        setUserInfo(null)
        setWeightData({ weight: '', notes: '' })
        setScannedQrCode('')
        setResult('')
        setIsError(false)
      } else {
        setResult(`❌ Error recording weight: ${data.error}`)
      }
    } catch (error) {
      console.error('Weight submission error:', error)
      setResult(`❌ Failed to record weight. Please try again.`)
    }
  }

  const handleCancelWeighing = () => {
    setScannedQrCode('')
    setResult('')
    setUserInfo(null)
    setWeightData({ weight: '', notes: '' })
    setIsError(false)
    setRankingData(null)
    setShowRankingScreen(false)
    setLastSubmittedWeight(0)
    scanInputRef.current?.focus()
    console.log('Weighing cancelled by user')
  }

  const handleDismissRanking = () => {
    setShowRankingScreen(false)
    setRankingData(null)
    setLastSubmittedWeight(0)
    scanInputRef.current?.focus()
  }

  if (kioskMode === 'locked') {
    return (
      <AuthGuard requiredRole="manager">
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center bg-gray-50">
              <div className="mx-auto mb-4 w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <Lock className="h-16 w-16 text-gray-600" />
              </div>
              <CardTitle className="text-2xl text-gray-700">Weighing Station</CardTitle>
              <p className="text-gray-500 mt-2">Station is locked for security</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Manager: <span className="font-semibold">{user?.name}</span>
                </p>
                <Button 
                  onClick={unlockKiosk}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Unlock className="mr-2 h-5 w-5" />
                  Unlock Station
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="manager">
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-blue-700 border-blue-700">
                <Scale className="mr-1 h-3 w-3" />
                Station Active
              </Badge>
              <Badge variant="outline">
                Manager: {user?.name}
              </Badge>
            </div>
            <div className="mx-auto mb-4 w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
              <Scale className="h-20 w-20 text-blue-600" />
            </div>
            <CardTitle className="text-3xl">Weighing Station Ready</CardTitle>
            <p className="text-gray-600 mt-2">Scan rod QR code to begin weighing</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!userInfo && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Rod QR Code
                </label>
                <Input
                  ref={scanInputRef}
                  type="password"
                  value={scannedQrCode}
                  onChange={handleQrCodeChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Scan rod QR code..."
                  className="h-16 text-center text-2xl"
                  autoFocus
                  disabled={processing}
                />
              </div>
            )}

            {processing && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-600 font-semibold">Validating rod QR code...</div>
              </div>
            )}

            {userInfo && !isError && (
              <div className="space-y-4 p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-green-800">
                    {userInfo.assignedUser?.name || 'Unknown User'}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-lg text-green-700">
                      {userInfo.booking?.pond?.name || 'N/A'} • Seat #{userInfo.seat?.seatNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-800">Record Catch Weight</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={weightData.weight}
                        onChange={(e) => setWeightData({...weightData, weight: e.target.value})}
                        placeholder="0.00"
                        className="text-2xl h-16 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <Input
                        type="text"
                        value={weightData.notes}
                        onChange={(e) => setWeightData({...weightData, notes: e.target.value})}
                        placeholder="Fish type, condition..."
                        className="text-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={handleSubmitWeight}
                      disabled={!weightData.weight}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Scale className="mr-2 h-5 w-5" />
                      Record Weight
                    </Button>
                    <Button
                      onClick={handleCancelWeighing}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isError && (
              <div className="space-y-4 p-6 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-red-800">
                    ❌ Rod Validation Error
                  </h3>
                  <p className="text-lg text-red-700 mt-2">
                    Invalid or Inactive Rod QR Code
                  </p>
                </div>
                <div className="mt-4 p-4 bg-red-100 rounded-lg">
                  <p className="text-center text-red-800 font-semibold">
                    This weighing station only accepts valid, active rod QR codes.
                  </p>
                  <p className="text-center text-red-700 mt-2 text-sm">
                    Please ensure you are scanning a rod QR code (not a seat QR code) and that the rod is currently active.
                  </p>
                </div>
              </div>
            )}

            {!userInfo && (
              <Button 
                onClick={() => handleValidateRod(scannedQrCode)}
                disabled={!scannedQrCode.trim() || processing}
                className="w-full h-14 text-lg"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                {processing ? 'Validating...' : 'Manual Validate Rod'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={lockKiosk}
          variant="outline"
          className="fixed top-4 right-4 bg-white"
        >
          <Lock className="mr-2 h-4 w-4" />
          Lock Station
        </Button>
      </div>

      {/* Ranking Screen Overlay */}
      <RankingScreen
        isVisible={showRankingScreen}
        userName={rankingData?.userName || userInfo?.assignedUser?.name || 'Angler'}
        submittedWeight={lastSubmittedWeight}
        rankingData={rankingData || {}}
        onDismiss={handleDismissRanking}
      />
    </AuthGuard>
  )
}
