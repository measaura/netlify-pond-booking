'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Database, RefreshCw, Trash2, Download, Upload } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"

export default function DatabaseUtilsPage() {
  const [message, setMessage] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [checkIns, setCheckIns] = useState<any[]>([])

  // Ensure we're on the client side before using localStorage functions
  useEffect(() => {
    setIsClient(true)
  }, [])

  const loadStats = async () => {
    const { getCheckInStats, getAllBookings, getTodayCheckIns } = await import('@/lib/localStorage')
    setStats(getCheckInStats())
    setBookings(getAllBookings())
    setCheckIns(getTodayCheckIns())
  }

  // Load statistics when client-side
  useEffect(() => {
    if (isClient) {
      loadStats()
    }
  }, [isClient])

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleResetDatabase = async () => {
    if (!isClient) return
    if (confirm('Are you sure you want to reset the entire database? This will delete all data!')) {
      const { resetDatabase } = await import('@/lib/localStorage')
      resetDatabase()
      showMessage('✅ Database reset successfully with sample data!')
    }
  }

  const handleCreateSampleBookings = async () => {
    if (!isClient) return
    const { createSampleBookings } = await import('@/lib/localStorage')
    createSampleBookings()
    showMessage('✅ Sample bookings created!')
  }

  const handleCreateSampleCheckIns = async () => {
    if (!isClient) return
    const { createSampleCheckIns } = await import('@/lib/localStorage')
    createSampleCheckIns()
    showMessage('✅ Sample check-ins created!')
  }

  const handleClearBookings = async () => {
    if (!isClient) return
    if (confirm('Are you sure you want to clear all bookings?')) {
      const { clearAllBookings } = await import('@/lib/localStorage')
      clearAllBookings()
      showMessage('✅ All bookings cleared!')
    }
  }

  const handleExportData = async () => {
    if (!isClient) return
    const { downloadDatabase } = await import('@/lib/localStorage')
    downloadDatabase()
    showMessage('✅ Complete database exported successfully!')
  }
  
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isClient) return
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const { importDatabase } = await import('@/lib/localStorage')
        const success = importDatabase(content)
        
        if (success) {
          showMessage('✅ Database imported successfully!')
        } else {
          showMessage('❌ Failed to import database. Please check the file format.')
        }
      } catch (error) {
        showMessage('❌ Error reading file: ' + (error as Error).message)
      }
    }
    
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }

  // Show loading state if not client-side or data not loaded
  if (!isClient || !stats) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p>Loading database utilities...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Database Utils</h1>
                <p className="text-xs text-gray-500">Admin tools for testing and development</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Status Message */}
          {message && (
            <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}

          {/* Current Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Current Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{checkIns.length}</div>
                  <div className="text-sm text-gray-600">Today&apos;s Check-ins</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.currentlyCheckedIn}</div>
                  <div className="text-sm text-gray-600">Currently Active</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalCheckOuts}</div>
                  <div className="text-sm text-gray-600">Completed Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Database Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-red-400 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Destructive Actions</h4>
                <div className="space-y-2">
                  <Button 
                    onClick={handleResetDatabase} 
                    variant="destructive"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Entire Database
                  </Button>
                  <Button 
                    onClick={handleClearBookings} 
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Bookings
                  </Button>
                </div>
              </div>

              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Sample Data Creation</h4>
                <div className="space-y-2">
                  <Button 
                    onClick={handleCreateSampleBookings} 
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Create Sample Bookings
                  </Button>
                  <Button 
                    onClick={handleCreateSampleCheckIns} 
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Create Sample Check-ins
                  </Button>
                </div>
              </div>

              <div className="border-l-4 border-blue-400 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">Database Export/Import</h4>
                <div className="space-y-2">
                  <Button 
                    onClick={handleExportData} 
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Complete Database (JSON)
                  </Button>
                  
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                      id="import-database"
                    />
                    <label htmlFor="import-database" className="block">
                      <Button asChild variant="outline" className="w-full">
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Database (JSON)
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Import will replace all current data. Consider exporting first as backup.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold">To test QR scanning:</h4>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 ml-4">
                  <li>Create sample bookings and check-ins above</li>
                  <li>Login as manager: pond.manager@gmail.com / 123456@$</li>
                  <li>Go to Admin → QR Scanner</li>
                  <li>Use &quot;Valid Scan&quot; demo button to simulate scanning</li>
                  <li>Or use real QR codes from the ticket page</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold">To test live monitoring:</h4>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 ml-4">
                  <li>Ensure sample check-ins are created</li>
                  <li>Go to Admin → Live Monitor</li>
                  <li>View real-time pond occupancy</li>
                  <li>Check in/out users via QR Scanner</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
