'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  CheckCircle, QrCode, ArrowRight, Lock, Unlock, UserCheck
} from "lucide-react"
import { AuthGuard } from '@/components/AuthGuard'
import { useAuth } from '@/lib/auth'

type KioskMode = 'locked' | 'unlocked'

export default function CheckInKioskPage() {
  const { user } = useAuth()
  const [kioskMode, setKioskMode] = useState<KioskMode>('locked')
  const [scannedQrCode, setScannedQrCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string>('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [showRodQr, setShowRodQr] = useState<string>('')
  const [isError, setIsError] = useState(false)
  const scanInputRef = useRef<HTMLInputElement>(null)

  const unlockKiosk = () => {
    setKioskMode('unlocked')
    console.log('Check-in kiosk unlocked by', user?.name)
  }

  const lockKiosk = () => {
    setKioskMode('locked')
    setScannedQrCode('')
    setResult('')
    setUserInfo(null)
    setShowRodQr('')
    setIsError(false)
    console.log('Check-in kiosk locked by', user?.name)
  }

  const handleProcessCheckIn = async (qrCode: string) => {
    if (!qrCode.trim()) return

    setProcessing(true)
    setResult('')
    setUserInfo(null)
    setShowRodQr('')
    setIsError(false)

    try {
      const response = await fetch('/api/checkins/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: qrCode.trim(),
          scannedBy: user?.email || 'kiosk',
          stationId: 'CHECKIN-STATION-01'
        })
      })

      const data = await response.json()
      console.log('Check-in API response:', data)

      if (data.ok) {
        setUserInfo(data.data)
        if (data.alreadyCheckedIn) {
          // User is already logged in - show ERROR
          setIsError(true)
          const userName = data.data.user.nickname || data.data.user.name
          const checkInTime = new Date(data.data.checkInTime).toLocaleString()
          const seatNumber = data.data.booking.seatNumber
          setResult(`❌ ERROR: ${userName} is already logged in to the system since ${checkInTime}. Current seat: #${seatNumber}. Please log out first before checking in again.`)
        } else {
          // Successful new check-in
          setIsError(false)
          const userName = data.data.user.nickname || data.data.user.name
          const seatNumber = data.data.booking.seatNumber
          setResult(`🎉 Welcome, ${userName}! You have been successfully checked in to seat #${seatNumber}.`)
          // Generate rod QR code for new check-ins only
          setShowRodQr(`ROD-${data.data.booking.id}-${Date.now()}`)
        }
      } else {
        setIsError(true)
        setResult(`❌ ERROR: ${data.error}`)
      }

      setTimeout(() => {
        setScannedQrCode('')
        setResult('')
        setUserInfo(null)
        setShowRodQr('')
        setIsError(false)
        scanInputRef.current?.focus()
      }, 8000)

    } catch (error) {
      console.error('Check-in error:', error)
      setIsError(true)
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      setTimeout(() => {
        setScannedQrCode('')
        setResult('')
        setUserInfo(null)
        setShowRodQr('')
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
      handleProcessCheckIn(scannedQrCode.trim())
    }
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
              <CardTitle className="text-2xl text-gray-700">Check-In Station</CardTitle>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-purple-700 border-purple-700">
                <CheckCircle className="mr-1 h-3 w-3" />
                Station Active
              </Badge>
              <Badge variant="outline">
                Manager: {user?.name}
              </Badge>
            </div>
            <div className="mx-auto mb-4 w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center">
              <UserCheck className="h-20 w-20 text-purple-600" />
            </div>
            <CardTitle className="text-3xl">Check-In Station Ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Participant QR Code
              </label>
              <Input
                ref={scanInputRef}
                type="password"
                value={scannedQrCode}
                onChange={handleQrCodeChange}
                onKeyDown={handleKeyDown}
                placeholder="Scan participant QR code..."
                className="h-16 text-center text-2xl"
                autoFocus
                disabled={processing}
              />
            </div>

            {processing && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-600 font-semibold">Processing check-in...</div>
              </div>
            )}

            {userInfo && !isError && (
              <div className="space-y-4 p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-800">
                    ✅ Check-In Successful!
                  </h3>
                  <p className="text-lg text-green-700 mt-2">
                    Welcome, {userInfo.user.nickname || userInfo.user.name}!
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Full Name:</span>
                    <div className="text-lg">{userInfo.user.name}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Pond:</span>
                    <div className="text-lg">{userInfo.booking.pond?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Seat Number:</span>
                    <div className="text-lg font-bold text-blue-600">#{userInfo.booking.seatNumber}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Check-in Time:</span>
                    <div className="text-lg">{new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
                
                {showRodQr && (
                  <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-200">
                    <div className="text-center">
                      <div className="font-semibold text-gray-700 mb-2">Rod QR Code:</div>
                      <div className="font-mono text-xl bg-gray-100 p-3 rounded border">
                        {showRodQr}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Please take your rod with this QR code
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {userInfo && isError && (
              <div className="space-y-4 p-6 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-red-800">
                    ❌ Check-In Error
                  </h3>
                  <p className="text-lg text-red-700 mt-2">
                    User Already Logged In
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">User Name:</span>
                    <div className="text-lg">{userInfo.user.nickname || userInfo.user.name}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Current Seat:</span>
                    <div className="text-lg font-bold text-red-600">#{userInfo.booking.seatNumber}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Logged In Since:</span>
                    <div className="text-lg">{new Date(userInfo.checkInTime).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>
                    <div className="text-lg text-red-600 font-semibold">ALREADY LOGGED IN</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-red-100 rounded-lg">
                  <p className="text-center text-red-800 font-semibold">
                    This user must log out first before checking in again.
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={() => handleProcessCheckIn(scannedQrCode)}
              disabled={!scannedQrCode.trim() || processing}
              className="w-full h-14 text-lg"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              {processing ? 'Processing...' : 'Manual Process Check-In'}
            </Button>
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
    </AuthGuard>
  )
}
