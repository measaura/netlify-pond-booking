'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Fish, LogIn, UserPlus, Shield, Users, Cog } from "lucide-react"
import Link from "next/link"
import { login } from "@/lib/auth"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password)
        if (success) {
          // Get the current user to determine redirect
          const user = JSON.parse(localStorage.getItem('authState') || '{}').user
          if (user) {
            // Redirect based on user role
            if (user.role === 'admin') {
              router.push('/admin/dashboard')
            } else if (user.role === 'manager') {
              router.push('/manager/dashboard') // Direct to manager dashboard
            } else {
              router.push('/dashboard') // Regular users go to dashboard
            }
          } else {
            router.push('/dashboard')
          }
        } else {
          setError('Invalid email or password')
        }
      } else {
        // Registration logic would go here
        setError('Registration not implemented in this demo')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { email: 'user1@fishing.com', role: 'End User', icon: Users, color: 'bg-blue-100 text-blue-800' },
    { email: 'manager1@fishing.com', role: 'Pond Manager', icon: Shield, color: 'bg-green-100 text-green-800' },
    { email: 'admin@fishing.com', role: 'Super Admin', icon: Cog, color: 'bg-purple-100 text-purple-800' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Fish className="h-12 w-12 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FishComp</h1>
              <p className="text-sm text-gray-500">Competition Management</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Welcome back! Please sign in to continue.' : 'Create your account to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo Accounts</CardTitle>
            <CardDescription>
              Use these accounts to test different user roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoUsers.map((user) => (
              <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <user.icon className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    <Badge variant="secondary" className={user.color}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, email: user.email, password: '123456@$' })}
                >
                  Use
                </Button>
              </div>
            ))}
            <div className="text-xs text-gray-500 text-center mt-4">
              Password for all demo accounts: <code className="bg-gray-100 px-2 py-1 rounded">123456@$</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
