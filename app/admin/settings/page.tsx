'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Fish, Calendar, Users, Database, Shield, RefreshCw } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useAuth, getAllUsers, User } from '@/lib/auth'
import { getPondsWithStats, getEventsWithStats } from '@/lib/localStorage'
import type { Pond, Event } from '@/types'

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const [ponds, setPonds] = useState<(Pond & { totalBookings: number; currentOccupancy: number; revenue: number })[]>([])
  const [events, setEvents] = useState<(Event & { participants: number; revenue: number; availableSpots: number })[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadData = () => {
    setIsLoading(true)
    try {
      const allPonds = getPondsWithStats()
      const allEvents = getEventsWithStats()
      const allUsers = getAllUsers()
      
      setPonds(allPonds)
      setEvents(allEvents)
      setUsers(allUsers)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const refreshData = () => {
    loadData()
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Settings</h1>
                  <p className="text-xs text-gray-500">System management and configuration</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={refreshData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          {/* Management Section */}
          <div className="space-y-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">Management</h2>
            
            <div className="space-y-0">
              {/* Ponds Management */}
              <div className="mb-4">
                <Link href="/admin/ponds">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Fish className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Ponds Management</h3>
                            <p className="text-sm text-gray-600">Manage fishing ponds and seating</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{ponds.length}</div>
                          <div className="text-xs text-gray-500">Total Ponds</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Events Management */}
              <div className="mb-4">
                <Link href="/admin/events">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <Calendar className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Events Management</h3>
                            <p className="text-sm text-gray-600">Manage fishing competitions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{events.length}</div>
                          <div className="text-xs text-gray-500">Total Events</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* User Management */}
              <div>
                <Link href="/admin/users">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Users className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">User Management</h3>
                            <p className="text-sm text-gray-600">Manage user accounts and roles</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{users.length}</div>
                          <div className="text-xs text-gray-500">Total Users</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>

          {/* System Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">System</h2>
            
            <div className="space-y-0">
              {/* Database Management */}
              <div className="mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Database className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Database Management</h3>
                          <p className="text-sm text-gray-600">Backup and maintenance tools</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Local Storage</div>
                        <div className="text-xs text-gray-500">Ready</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Security */}
              <div>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <Shield className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">System Security</h3>
                          <p className="text-sm text-gray-600">Security settings and logs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-600">Secure</div>
                        <div className="text-xs text-gray-500">Active</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
