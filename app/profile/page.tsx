'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, User, Shield, Database, LogOut, Trophy, Fish, Settings as SettingsIcon } from "lucide-react"
import Link from "next/link"
import { useAuth } from '@/lib/auth'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Role-specific features
  const getRoleFeatures = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Admin Settings',
          subtitle: 'System administration',
          backUrl: '/admin/dashboard',
          features: [
            { label: 'User Management', url: '/admin/users', icon: User },
            { label: 'System Reports', url: '/admin/reports', icon: Database },
            { label: 'Competition Management', url: '/admin/dashboard', icon: Trophy }
          ]
        }
      case 'manager':
        return {
          title: 'Manager Settings',
          subtitle: 'Venue management',
          backUrl: '/manager/dashboard',
          features: [
            { label: 'Pond Monitor', url: '/admin/monitor', icon: Fish },
            { label: 'QR Scanner', url: '/scanner', icon: Shield },
            { label: 'Business Reports', url: '/manager/reports', icon: Database }
          ]
        }
      default:
        return {
          title: 'Settings',
          subtitle: 'Account preferences',
          backUrl: '/',
          features: []
        }
    }
  }

  const roleInfo = getRoleFeatures()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href={roleInfo.backUrl}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{roleInfo.title}</h1>
                <p className="text-xs text-gray-500">{roleInfo.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* Profile Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/default-avatar.png" />
                  <AvatarFallback className="text-lg">
                    {user?.name?.charAt(0) || user?.role?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{user?.name || 'User'}</h3>
                  <p className="text-sm text-gray-600 capitalize">{user?.role || 'user'}</p>
                  <p className="text-xs text-green-600">Active</p>
                </div>
              </div>
              
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

          {/* Role-specific Tools */}
          {roleInfo.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {user?.role === 'admin' ? 'Admin Tools' : 'Manager Tools'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {roleInfo.features.map((feature, index) => {
                  const IconComponent = feature.icon
                  return (
                    <Link key={index} href={feature.url}>
                      <Button variant="outline" className="w-full justify-start">
                        <IconComponent className="h-4 w-4 mr-2" />
                        {feature.label}
                      </Button>
                    </Link>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Account Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Account Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <SettingsIcon className="h-4 w-4 mr-2" />
                App Settings
              </Button>
            </CardContent>
          </Card>

          {/* Admin Access for Managers who are also Admins */}
          {user?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Admin Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/dashboard">
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
              </CardContent>
            </Card>
          )}

          {/* Logout Section */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogout}
                variant="destructive"
                className="w-full flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                You&apos;ll be redirected to the login page
              </p>
            </CardContent>
          </Card>
        </div>

        {user?.role === 'user' && <BottomNavigation />}
      </div>
    </AuthGuard>
  )
}