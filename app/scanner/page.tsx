'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Camera, CameraOff, CheckCircle, XCircle, Users, Clock, MapPin, AlertTriangle, UserCheck, UserX, RefreshCw, Fish, Scale, Target } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { useAuth } from "@/lib/auth"
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { ToastProvider, useToast, useToastSafe } from '@/components/ui/toast'
// Server-backed helpers will replace the previous localStorage-based helpers.
// We use fetch against the API routes implemented on the server.

async function validateQrServer(qrCode: string) {
  const res = await fetch('/api/qr/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrCode })
  })
  if (!res.ok) return { ok: false }
  const json = await res.json()
  return json.data
}

async function createCheckInServer(qrCode: string) {
  const res = await fetch('/api/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrCode })
  })
  return res.json()
}

async function checkoutServer(checkInId: number) {
  const res = await fetch('/api/checkins/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkInId })
  })
  return res.json()
}

async function fetchTodayCheckIns() {
  const res = await fetch('/api/checkins/today')
  if (!res.ok) return []
  const json = await res.json()
  return json.data || []
}

function computeStatsFromCheckIns(checkIns: any[]) {
  const totalToday = checkIns.length
  const currentlyCheckedIn = checkIns.filter((c) => c.status === 'checked-in').length
  const totalCheckOuts = checkIns.filter((c) => c.status === 'checked-out').length
  const noShows = checkIns.filter((c) => c.status === 'no-show').length
  return { currentlyCheckedIn, totalToday, totalCheckOuts, noShows }
}
import type { BookingData, CheckInRecord, QRValidationResult, CatchRecord } from '@/types'
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
}

export default function ScannerPage() {
  const { user } = useAuth()
  // Use safe hook - returns null when provider isn't available during SSR
  const toastCtx = useToastSafe()
  const toast = toastCtx
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMode, setScanMode] = useState<'checkin' | 'checkout' | 'catch'>('checkin')
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [currentScan, setCurrentScan] = useState<QRValidationResult | null>(null)
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false)
  const [checkInDialog, setCheckInDialog] = useState<{ open: boolean; booking?: BookingData; validation?: QRValidationResult }>({ open: false })
  const [checkOutDialog, setCheckOutDialog] = useState<{ open: boolean; checkInRecord?: CheckInRecord; booking?: BookingData }>({ open: false })
  const [catchDialog, setCatchDialog] = useState<{ open: boolean; checkInRecord?: CheckInRecord; booking?: BookingData }>({ open: false })
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string; type: 'error' | 'warning' }>({ open: false, title: '', message: '', type: 'error' })
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInRecord[]>([])
  const [stats, setStats] = useState(() => ({ currentlyCheckedIn: 0, totalToday: 0, totalCheckOuts: 0, noShows: 0 }))
  const [notes, setNotes] = useState('')
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [catchData, setCatchData] = useState({
    weight: '',
    length: '',
    species: '',
    notes: ''
  })

  // Load today's check-ins and stats
  useEffect(() => {
    refreshData()
    checkCameraStatus()
  }, [])

  const checkCameraStatus = async () => {
    setCameraStatus('checking')
    try {
      // Check if MediaDevices API exists first
      if (!navigator.mediaDevices) {
        console.log('MediaDevices API not supported')
        setCameraStatus('unavailable')
        return
      }

      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setCameraStatus(videoDevices.length > 0 ? 'available' : 'unavailable')
    } catch (error) {
      console.error('Camera status check error:', error)
      setCameraStatus('unavailable')
    }
  }

  const startScanning = async () => {
    try {
      setIsScanning(true)
      
      // First request camera permission explicitly
      console.log('Requesting camera permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user", // Front camera for MacBook
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      // Stop the test stream - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      
      console.log('Camera permission granted, starting QR scanner...')
      
      // Initialize HTML5 QR Code Scanner with auto-start
      const scanner = new Html5QrcodeScanner(
        "qr-reader", // This will be the div ID
        {
          fps: 10, // 10 frames per second
          qrbox: { width: 250, height: 250 }, // QR scanning box size
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: "user" // Front camera for MacBook
          },
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: false,
          defaultZoomValueIfSupported: 1,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        false // Verbose logging
      )

      qrScannerRef.current = scanner

      // Success callback
      const onScanSuccess = (decodedText: string) => {
        console.log('QR Code detected:', decodedText)
        handleQRScan(decodedText)
      }

      // Error callback
      const onScanFailure = (error: string) => {
        // Handle scan failures silently - they're very frequent
        // Only log actual errors, not "No QR code found" messages
        if (!error.includes('NotFoundException') && !error.includes('No QR code found')) {
          console.log('QR scan error:', error)
        }
      }

      // Render the scanner - this will automatically start the camera
      scanner.render(onScanSuccess, onScanFailure)
      
      console.log('HTML5 QR Scanner started successfully')
      
    } catch (err) {
      console.error('Error starting QR scanner:', err)
      setIsScanning(false)
      
      const errorMsg = (err as Error).message || String(err)
      
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        toast ? toast.push({ message: 'Camera permission denied. Please allow camera access and try again.', variant: 'error' }) : window.alert('Camera permission denied. Please allow camera access and try again.')
      } else if (errorMsg.includes('NotFoundError')) {
        toast ? toast.push({ message: 'No camera found. Please ensure your device has a working camera.', variant: 'error' }) : window.alert('No camera found. Please ensure your device has a working camera.')
      } else {
        toast ? toast.push({ message: `Scanner error: ${errorMsg}\nPlease try refreshing the page.`, variant: 'error' }) : window.alert(`Scanner error: ${errorMsg}\n\nPlease try refreshing the page.`)
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

  const refreshData = async () => {
    try {
      const items = await fetchTodayCheckIns()
      setTodayCheckIns(items)
      setStats(computeStatsFromCheckIns(items))
    } catch (e) {
      console.error('Failed to refresh check-in data', e)
    }
  }



  // Helper function to check camera availability
  const checkCameraAvailability = async (): Promise<boolean> => {
    try {
      // Check if MediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('MediaDevices API not supported')
        return false
      }

      // Check if we can enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        console.log('No video input devices found')
        return false
      }

      // Try to get camera permission and stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop())
      return true

    } catch (error) {
      console.error('Camera availability check failed:', error)
      return false
    }
  }



  const handleQRScan = async (qrData: string) => {
    if (!user || isProcessingCheckIn) return

    console.log('QR Data scanned:', qrData, 'Mode:', scanMode)
    
    if (scanMode === 'checkin') {
      // Check-in mode - validate via server
      const validation = await validateQrServer(qrData)
      setCurrentScan(validation as any)

      // Create scan result for history
      const scanResult: ScanResult = {
        timestamp: new Date().toLocaleTimeString(),
        valid: !!(validation && validation.seat),
        bookingId: validation?.booking?.bookingId,
        pond: validation?.booking?.pond?.name,
        seats: validation?.booking?.seats?.map((s: any) => String(s.number)),
        error: validation?.error,
        status: validation && validation.checkedIn ? 'warning' : (validation && validation.seat ? 'success' : 'error')
      }

      setScanResults(prev => [scanResult, ...prev.slice(0, 9)]) // Keep last 10 results

      // If valid and not already checked in, show check-in dialog
      if (validation && validation.seat && !validation.checkedIn) {
        setCheckInDialog({
          open: true,
          booking: validation.booking,
          validation: validation
        })
        // Pause scanning while processing
        setIsProcessingCheckIn(true)
      } else if (validation && validation.checkedIn) {
        // User is already checked in - show warning and don't allow re-check-in
        setErrorDialog({
          open: true,
          title: '⚠️ Already Checked In',
          message: 'This user is already checked in!\n\nUse Check-Out mode to check them out first.',
          type: 'warning'
        })
      } else if (!(validation && validation.seat)) {
        // Invalid QR code - show error message
        let enhancedMessage = validation.error || 'Please scan a valid booking QR code.'
        
        // Add booking details for date/time errors
        if ((validation.isWrongTime || validation.isWrongDate) && validation.booking) {
          const bookingDate = new Date((validation as any).booking.date)
          const formattedDate = bookingDate.toLocaleDateString('en-GB') // dd/mm/yyyy format
          
          // Format time slot to 12-hour format
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
          
          enhancedMessage += `\n\n📋 Booking Details:\n• Date: ${formattedDate}\n• Time: ${formattedTimeSlot}\n• Pond: ${(validation as any).booking.pond?.name || 'Unknown'}\n• Seat: ${(validation as any).booking.seats?.map((s: any) => s.number).join(', ') || 'Unknown'}`
        }
        
        setErrorDialog({
          open: true,
          title: validation.isWrongTime ? '⏰ Wrong Time' : validation.isWrongDate ? '📅 Wrong Date' : '❌ Invalid QR Code',
          message: enhancedMessage,
          type: validation.isWrongTime || validation.isWrongDate ? 'warning' : 'error'
        })
      }
    } else {
      // Check-out mode - use checkout validation
  const validation = await validateQrServer(qrData)
      setCurrentScan(validation as any)

      // Create scan result for history
      const scanResult: ScanResult = {
        timestamp: new Date().toLocaleTimeString(),
        valid: !!(validation && validation.seat),
        bookingId: validation?.booking?.bookingId,
        pond: validation?.booking?.pond?.name,
        seats: validation?.booking?.seats?.map((s: any) => String(s.number)),
        error: validation?.error,
        status: validation && validation.checkInRecords && validation.checkInRecords.length > 0 ? 'success' : 'error'
      }

      setScanResults(prev => [scanResult, ...prev.slice(0, 9)]) // Keep last 10 results

      // If valid for checkout, show check-out dialog
      if (validation && validation.checkInRecords && validation.checkInRecords.length > 0) {
        setCheckOutDialog({
          open: true,
          checkInRecord: validation.checkInRecords[0],
          booking: validation.booking
        })
        // Pause scanning while processing
        setIsProcessingCheckIn(true)
      } else if (!(validation && validation.checkInRecords && validation.checkInRecords.length > 0)) {
        // Invalid QR code for checkout - show error message
        setErrorDialog({
          open: true,
          title: '❌ Cannot Check Out',
          message: validation.error || 'Please scan a QR code from a user who is currently checked in.',
          type: 'error'
        })
      }
    }
  }

  const handleCheckIn = async () => {
    if (!checkInDialog.booking || !user) return

    try {
      // Process check-in
      // Process check-in via server
  const qrCode = (checkInDialog.validation as any)?.seat?.qrCode || (checkInDialog.booking?.seats?.[0] as any)?.qrCode
      if (!qrCode) throw new Error('Missing QR code for check-in')
      const resp = await createCheckInServer(qrCode)
      if (!resp || !resp.ok) throw new Error(resp?.error || 'Check-in failed')

      // Update scan result to show success
      setScanResults(prev => prev.map((result, index) => 
        index === 0 ? { ...result, status: 'success' as const, userName: 'Checked In' } : result
      ))

      // Refresh data
      await refreshData()

      // Close dialog
      setCheckInDialog({ open: false })
      setNotes('')
      setIsProcessingCheckIn(false)

  // Show success message
  const checkInMsg = `✅ Check-in successful!\n${checkInDialog.booking.pond.name}\nSeats: ${checkInDialog.booking.seats.map((s: any) => s.number).join(', ')}`
  toast ? toast.push({ message: checkInMsg, variant: 'success', title: 'Check-in' }) : window.alert(checkInMsg)

    } catch (error) {
      console.error('Check-in error:', error)
  toast ? toast.push({ message: '❌ Check-in failed. Please try again.', variant: 'error' }) : window.alert('❌ Check-in failed. Please try again.')
      setIsProcessingCheckIn(false)
    }
  }

  const handleCheckOut = async (checkInId: string) => {
    if (!user) return
    
    try {
      const resp = await checkoutServer(Number(checkInId))
      if (!resp || !resp.ok) throw new Error(resp?.error || 'Check-out failed')
      await refreshData()
  toast ? toast.push({ message: '✅ Check-out successful!', variant: 'success' }) : window.alert('✅ Check-out successful!')
    } catch (e) {
      console.error('Check-out error', e)
  toast ? toast.push({ message: '❌ Check-out failed.', variant: 'error' }) : window.alert('❌ Check-out failed.')
    }
  }

  const handleQRCheckOut = async () => {
    if (!checkOutDialog.checkInRecord || !user) return

    try {
      // Process QR-based check-out
  const resp = await checkoutServer(Number(checkOutDialog.checkInRecord.id))
      if (!resp || !resp.ok) throw new Error(resp?.error || 'Check-out failed')

      // Update scan result to show success
      setScanResults(prev => prev.map((result, index) => 
        index === 0 ? { ...result, status: 'success' as const, userName: 'Checked Out' } : result
      ))

      // Refresh data
      await refreshData()

      // Close dialog
      setCheckOutDialog({ open: false })
      setIsProcessingCheckIn(false)

  const checkOutMsg = `✅ Check-out successful!\n${checkOutDialog.booking?.pond.name}\nSeats: ${checkOutDialog.booking?.seats?.map((s: any) => s.number).join(', ')}`
  toast ? toast.push({ message: checkOutMsg, variant: 'success', title: 'Check-out' }) : window.alert(checkOutMsg)

    } catch (error) {
      console.error('Check-out error:', error)
  toast ? toast.push({ message: '❌ Check-out failed. Please try again.', variant: 'error' }) : window.alert('❌ Check-out failed. Please try again.')
      setIsProcessingCheckIn(false)
    }
  }

  const handleMarkNoShow = async (bookingId: string) => {
    try {
      const res = await fetch('/api/bookings/mark-no-show', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to mark no-show')
      await refreshData()
  toast ? toast.push({ message: 'Marked as no-show', variant: 'info' }) : window.alert('Marked as no-show')
    } catch (e) {
      console.error('Mark no-show failed', e)
  toast ? toast.push({ message: 'Failed to mark no-show', variant: 'error' }) : window.alert('Failed to mark no-show')
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

  // Auto-close valid scan results after 4 seconds
  useEffect(() => {
    if (currentScan && currentScan.valid && !currentScan.alreadyCheckedIn) {
      const timer = setTimeout(() => {
        setCurrentScan(null)
      }, 4000) // 4 seconds

      return () => clearTimeout(timer)
    }
  }, [currentScan])

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
                  <h1 className="text-lg font-bold text-gray-900">QR Scanner</h1>
                  <p className="text-xs text-gray-500">Entry Validation & Check-in</p>
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
                          ? 'Already Checked In'
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

          {/* Camera Scanner */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  QR Code Scanner
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
              {/* Scan Mode Toggle */}
              <div className="mb-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={scanMode === 'checkin' ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex-1 ${scanMode === 'checkin' ? 'bg-green-600 text-white' : 'text-gray-600'}`}
                    onClick={() => setScanMode('checkin')}
                    disabled={isScanning}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                  <Button
                    variant={scanMode === 'checkout' ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex-1 ${scanMode === 'checkout' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}
                    onClick={() => setScanMode('checkout')}
                    disabled={isScanning}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Check Out
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {scanMode === 'checkin' ? '📥 Scan QR codes to check users in' : '📤 Scan QR codes to check users out'}
                </p>
              </div>
              
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                {/* HTML5 QR Scanner will render here */}
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

              <div className="flex gap-2">
                {!isScanning ? (
                  <Button onClick={startScanning} className="flex-1" disabled={cameraStatus === 'unavailable'}>
                    <Camera className="h-4 w-4 mr-2" />
                    {cameraStatus === 'checking' ? 'Checking Camera...' : 
                     cameraStatus === 'unavailable' ? 'No Camera Found' :
                     `Start ${scanMode === 'checkin' ? 'Check-In' : 'Check-Out'} Scanner`}
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
                          <div className="text-sm font-medium">
                            {result.bookingId || 'Invalid'}
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
                          {/* User Name - More Prominent */}
                          <div className="font-semibold text-base text-gray-900 truncate">
                            {checkIn.userName || checkIn.userEmail || 'Unknown User'}
                          </div>
                          {/* Booking ID - Smaller */}
                          <div className="text-xs text-gray-500 truncate">
                            {checkIn.bookingId}
                          </div>
                          {/* Pond Name */}
                          <div className="text-sm text-gray-700 truncate">
                            {checkIn.pond.name}
                          </div>
                          {/* Seats and Time */}
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
            setIsProcessingCheckIn(false)
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
            setIsProcessingCheckIn(false)
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

        {/* Error Dialog - Manual Dismissal Required */}
        <Dialog open={errorDialog.open} onOpenChange={(open) => {
          if (!open) {
            setErrorDialog({ open: false, title: '', message: '', type: 'error' })
            setCurrentScan(null) // Clear scan when dialog is dismissed
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
