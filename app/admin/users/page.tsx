'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Settings, 
  MoreVertical,
  ArrowLeft,
  LogOut,
  Fish
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from "@/components/AdminNavigation"
import { useAuth } from "@/lib/auth"
import { getAllUsers, updateUserStatus, updateUserRole, logout } from "@/lib/auth"
import type { User } from "@/lib/auth"
import { useRouter } from 'next/navigation'

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const { user: currentUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = getAllUsers()
    setUsers(allUsers)
  }

  const handleStatusToggle = (userId: number, currentStatus: boolean) => {
    const success = updateUserStatus(userId, !currentStatus)
    if (success) {
      loadUsers()
    }
  }

  const handleRoleChange = (userId: number, newRole: 'user' | 'manager' | 'admin') => {
    const success = updateUserRole(userId, newRole)
    if (success) {
      loadUsers()
      setIsRoleDialogOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Settings
      case 'manager': return Shield
      default: return Users
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <Link href="/admin/dashboard">
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">User Management</h1>
                    <p className="text-xs text-gray-500 truncate">Manage user accounts and permissions</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 pb-24">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">User Accounts</TabsTrigger>
              <TabsTrigger value="activity">User Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.isActive).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'admin' || u.role === 'manager').length}
                    </div>
                    <div className="text-sm text-gray-600">Staff Members</div>
                  </CardContent>
                </Card>
              </div>

              {/* Users List */}
              <Card>
                <CardHeader>
                  <CardTitle>User Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => {
                      const RoleIcon = getRoleIcon(user.role)
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <RoleIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                              <p className="text-sm text-gray-600 truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className={getRoleBadgeColor(user.role)}>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                                <Badge variant={user.isActive ? "default" : "secondary"}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Status Toggle */}
                            <Button
                              variant={user.isActive ? "destructive" : "default"}
                              size="sm"
                              className="w-10 h-10 p-0"
                              onClick={() => handleStatusToggle(user.id, user.isActive)}
                              disabled={user.id === currentUser?.id} // Can't deactivate yourself
                              title={user.isActive ? "Deactivate user" : "Activate user"}
                            >
                              {user.isActive ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>

                            {/* Role Change */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-10 h-10 p-0"
                                  onClick={() => setSelectedUser(user)}
                                  disabled={user.id === currentUser?.id} // Can't change your own role
                                  title="Change user role"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[95vw] max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Change User Role</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      Changing role for: <strong>{user.name}</strong>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Current role: <strong>{user.role}</strong>
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Button
                                      variant={user.role === 'user' ? "default" : "outline"}
                                      className="w-full justify-start text-left h-auto py-3"
                                      onClick={() => handleRoleChange(user.id, 'user')}
                                    >
                                      <div className="flex items-start gap-2">
                                        <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <div className="font-medium">End User</div>
                                          <div className="text-xs opacity-70">Basic access to booking and events</div>
                                        </div>
                                      </div>
                                    </Button>
                                    <Button
                                      variant={user.role === 'manager' ? "default" : "outline"}
                                      className="w-full justify-start text-left h-auto py-3"
                                      onClick={() => handleRoleChange(user.id, 'manager')}
                                    >
                                      <div className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <div className="font-medium">Pond Manager</div>
                                          <div className="text-xs opacity-70">Manage ponds and events</div>
                                        </div>
                                      </div>
                                    </Button>
                                    <Button
                                      variant={user.role === 'admin' ? "default" : "outline"}
                                      className="w-full justify-start text-left h-auto py-3"
                                      onClick={() => handleRoleChange(user.id, 'admin')}
                                    >
                                      <div className="flex items-start gap-2">
                                        <Settings className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <div className="font-medium">Super Admin</div>
                                          <div className="text-xs opacity-70">Full system access</div>
                                        </div>
                                      </div>
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>User activity tracking will be implemented here</p>
                    <p className="text-sm">Login history, actions, bookings, etc.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
