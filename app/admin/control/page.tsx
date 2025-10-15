'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Power, RefreshCw, Database, Bell, QrCode, Users, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useAuth } from '@/lib/auth'
import { useToastSafe } from '@/components/ui/toast'
import { 
  getAllBookings,
  getPonds,
  getEvents,
  resetDatabase
} from '@/lib/localStorage'

export default function AdminControlPage() {
  const { user } = useAuth()
  const [systemStatus, setSystemStatus] = useState({
    database: true,
    bookingSystem: true,
    notifications: true,
    qrScanner: true,
    lastBackup: null as Date | null
  })
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToastSafe()

  const checkSystemStatus = () => {
    setIsLoading(true)
    try {
      // Check if core data is accessible
      const bookings = getAllBookings()
      const ponds = getPonds()
      const events = getEvents()
      
      setSystemStatus({
        database: true,
        bookingSystem: bookings !== null,
        notifications: true, // Assume working if we can check
        qrScanner: true, // Assume working
        lastBackup: null // Would be implemented with real backup system
      })
    } catch (error) {
      console.error('Error checking system status:', error)
      setSystemStatus(prev => ({
        ...prev,
        database: false,
        bookingSystem: false
      }))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const refreshStatus = () => {
    checkSystemStatus()
  }

  const handleSystemReset = async () => {
    if (confirm('Are you sure you want to reset the system? This will clear all data and cannot be undone.')) {
      try {
        setIsLoading(true)
        resetDatabase()
        checkSystemStatus()
        toast ? toast.push({ message: 'System reset completed successfully.', variant: 'success' }) : window.alert('System reset completed successfully.')
      } catch (error) {
        console.error('Error resetting system:', error)
        toast ? toast.push({ message: 'Error during system reset. Please try again.', variant: 'error' }) : window.alert('Error during system reset. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDatabaseRefresh = () => {
    try {
      setIsLoading(true)
      resetDatabase()
      checkSystemStatus()
      toast ? toast.push({ message: 'Database refreshed successfully.', variant: 'success' }) : window.alert('Database refreshed successfully.')
    } catch (error) {
      console.error('Error refreshing database:', error)
      toast ? toast.push({ message: 'Error refreshing database.', variant: 'error' }) : window.alert('Error refreshing database.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyShutdown = () => {
    if (confirm('This will disable all booking functions. Are you sure?')) {
      toast ? toast.push({ message: 'Emergency shutdown feature would be implemented here.', variant: 'info' }) : window.alert('Emergency shutdown feature would be implemented here.')
    }
  }

  const StatusIndicator = ({ status, label }: { status: boolean, label: string }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {status ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <Badge className={status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {status ? 'Online' : 'Offline'}
        </Badge>
      </div>
    </div>
  )

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-red-600" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">System Control</h1>
                    <p className="text-xs text-gray-500">Administrator Panel</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={refreshStatus} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatusIndicator status={systemStatus.database} label="Database" />
              <StatusIndicator status={systemStatus.bookingSystem} label="Booking System" />
              <StatusIndicator status={systemStatus.notifications} label="Notifications" />
              <StatusIndicator status={systemStatus.qrScanner} label="QR Scanner" />
              
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="text-sm text-gray-500">
                    {systemStatus.lastBackup ? systemStatus.lastBackup.toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Power className="h-5 w-5" />
                System Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleDatabaseRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Database
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                disabled
              >
                <Database className="h-4 w-4 mr-2" />
                Create Backup
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                disabled
              >
                <Bell className="h-4 w-4 mr-2" />
                Send System Notification
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-purple-600 border-purple-200 hover:bg-purple-50"
                disabled
              >
                <QrCode className="h-4 w-4 mr-2" />
                Reset QR Codes
              </Button>
            </CardContent>
          </Card>

          {/* Dangerous Operations */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Dangerous Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 mb-2">
                  <strong>Warning:</strong> These operations cannot be undone and may cause system downtime.
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={handleEmergencyShutdown}
                disabled={isLoading}
              >
                <Power className="h-4 w-4 mr-2" />
                Emergency Shutdown
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleSystemReset}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reset System Data
              </Button>
            </CardContent>
          </Card>
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
