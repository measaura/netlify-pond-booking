'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Camera, CameraOff, CheckCircle, XCircle, Users, Clock, MapPin, AlertTriangle, UserCheck, UserX, RefreshCw, Fish, Scale, Target, Trophy } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { useAuth } from "@/lib/auth"
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { 
  validateQRCode, 
  validateQRCodeForCheckout,
  checkInUser, 
  checkOutUser,
  getTodayCheckIns,
  getCheckInStats,
  recordCatch,
  getCatchesByUser,
  getAllCurrentCheckIns
} from "@/lib/localStorage"
import type {
  CheckInRecord,
  QRValidationResult,
  BookingData,
  CatchRecord
} from '@/types'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface ScanResult {
  timestamp: string
  valid: boolean
  bookingId?: string
  pond?: string
  seats?: string[]
  userName?: string
  error?: string
  status: 'success' | 'error' | 'warning'
  action?: 'checkin' | 'checkout' | 'catch'
}

export default function DedicatedScannerPage() {
  const { user } = useAuth()
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [activeTab, setActiveTab] = useState<'checkin' | 'checkout' | 'catch'>('checkin')
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [currentScan, setCurrentScan] = useState<QRValidationResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Dialog states
  const [checkInDialog, setCheckInDialog] = useState<{ open: boolean; booking?: BookingData; validation?: QRValidationResult }>({ open: false })
  const [checkOutDialog, setCheckOutDialog] = useState<{ open: boolean; checkInRecord?: CheckInRecord; booking?: BookingData }>({ open: false })
  const [catchDialog, setCatchDialog] = useState<{ open: boolean; checkInRecord?: CheckInRecord; booking?: BookingData }>({ open: false })
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string; type: 'error' | 'warning' }>({ open: false, title: '', message: '', type: 'error' })
  
  // Data states
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInRecord[]>([])
  const [stats, setStats] = useState(getCheckInStats())
  const [notes, setNotes] = useState('')
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  
  // Catch recording states
  const [catchData, setCatchData] = useState({
    weight: '',
    length: '',
    species: '',
    notes: ''
  })

  // Load data and check camera on mount
  useEffect(() => {
    refreshData()
    checkCameraStatus()
  }, [])

  const checkCameraStatus = async () => {
    setCameraStatus('checking')
    try {
      if (!navigator.mediaDevices) {
        setCameraStatus('unavailable')
        return
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setCameraStatus(videoDevices.length > 0 ? 'available' : 'unavailable')
    } catch (error) {
      console.error('Camera status check error:', error)
      setCameraStatus('unavailable')
    }
  }

  const refreshData = () => {
    setTodayCheckIns(getTodayCheckIns())
    setStats(getCheckInStats())
  }

  const startScanning = async () => {
    try {
      setIsScanning(true)
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop())
      
      // Initialize QR Scanner
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: "user"
          },
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: false,
          defaultZoomValueIfSupported: 1,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        false
      )

      qrScannerRef.current = scanner

      const onScanSuccess = (decodedText: string) => {
        console.log('QR Code detected:', decodedText, 'Tab:', activeTab)
        handleQRScan(decodedText)
      }

      const onScanFailure = (error: string) => {
        if (!error.includes('NotFoundException') && !error.includes('No QR code found')) {
          console.log('QR scan error:', error)
        }
      }

      scanner.render(onScanSuccess, onScanFailure)
      
    } catch (err) {
      console.error('Error starting QR scanner:', err)
      setIsScanning(false)
      
      const errorMsg = (err as Error).message || String(err)
      
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        alert('Camera permission denied. Please allow camera access and try again.')
      } else if (errorMsg.includes('NotFoundError')) {
        alert('No camera found. Please ensure your device has a working camera.')
      } else {
        alert(`Scanner error: ${errorMsg}\n\nPlease try refreshing the page.`)
      }
    }
  }

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear().catch((error: unknown) => {
        console.error('Error stopping scanner:', error)
      })
      qrScannerRef.current = null
    }
    
    setIsScanning(false)
    console.log('QR Scanner stopped')
  }

  const handleQRScan = (qrData: string) => {
    if (!user || isProcessing) return

    console.log('QR Data scanned:', qrData, 'Active Tab:', activeTab)
    
    if (activeTab === 'checkin') {
      handleCheckInScan(qrData)
    } else if (activeTab === 'checkout') {
      handleCheckOutScan(qrData)
    } else if (activeTab === 'catch') {
      handleCatchScan(qrData)
    }
  }

  const handleCheckInScan = (qrData: string) => {
    const validation = validateQRCode(qrData, user!.email)
    setCurrentScan(validation)

    const scanResult: ScanResult = {
      timestamp: new Date().toLocaleTimeString(),
      valid: validation.valid,
      bookingId: validation.booking?.bookingId,
      pond: validation.booking?.pond?.name,
      seats: validation.booking?.seats?.map(s => s.number.toString()),
      error: validation.error,
      status: validation.valid ? 
        (validation.alreadyCheckedIn ? 'warning' : 'success') : 'error',
      action: 'checkin'
    }

    setScanResults(prev => [scanResult, ...prev.slice(0, 9)])

    if (validation.valid && validation.booking && !validation.alreadyCheckedIn) {
      setCheckInDialog({ 
        open: true, 
        booking: validation.booking,
        validation 
      })
      setIsProcessing(true)
    } else if (validation.valid && validation.alreadyCheckedIn) {
      setErrorDialog({
        open: true,
        title: '⚠️ Already Checked In',
        message: 'This user is already checked in!\n\nUse Check-Out tab to check them out first.',
        type: 'warning'
      })
    } else if (!validation.valid) {
      let enhancedMessage = validation.error || 'Please scan a valid booking QR code.'
      
      if ((validation.isWrongTime || validation.isWrongDate) && validation.booking) {
        const bookingDate = new Date(validation.booking.date)
        const formattedDate = bookingDate.toLocaleDateString('en-GB')
        
        let formattedTimeSlot = validation.booking.timeSlot?.time || 'Unknown time'
        if (validation.booking.timeSlot?.time) {
          const timeRange = validation.booking.timeSlot.time.split('-')
          if (timeRange.length === 2) {
            const formatTo12Hour = (time: string) => {
              const [hours, minutes] = time.trim().split(':')
              const hour = parseInt(hours)
              const ampm = hour >= 12 ? 'PM' : 'AM'
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
              return `${displayHour}:${minutes} ${ampm}`
            }
            
            const startTime12 = formatTo12Hour(timeRange[0])
            const endTime12 = formatTo12Hour(timeRange[1])
            formattedTimeSlot = `${startTime12} - ${endTime12}`
          }
        }
        
        enhancedMessage += `\n\n📋 Booking Details:\n• Date: ${formattedDate}\n• Time: ${formattedTimeSlot}\n• Pond: ${validation.booking.pond?.name || 'Unknown'}\n• Seat: ${validation.booking.seats?.map(s => s.number).join(', ') || 'Unknown'}`
      }
      
      setErrorDialog({
        open: true,
        title: validation.isWrongTime ? '⏰ Wrong Time' : validation.isWrongDate ? '📅 Wrong Date' : '❌ Invalid QR Code',
        message: enhancedMessage,
        type: validation.isWrongTime || validation.isWrongDate ? 'warning' : 'error'
      })
    }
  }

  const handleCheckOutScan = (qrData: string) => {
    const validation = validateQRCodeForCheckout(qrData, user!.email)
    setCurrentScan(validation)

    const scanResult: ScanResult = {
      timestamp: new Date().toLocaleTimeString(),
      valid: validation.valid,
      bookingId: validation.booking?.bookingId,
      pond: validation.booking?.pond?.name,
      seats: validation.booking?.seats?.map(s => s.number.toString()),
      error: validation.error,
      status: validation.valid ? 'success' : 'error',
      action: 'checkout'
    }

    setScanResults(prev => [scanResult, ...prev.slice(0, 9)])

    if (validation.valid && validation.booking && validation.checkInRecord) {
      setCheckOutDialog({ 
        open: true, 
        checkInRecord: validation.checkInRecord,
        booking: validation.booking
      })
      setIsProcessing(true)
    } else if (!validation.valid) {
      setErrorDialog({
        open: true,
        title: '❌ Cannot Check Out',
        message: validation.error || 'Please scan a QR code from a user who is currently checked in.',
        type: 'error'
      })
    }
  }

  const handleCatchScan = (qrData: string) => {
    // For catch recording, we need to validate that the user is currently checked in
    const validation = validateQRCodeForCheckout(qrData, user!.email) // Using checkout validation to find current check-ins
    setCurrentScan(validation)

    const scanResult: ScanResult = {
      timestamp: new Date().toLocaleTimeString(),
      valid: validation.valid,
      bookingId: validation.booking?.bookingId,
      pond: validation.booking?.pond?.name,
      seats: validation.booking?.seats?.map(s => s.number.toString()),
      error: validation.error,
      status: validation.valid ? 'success' : 'error',
      action: 'catch'
    }

    setScanResults(prev => [scanResult, ...prev.slice(0, 9)])

    if (validation.valid && validation.booking && validation.checkInRecord) {
      setCatchDialog({ 
        open: true, 
        checkInRecord: validation.checkInRecord,
        booking: validation.booking
      })
      setIsProcessing(true)
    } else if (!validation.valid) {
      setErrorDialog({
        open: true,
        title: '❌ Cannot Record Catch',
        message: validation.error || 'Please scan a QR code from a user who is currently checked in.',
        type: 'error'
      })
    }
  }

  const handleCheckIn = async () => {
    if (!checkInDialog.booking || !user) return

    try {
      const checkInRecord = checkInUser(checkInDialog.booking, user.email, notes)
      
      setScanResults(prev => prev.map((result, index) => 
        index === 0 ? { ...result, status: 'success' as const, userName: 'Checked In' } : result
      ))

      refreshData()
      setCheckInDialog({ open: false })
      setNotes('')
      setIsProcessing(false)

      alert(`✅ Check-in successful!\n${checkInDialog.booking.pond.name}\nSeats: ${checkInDialog.booking.seats.map((s: { id: number; row: string; number: number }) => s.number).join(', ')}`)

    } catch (error) {
      console.error('Check-in error:', error)
      alert('❌ Check-in failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleQRCheckOut = async () => {
    if (!checkOutDialog.checkInRecord || !user) return

    try {
      const success = checkOutUser(checkOutDialog.checkInRecord.id, user.email)
      
      if (success) {
        setScanResults(prev => prev.map((result, index) => 
          index === 0 ? { ...result, status: 'success' as const, userName: 'Checked Out' } : result
        ))

        refreshData()
        setCheckOutDialog({ open: false })
        setIsProcessing(false)

        alert(`✅ Check-out successful!\n${checkOutDialog.booking?.pond.name}\nSeats: ${checkOutDialog.booking?.seats?.map((s: { id: number; row: string; number: number }) => s.number).join(', ')}`)
      } else {
        throw new Error('Check-out operation failed')
      }

    } catch (error) {
      console.error('Check-out error:', error)
      alert('❌ Check-out failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleRecordCatch = async () => {
    if (!catchDialog.checkInRecord || !user) return

    console.log('=== CATCH RECORDING DEBUG ===')
    console.log('catchDialog.booking:', catchDialog.booking)
    console.log('catchDialog.booking?.event:', catchDialog.booking?.event)
    console.log('catchDialog.booking?.event?.id:', catchDialog.booking?.event?.id)
    console.log('catchDialog.booking?.event?.name:', catchDialog.booking?.event?.name)
    console.log('catchDialog.booking?.userId:', catchDialog.booking?.userId)
    console.log('==============================')

    try {
      const weight = parseFloat(catchData.weight)
      const length = parseFloat(catchData.length)

      if (isNaN(weight) || weight <= 0) {
        alert('Please enter a valid weight')
        return
      }

      if (isNaN(length) || length <= 0) {
        alert('Please enter a valid length')
        return
      }

      if (!catchData.species.trim()) {
        alert('Please enter the fish species')
        return
      }

      const newCatch = recordCatch({
        userId: catchDialog.booking?.userId || 0, // Get actual user ID from booking
        userName: catchDialog.checkInRecord.userName || catchDialog.checkInRecord.userEmail || 'Unknown User',
        userEmail: catchDialog.checkInRecord.userEmail || '',
        bookingId: catchDialog.checkInRecord.bookingId,
        eventId: catchDialog.booking?.event?.id, // Add event ID if this is an event booking
        eventName: catchDialog.booking?.event?.name, // Add event name if this is an event booking
        pondId: catchDialog.checkInRecord.pond.id,
        pondName: catchDialog.checkInRecord.pond.name,
        gameId: catchDialog.booking?.games?.[0]?.id || 0, // Assuming first game for simplicity
        fishWeight: weight,
        fishLength: length,
        fishSpecies: catchData.species.trim(),
        catchTime: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        recordedBy: user.email,
        isVerified: false,
        verified: false,
        notes: catchData.notes.trim()
      })

      if (newCatch && newCatch.id) {
        setScanResults(prev => prev.map((result, index) => 
          index === 0 ? { ...result, status: 'success' as const, userName: 'Catch Recorded' } : result
        ))

        setCatchDialog({ open: false })
        setCatchData({ weight: '', length: '', species: '', notes: '' })
        setIsProcessing(false)

        alert(`🐟 Catch recorded successfully!\nSpecies: ${catchData.species}\nWeight: ${weight}kg\nLength: ${length}cm`)
      } else {
        throw new Error('Catch recording failed')
      }

    } catch (error) {
      console.error('Catch recording error:', error)
      alert('❌ Failed to record catch. Please try again.')
      setIsProcessing(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(() => {})
        qrScannerRef.current = null
      }
    }
  }, [])

  return (
    <AuthGuard requiredRole="manager">
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
                  <h1 className="text-lg font-bold text-gray-900">Multi-Function Scanner</h1>
                  <p className="text-xs text-gray-500">Check-in • Check-out • Catch Recording</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={refreshData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Badge variant={isScanning ? "default" : "secondary"}>
                  {isScanning ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          {/* Live Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <Card>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-green-600">{stats.currentlyCheckedIn}</div>
                <div className="text-xs text-gray-600">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-blue-600">{stats.totalToday}</div>
                <div className="text-xs text-gray-600">Today</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-orange-600">{stats.totalCheckOuts}</div>
                <div className="text-xs text-gray-600">Out</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <div className="text-lg font-bold text-red-600">{stats.noShows}</div>
                <div className="text-xs text-gray-600">No-Show</div>
              </CardContent>
            </Card>
          </div>

          {/* Current Scan Result */}
          {currentScan && (
            <Card className={`mb-4 border-2 ${
              currentScan.valid 
                ? currentScan.alreadyCheckedIn
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {currentScan.valid ? (
                    currentScan.alreadyCheckedIn ? (
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    )
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-lg">
                      {currentScan.valid 
                        ? currentScan.alreadyCheckedIn 
                          ? activeTab === 'checkin' ? 'Already Checked In' : 'Ready for Action'
                          : 'Valid Ticket'
                        : 'Invalid Ticket'
                      }
                    </div>
                    {currentScan.booking && (
                      <>
                        <div className="text-sm text-gray-600">
                          {currentScan.booking.bookingId} • {currentScan.booking.pond.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Seats: {currentScan.booking.seats.map(s => s.number).join(', ')}
                        </div>
                        {currentScan.checkIn && (
                          <div className="text-xs text-gray-500">
                            Checked in: {new Date(currentScan.checkIn.checkInTime).toLocaleTimeString()}
                          </div>
                        )}
                      </>
                    )}
                    {currentScan.error && (
                      <div className="text-sm text-red-600">{currentScan.error}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabbed Scanner */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  QR Scanner
                </div>
                <div className="flex items-center gap-1">
                  {cameraStatus === 'checking' && (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin text-gray-400" />
                      <span className="text-xs text-gray-500">Checking...</span>
                    </>
                  )}
                  {cameraStatus === 'available' && isScanning && (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600">Camera Ready</span>
                    </>
                  )}
                  {cameraStatus === 'unavailable' && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-red-600">No Camera</span>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'checkin' | 'checkout' | 'catch')} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="checkin" className="text-xs" disabled={isScanning}>
                    <UserCheck className="h-3 w-3 mr-1" />
                    Check In
                  </TabsTrigger>
                  <TabsTrigger value="checkout" className="text-xs" disabled={isScanning}>
                    <UserX className="h-3 w-3 mr-1" />
                    Check Out
                  </TabsTrigger>
                  <TabsTrigger value="catch" className="text-xs" disabled={isScanning}>
                    <Fish className="h-3 w-3 mr-1" />
                    Add Catch
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="checkin" className="mt-4">
                  <div className="text-center text-sm text-gray-600 mb-4">
                    📥 Scan QR codes to check users into their bookings
                  </div>
                </TabsContent>
                
                <TabsContent value="checkout" className="mt-4">
                  <div className="text-center text-sm text-gray-600 mb-4">
                    📤 Scan QR codes to check users out of their sessions
                  </div>
                </TabsContent>
                
                <TabsContent value="catch" className="mt-4">
                  <div className="text-center text-sm text-gray-600 mb-4">
                    🐟 Scan QR codes to record catches for checked-in users
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Camera View */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <div 
                  id="qr-reader" 
                  className="w-full h-full"
                  style={{
                    backgroundColor: '#000',
                    minHeight: '300px'
                  }}
                ></div>
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <CameraOff className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-400">Camera not active</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activeTab === 'checkin' && 'Ready for check-ins'}
                        {activeTab === 'checkout' && 'Ready for check-outs'}
                        {activeTab === 'catch' && 'Ready for catch recording'}
                      </p>
                    </div>
                  </div>
                )}
                {isScanning && (
                  <style jsx global>{`
                    #qr-reader {
                      background: #000 !important;
                    }
                    #qr-reader video {
                      width: 100% !important;
                      height: auto !important;
                      max-height: 100% !important;
                    }
                    #qr-reader__dashboard {
                      background: rgba(0, 0, 0, 0.8) !important;
                      color: white !important;
                      padding: 10px !important;
                    }
                    #qr-reader__dashboard button {
                      background: #3b82f6 !important;
                      color: white !important;
                      border: none !important;
                      padding: 8px 16px !important;
                      border-radius: 6px !important;
                      margin: 4px !important;
                      cursor: pointer !important;
                    }
                    #qr-reader__dashboard button:hover {
                      background: #2563eb !important;
                    }
                    #qr-reader__dashboard_section {
                      color: white !important;
                    }
                    #qr-reader__dashboard_section_csr {
                      color: white !important;
                    }
                  `}</style>
                )}
              </div>

              {/* Scanner Controls */}
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button onClick={startScanning} className="flex-1" disabled={cameraStatus === 'unavailable'}>
                    <Camera className="h-4 w-4 mr-2" />
                    {cameraStatus === 'checking' ? 'Checking Camera...' : 
                     cameraStatus === 'unavailable' ? 'No Camera Found' :
                     `Start ${activeTab === 'checkin' ? 'Check-In' : activeTab === 'checkout' ? 'Check-Out' : 'Catch'} Scanner`}
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="outline" className="flex-1">
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Scans */}
          {scanResults.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scanResults.slice(0, 5).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : result.status === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            {result.bookingId || 'Invalid'}
                            {result.action === 'checkin' && <UserCheck className="h-3 w-3 text-green-600" />}
                            {result.action === 'checkout' && <UserX className="h-3 w-3 text-orange-600" />}
                            {result.action === 'catch' && <Fish className="h-3 w-3 text-blue-600" />}
                          </div>
                          <div className="text-xs text-gray-600">
                            {result.pond && result.seats ? 
                              `${result.pond} • ${result.seats.join(', ')}` : 
                              result.error
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{result.timestamp}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Today&apos;s Check-ins ({todayCheckIns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayCheckIns.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No check-ins yet today
                </div>
              ) : (
                <div className="space-y-3">
                  {todayCheckIns.slice(0, 10).map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          checkIn.status === 'checked-in' ? 'bg-green-500' :
                          checkIn.status === 'checked-out' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base text-gray-900 truncate">
                            {checkIn.userName || checkIn.userEmail || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {checkIn.bookingId}
                          </div>
                          <div className="text-sm text-gray-700 truncate">
                            {checkIn.pond.name}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Seats: {checkIn.seats.map(s => s.number).join(', ')}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(checkIn.checkInTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant={
                          checkIn.status === 'checked-in' ? 'default' :
                          checkIn.status === 'checked-out' ? 'secondary' :
                          'destructive'
                        }>
                          {checkIn.status === 'checked-in' ? 'Active' :
                           checkIn.status === 'checked-out' ? 'Complete' :
                           'No-Show'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Check-in Confirmation Dialog */}
        <Dialog open={checkInDialog.open} onOpenChange={(open) => {
          if (!open) {
            setCheckInDialog({ open: false })
            setNotes('')
            setIsProcessing(false)
          }
        }}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                Confirm Check-in
              </DialogTitle>
            </DialogHeader>
            {checkInDialog.booking && (
              <div className="space-y-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="font-medium">{checkInDialog.booking.bookingId}</div>
                  <div className="text-sm text-gray-600">{checkInDialog.booking.pond.name}</div>
                  <div className="text-sm text-gray-600">
                    Seats: {checkInDialog.booking.seats.map((s: { id: number; row: string; number: number }) => s.number).join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {checkInDialog.booking.timeSlot.time}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <Input
                    placeholder="Any notes about this check-in..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCheckInDialog({ open: false })}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCheckIn} className="flex-1">
                    <UserCheck className="h-4 w-4 mr-1" />
                    Check In
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Check-out Confirmation Dialog */}
        <Dialog open={checkOutDialog.open} onOpenChange={(open) => {
          if (!open) {
            setCheckOutDialog({ open: false })
            setIsProcessing(false)
          }
        }}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-orange-600" />
                Confirm Check-out
              </DialogTitle>
            </DialogHeader>
            {checkOutDialog.booking && checkOutDialog.checkInRecord && (
              <div className="space-y-4">
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="font-medium">{checkOutDialog.booking.bookingId}</div>
                  <div className="text-sm text-gray-600">{checkOutDialog.booking.pond.name}</div>
                  <div className="text-sm text-gray-600">
                    Seats: {checkOutDialog.booking.seats.map((s: { id: number; row: string; number: number }) => s.number).join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    Checked in: {new Date(checkOutDialog.checkInRecord.checkInTime).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    ✅ User will be checked out and seats will become available for new bookings.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCheckOutDialog({ open: false })}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleQRCheckOut} className="flex-1 bg-orange-600 hover:bg-orange-700">
                    <UserX className="h-4 w-4 mr-1" />
                    Check Out
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Catch Recording Dialog */}
        <Dialog open={catchDialog.open} onOpenChange={(open) => {
          if (!open) {
            setCatchDialog({ open: false })
            setCatchData({ weight: '', length: '', species: '', notes: '' })
            setIsProcessing(false)
          }
        }}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-blue-600" />
                Record Catch
              </DialogTitle>
            </DialogHeader>
            {catchDialog.booking && catchDialog.checkInRecord && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium">{catchDialog.booking.bookingId}</div>
                  <div className="text-sm text-gray-600">{catchDialog.booking.pond.name}</div>
                  <div className="text-sm text-gray-600">
                    Seats: {catchDialog.booking.seats.map((s: { id: number; row: string; number: number }) => s.number).join(', ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    User: {catchDialog.checkInRecord.userName || catchDialog.checkInRecord.userEmail}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        Weight (kg) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={catchData.weight}
                        onChange={(e) => setCatchData(prev => ({ ...prev, weight: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Length (cm) *
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={catchData.length}
                        onChange={(e) => setCatchData(prev => ({ ...prev, length: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Species *</label>
                    <Input
                      placeholder="e.g., Carp, Bass, Pike..."
                      value={catchData.species}
                      onChange={(e) => setCatchData(prev => ({ ...prev, species: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <Input
                      placeholder="Additional details..."
                      value={catchData.notes}
                      onChange={(e) => setCatchData(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    🏆 This catch will be recorded for leaderboard rankings and personal records.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCatchDialog({ open: false })}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRecordCatch} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Fish className="h-4 w-4 mr-1" />
                    Record Catch
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Error Dialog */}
        <Dialog open={errorDialog.open} onOpenChange={(open) => {
          if (!open) {
            setErrorDialog({ open: false, title: '', message: '', type: 'error' })
            setCurrentScan(null)
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${
                errorDialog.type === 'warning' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                {errorDialog.title}
              </DialogTitle>
            </DialogHeader>
            <div className={`p-4 rounded-lg ${
              errorDialog.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`text-sm whitespace-pre-line ${
                errorDialog.type === 'warning' ? 'text-yellow-800' : 'text-red-700'
              }`}>
                {errorDialog.message}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setErrorDialog({ open: false, title: '', message: '', type: 'error' })
                  setCurrentScan(null)
                }}
                className="w-full"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ManagerNavigation />
      </div>
    </AuthGuard>
  )
}
