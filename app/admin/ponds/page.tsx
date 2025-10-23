'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Fish, Plus, Edit, Trash2, Power, RefreshCw, Users, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useToastSafe } from '@/components/ui/toast'
// server-backed API calls
async function fetchPonds() {
  const res = await fetch('/api/ponds') // Use public ponds API instead of admin-only
  const json = await res.json()
  return json.ok ? json.data : []
}

async function createPondApi(data: any) {
  const res = await fetch('/api/admin/ponds', { 
    method: 'POST', 
    body: JSON.stringify(data), 
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // Include cookies for auth
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('Create pond failed:', res.status, text)
    return { ok: false, error: text || `HTTP ${res.status}` }
  }
  return await res.json()
}

async function updatePondApi(id: number, data: any) {
  console.log('[updatePondApi] Sending update request for pond:', id)
  console.log('[updatePondApi] Request data:', data)
  console.log('[updatePondApi] Document cookies:', document.cookie)
  
  const res = await fetch('/api/admin/ponds', { 
    method: 'PUT', 
    body: JSON.stringify({ id, ...data }), 
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // Include cookies for auth
  })
  
  console.log('[updatePondApi] Response status:', res.status)
  console.log('[updatePondApi] Response ok:', res.ok)
  
  if (!res.ok) {
    const text = await res.text()
    console.error('[updatePondApi] Update pond failed:', res.status, text)
    return { ok: false, error: text || `HTTP ${res.status}` }
  }
  return await res.json()
}

async function deletePondApi(id: number) {
  const res = await fetch('/api/admin/ponds', { 
    method: 'DELETE', 
    body: JSON.stringify({ id }), 
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // Include cookies for auth
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('Delete pond failed:', res.status, text)
    return { ok: false, error: text || `HTTP ${res.status}` }
  }
  return await res.json()
}
import { Pond } from '@/types'

interface PondFormData {
  name: string
  capacity: number
  price: number
  image: string
  bookingEnabled: boolean
  shape: 'rectangle' | 'square' | 'circle'
  seatingArrangement: number[]
}

export default function PondsManagementPage() {
  const [ponds, setPonds] = useState<(Pond & { totalBookings: number; currentOccupancy: number; revenue: number })[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const toast = useToastSafe()
  
  // Dialog state
  const [isPondDialogOpen, setIsPondDialogOpen] = useState(false)
  const [editingPond, setEditingPond] = useState<Pond | null>(null)
  const [pondFormData, setPondFormData] = useState<PondFormData>({
    name: '',
    capacity: 20,
    price: 40,
    image: '🌊',
    bookingEnabled: true,
    shape: 'rectangle',
    seatingArrangement: [5, 5, 5, 5]
  })

  const loadData = () => {
    setIsLoading(true)
    try {
      fetchPonds().then((ps: any[]) => {
        // Normalize server pond shape to client expected fields
        const normalized = ps.map(p => ({
          id: p.id,
          name: p.name,
          maxCapacity: p.maxCapacity ?? 0,
          capacity: p.maxCapacity ?? 0,
          price: p.price ?? 0,
          image: p.image ?? '🌊',
          bookingEnabled: p.bookingEnabled ?? true,
          shape: (p.shape || 'RECTANGLE').toLowerCase(),
          seatingArrangement: p.seatingArrangement || [5,5,5,5],
          totalBookings: (p.bookings || []).length,
          currentOccupancy: 0,
          revenue: 0,
        }))
        setPonds(normalized)
      })
    } catch (error) {
      console.error('Error loading ponds:', error)
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

  // Filter ponds based on search term
  const filteredPonds = ponds.filter(pond =>
    pond.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate seating arrangement based on capacity and shape - Enhanced auto-calculation
  const calculateSeatingArrangement = (capacity: number, shape: 'rectangle' | 'square' | 'circle'): number[] => {
    if (shape === 'circle') {
      // For circles, all seats go around the perimeter
      return [capacity]
    } else if (shape === 'square') {
      // For squares, distribute seats evenly on all 4 sides
      const perSide = Math.ceil(capacity / 4)
      const remainder = capacity % 4
      
      // Distribute remainder starting from top, then right, then bottom, then left
      const arrangement = [perSide, perSide, perSide, perSide]
      for (let i = 0; i < remainder; i++) {
        arrangement[i]++
      }
      
      // Adjust if we over-allocated due to ceiling
      const total = arrangement.reduce((sum, val) => sum + val, 0)
      if (total > capacity) {
        const excess = total - capacity
        for (let i = 3; i >= 0 && excess > 0; i--) {
          if (arrangement[i] > 0) {
            arrangement[i]--
          }
        }
      }
      
      return arrangement
    } else { // rectangle
      // For rectangles, favor longer sides (top/bottom) over shorter sides (left/right)
      const longSide = Math.ceil(capacity * 0.35) // 35% of capacity on long sides
      const shortSide = Math.floor((capacity - (longSide * 2)) / 2) // remaining split between short sides
      const remainder = capacity - (longSide * 2 + shortSide * 2)
      
      const arrangement = [longSide, shortSide, longSide, shortSide]
      
      // Distribute any remainder to short sides first
      if (remainder > 0) {
        arrangement[1] += Math.ceil(remainder / 2)
        arrangement[3] += Math.floor(remainder / 2)
      }
      
      return arrangement
    }
  }

  const handlePondSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (editingPond) {
        const resp = await updatePondApi(editingPond.id, {
          name: pondFormData.name,
          maxCapacity: pondFormData.capacity,
          price: pondFormData.price,
          seatingArrangement: pondFormData.seatingArrangement,
          shape: pondFormData.shape.toUpperCase(),
          bookingEnabled: pondFormData.bookingEnabled,
        })
        if (resp.ok) toast ? toast.push({ message: 'Pond updated successfully!', variant: 'success' }) : window.alert('Pond updated successfully!')
        else toast ? toast.push({ message: 'Failed to update pond: ' + resp.error, variant: 'error' }) : window.alert('Failed to update pond: ' + resp.error)
      } else {
        const resp = await createPondApi({
          name: pondFormData.name,
          maxCapacity: pondFormData.capacity,
          price: pondFormData.price,
          seatingArrangement: pondFormData.seatingArrangement,
          shape: pondFormData.shape.toUpperCase(),
          bookingEnabled: pondFormData.bookingEnabled,
        })
        if (resp.ok) toast ? toast.push({ message: 'Pond created successfully!', variant: 'success' }) : window.alert('Pond created successfully!')
        else toast ? toast.push({ message: 'Failed to create pond: ' + resp.error, variant: 'error' }) : window.alert('Failed to create pond: ' + resp.error)
      }
      
      setIsPondDialogOpen(false)
      setEditingPond(null)
      resetPondForm()
      loadData()
    } catch (error) {
      console.error('Error saving pond:', error)
      toast ? toast.push({ message: 'Error saving pond. Please try again.', variant: 'error' }) : window.alert('Error saving pond. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePond = async (pondId: number, pondName: string) => {
    if (confirm(`Are you sure you want to delete "${pondName}"? This action cannot be undone.`)) {
      setIsLoading(true)
      try {
        const result = await deletePondApi(pondId)
        if (result.ok) {
          toast ? toast.push({ message: 'Pond deleted successfully!', variant: 'success' }) : window.alert('Pond deleted successfully!')
          loadData()
        } else {
          toast ? toast.push({ message: result.error || 'Failed to delete pond.', variant: 'error' }) : window.alert(result.error || 'Failed to delete pond.')
        }
      } catch (error) {
        console.error('Error deleting pond:', error)
        toast ? toast.push({ message: 'Error deleting pond. Please try again.', variant: 'error' }) : window.alert('Error deleting pond. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleTogglePondBooking = async (pondId: number) => {
    setIsLoading(true)
    try {
      // Toggle via PUT
      const pond = ponds.find(p => p.id === pondId)
      if (!pond) throw new Error('Pond not found')
      const resp = await updatePondApi(pondId, { bookingEnabled: !pond.bookingEnabled })
      if (resp.ok) loadData()
      else toast ? toast.push({ message: 'Failed to toggle pond booking status: ' + resp.error, variant: 'error' }) : window.alert('Failed to toggle pond booking status: ' + resp.error)
    } catch (error) {
      console.error('Error toggling pond booking:', error)
      toast ? toast.push({ message: 'Error updating pond status. Please try again.', variant: 'error' }) : window.alert('Error updating pond status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelAllBookings = async (pondId: number, pondName: string) => {
    if (confirm(`Are you sure you want to cancel ALL bookings for "${pondName}"? This action cannot be undone and will affect all users with bookings.`)) {
      setIsLoading(true)
      try {
        toast ? toast.push({ message: 'Cancel all bookings is not implemented on server yet.', variant: 'info' }) : window.alert('Cancel all bookings is not implemented on server yet.')
      } catch (error) {
        console.error('Error canceling bookings:', error)
        toast ? toast.push({ message: 'Error canceling bookings. Please try again.', variant: 'error' }) : window.alert('Error canceling bookings. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const resetPondForm = () => {
    const defaultCapacity = 20
    const defaultShape = 'rectangle'
    setPondFormData({
      name: '',
      capacity: defaultCapacity,
      price: 40,
      image: '🌊',
      bookingEnabled: true,
      shape: defaultShape,
      seatingArrangement: calculateSeatingArrangement(defaultCapacity, defaultShape)
    })
  }

  const openPondDialog = (pond?: Pond) => {
    if (pond) {
      setEditingPond(pond)
      setPondFormData({
        name: pond.name,
        capacity: (pond as any).maxCapacity ?? (pond as any).capacity ?? 20,
        price: pond.price,
        image: pond.image,
        bookingEnabled: pond.bookingEnabled,
        shape: pond.shape,
        seatingArrangement: pond.seatingArrangement
      })
    } else {
      setEditingPond(null)
      resetPondForm()
      // Auto-calculate seating arrangement for new pond with default values
      const defaultCapacity = 20
      const defaultShape = 'rectangle'
      const autoArrangement = calculateSeatingArrangement(defaultCapacity, defaultShape)
      setPondFormData(prev => ({ 
        ...prev, 
        seatingArrangement: autoArrangement
      }))
    }
    setIsPondDialogOpen(true)
  }

  // Update seating arrangement when capacity or shape changes
  const handleCapacityChange = (newCapacity: number) => {
    const newArrangement = calculateSeatingArrangement(newCapacity, pondFormData.shape)
    setPondFormData(prev => ({
      ...prev,
      capacity: newCapacity,
      seatingArrangement: newArrangement
    }))
  }

  const handleShapeChange = (newShape: 'rectangle' | 'square' | 'circle') => {
    const newArrangement = calculateSeatingArrangement(pondFormData.capacity, newShape)
    setPondFormData(prev => ({
      ...prev,
      shape: newShape,
      seatingArrangement: newArrangement
    }))
  }

  const handleSeatingArrangementChange = (index: number, value: number) => {
    const newArrangement = [...pondFormData.seatingArrangement]
    newArrangement[index] = value
    
    // Calculate new total capacity
    const newCapacity = newArrangement.reduce((sum, val) => sum + val, 0)
    
    setPondFormData(prev => ({
      ...prev,
      seatingArrangement: newArrangement,
      capacity: newCapacity
    }))
  }

  const totalRevenue = ponds.reduce((sum, pond) => sum + pond.revenue, 0)
  const totalBookings = ponds.reduce((sum, pond) => sum + pond.totalBookings, 0)
   const totalCapacity = ponds.reduce((sum, pond) => sum + ((pond as any).maxCapacity ?? 0), 0)
  const currentOccupancy = ponds.reduce((sum, pond) => sum + pond.currentOccupancy, 0)

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <Link href="/admin/settings">
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2 min-w-0">
                  <Fish className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">Ponds Management</h1>
                    <p className="text-xs text-gray-500 truncate">Manage all fishing ponds</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={refreshData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => openPondDialog()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Fish className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{ponds.length}</div>
                <div className="text-xs text-gray-600">Total Ponds</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{totalCapacity}</div>
                <div className="text-xs text-gray-600">Total Capacity</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{totalBookings}</div>
                <div className="text-xs text-gray-600">Total Bookings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">${totalRevenue}</div>
                <div className="text-xs text-gray-600">Total Revenue</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search ponds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Ponds List */}
          <div className="space-y-4">
            {filteredPonds.map(pond => (
              <Card key={pond.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="text-2xl flex-shrink-0">{pond.image}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{pond.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={pond.bookingEnabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {pond.bookingEnabled ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-sm text-gray-500 capitalize">{pond.shape} pond</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPondDialog(pond)}
                          className="h-8 w-8 p-0"
                          title="Edit pond"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePondBooking(pond.id)}
                          className={`h-8 w-8 p-0 ${pond.bookingEnabled ? 'text-red-600' : 'text-green-600'}`}
                          title={pond.bookingEnabled ? 'Disable booking' : 'Enable booking'}
                        >
                          <Power className="h-3 w-3" />
                        </Button>
                        {pond.totalBookings > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelAllBookings(pond.id, pond.name)}
                            className="h-8 w-8 p-0 text-orange-600"
                            title="Cancel all bookings"
                          >
                            <Users className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePond(pond.id, pond.name)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete pond"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Details Grid - Original simple format */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Capacity: <span className="font-semibold">{(pond as any).maxCapacity}</span></div>
                        <div className="text-sm text-gray-600">Price: <span className="font-semibold">${pond.price}</span></div>
                        <div className="text-sm text-gray-600">Available: <span className="font-semibold">{((pond as any).maxCapacity ?? 0) - pond.currentOccupancy}</span></div>
                         <div className="text-sm text-gray-600">Max Capacity: <span className="font-semibold">{pond.maxCapacity}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total Bookings: <span className="font-semibold">{pond.totalBookings}</span></div>
                        <div className="text-sm text-gray-600">Current Occupancy: <span className="font-semibold">{pond.currentOccupancy}</span></div>
                        <div className="text-sm text-gray-600">Revenue: <span className="font-semibold text-green-600">${pond.revenue}</span></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPonds.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Fish className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No ponds found' : 'No ponds available'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first pond.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => openPondDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Pond
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pond Management Dialog */}
        <Dialog open={isPondDialogOpen} onOpenChange={setIsPondDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPond ? 'Edit Pond' : 'Add New Pond'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePondSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Pond Name</label>
                <Input
                  value={pondFormData.name}
                  onChange={(e) => setPondFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter pond name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Capacity</label>
                  <Input
                    type="number"
                    min="1"
                    value={pondFormData.capacity}
                    onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 20)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pondFormData.price}
                    onChange={(e) => setPondFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Icon/Image</label>
                  <Input
                    value={pondFormData.image}
                    onChange={(e) => setPondFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="🌊"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Shape</label>
                  <select
                    value={pondFormData.shape}
                    onChange={(e) => handleShapeChange(e.target.value as 'rectangle' | 'square' | 'circle')}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="square">Square</option>
                    <option value="circle">Circle</option>
                  </select>
                </div>
              </div>
              
              {/* Seating Arrangement Configuration */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Seating Arrangement</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const autoArrangement = calculateSeatingArrangement(pondFormData.capacity, pondFormData.shape)
                      setPondFormData(prev => ({ 
                        ...prev, 
                        seatingArrangement: autoArrangement,
                        capacity: autoArrangement.reduce((sum, val) => sum + val, 0)
                      }))
                    }}
                    className="text-xs h-7"
                  >
                    Auto Calculate
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Automatically calculated based on capacity and shape. You can adjust manually before saving.
                </div>
                <div className="mt-2 space-y-2">
                  {pondFormData.shape === 'circle' ? (
                    <div>
                      <label className="text-xs text-gray-600">Total Seats Around Circle</label>
                      <Input
                        type="number"
                        min="1"
                        value={pondFormData.seatingArrangement[0]}
                        onChange={(e) => handleSeatingArrangementChange(0, parseInt(e.target.value) || 1)}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Top Side</label>
                        <Input
                          type="number"
                          min="0"
                          value={pondFormData.seatingArrangement[0]}
                          onChange={(e) => handleSeatingArrangementChange(0, parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Right Side</label>
                        <Input
                          type="number"
                          min="0"
                          value={pondFormData.seatingArrangement[1]}
                          onChange={(e) => handleSeatingArrangementChange(1, parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Bottom Side</label>
                        <Input
                          type="number"
                          min="0"
                          value={pondFormData.seatingArrangement[2]}
                          onChange={(e) => handleSeatingArrangementChange(2, parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Left Side</label>
                        <Input
                          type="number"
                          min="0"
                          value={pondFormData.seatingArrangement[3]}
                          onChange={(e) => handleSeatingArrangementChange(3, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Total seats display */}
                  <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                    <span className="font-medium">Total Seats: {pondFormData.seatingArrangement.reduce((sum, val) => sum + val, 0)}</span>
                    {pondFormData.seatingArrangement.reduce((sum, val) => sum + val, 0) !== pondFormData.capacity && (
                      <span className="text-orange-600 ml-2">
                        (Different from capacity: {pondFormData.capacity})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pondFormData.bookingEnabled}
                    onChange={(e) => setPondFormData(prev => ({ ...prev, bookingEnabled: e.target.checked }))}
                  />
                  <span className="text-sm font-medium">Enable Booking</span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : editingPond ? 'Update Pond' : 'Create Pond'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPondDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
