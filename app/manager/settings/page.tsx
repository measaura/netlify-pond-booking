'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Shield, Database, LogOut, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { AuthGuard } from "@/components/AuthGuard"
import { useAuth } from "@/lib/auth"
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { logout } from "@/lib/auth"
import { 
  resetDatabase,
  createSampleBookings,
  createSampleCheckIns,
  clearAllBookings
} from "@/lib/localStorage"

export default function ManagerSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState('')

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleCreateSampleData = () => {
    createSampleBookings()
    createSampleCheckIns()
    showMessage('✅ Sample data created successfully!')
  }

  const handleClearBookings = () => {
    if (confirm('Are you sure you want to clear all bookings?')) {
      clearAllBookings()
      showMessage('✅ All bookings cleared!')
    }
  }

  return (
    <AuthGuard requiredRole="manager">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/manager/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Settings</h1>
                <p className="text-xs text-gray-500">Manager preferences & tools</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* Status Message */}
          {message && (
            <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}

          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manager Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Manager Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/manager/monitor">
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Live Pond Monitor
                </Button>
              </Link>
              
              <Link href="/manager/reports">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Business Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleCreateSampleData} 
                variant="outline" 
                className="w-full justify-start"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Create Sample Data
              </Button>
              
              <Button 
                onClick={handleClearBookings} 
                variant="outline" 
                className="w-full justify-start"
              >
                <Database className="h-4 w-4 mr-2" />
                Clear All Bookings
              </Button>
            </CardContent>
          </Card>

          {/* Admin Access (if admin) */}
          {user?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Admin Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin">
                  <Button variant="outline" className="w-full justify-start text-red-600 border-red-200">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
                
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start text-red-600 border-red-200">
                    <User className="h-4 w-4 mr-2" />
                    User Management
                  </Button>
                </Link>
                
                <Link href="/admin/database">
                  <Button variant="outline" className="w-full justify-start text-red-600 border-red-200">
                    <Database className="h-4 w-4 mr-2" />
                    Database Utils
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Logout */}
          <Card>
            <CardContent className="p-4">
              <Button 
                onClick={handleLogout} 
                variant="destructive" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        <ManagerNavigation />
      </div>
    </AuthGuard>
  )
}
