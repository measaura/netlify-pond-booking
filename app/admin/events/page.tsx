'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  ArrowLeft, 
  RefreshCw,
  Users,
  DollarSign,
  Trophy,
  Clock
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useToastSafe } from '@/components/ui/toast'
import { 
  Event, 
  Game, 
  Prize, 
  EventGame, 
  EventPrize,
  Pond 
} from '@/types'
async function fetchEvents() {
  const res = await fetch('/api/admin/events')
  const json = await res.json()
  return json.ok ? json.data : []
}

async function fetchPondsAdmin() {
  const res = await fetch('/api/admin/ponds')
  const json = await res.json()
  return json.ok ? json.data : []
}

async function createEventApi(data: any) {
  const res = await fetch('/api/admin/events', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
  return await res.json()
}

async function updateEventApi(id: number, data: any) {
  const res = await fetch('/api/admin/events', { method: 'PUT', body: JSON.stringify({ id, ...data }), headers: { 'Content-Type': 'application/json' } })
  return await res.json()
}

async function deleteEventApi(id: number) {
  const res = await fetch('/api/admin/events', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
  return await res.json()
}

function formatEventTimeRange(e: any) {
  try {
    const date = new Date(e.date || e.startDate)
    const s = e.startTime || new Date(e.startDate).toTimeString().substr(0,5)
    const t = e.endTime || new Date(e.endDate).toTimeString().substr(0,5)
    return `${date.toLocaleDateString()} ${s} - ${t}`
  } catch (err) { return '' }
}

interface EventFormData {
  name: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: number
  entryFee: number
  bookingOpens: string
  status: 'open' | 'upcoming' | 'closed' | 'active' | 'completed'
  // pondId: number        // Keep for backward compatibility
  // pondName: string      // Keep for backward compatibility
  // prize: string         // Keep for backward compatibility
  assignedPonds: number[] // Changed from single pondId
  games: {
    id: number
    name: string
    type: 'heaviest' | 'nearest' | 'biggest' | 'other'
    measurementUnit: 'kg' | 'cm' | 'other'
    targetValue?: number
    decimalPlaces?: number
    description: string
    prizes: {
      id: number
      name: string
      type: 'money' | 'item'
      value: number
      rank?: number
      description: string
      isActive: boolean
      createdAt: string
      updatedAt: string
    }[]
    isActive: boolean
    createdAt: string
    updatedAt: string
  }[]
}

export default function EventsManagementPage() {
  const toast = useToastSafe()
  const [events, setEvents] = useState<(Event & {
    participants: number;
    revenue: number;
    availableSpots: number;
    bookingOpenIn?: number;
    eventIn?: number;
  })[]>([])
  const [ponds, setPonds] = useState<Pond[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // const [games, setGames] = useState<Game[]>([])
  // const [prizes, setPrizes] = useState<Prize[]>([])
  const games: Game[] = []
  const prizes: Prize[] = []

  // Event management state
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [eventFormData, setEventFormData] = useState<EventFormData>({
    name: '',
    date: '',
    startTime: '08:00',
    endTime: '16:00',
    maxParticipants: 50,
    entryFee: 50,
    bookingOpens: '',
    status: 'upcoming',
    assignedPonds: [],
    games: []
  })

  const loadData = () => {
    setIsLoading(true)
    try {
      fetchEvents().then((evs: any[]) => {
        setEvents(evs)
      })
      fetchPondsAdmin().then((ps: any[]) => {
        const normalized = ps.map(p => ({
          id: p.id,
          name: p.name,
          capacity: p.maxCapacity ?? p.capacity ?? 0,
          maxCapacity: p.maxCapacity ?? p.capacity ?? 0,
          price: p.price ?? 0,
          image: p.image ?? '🌊',
          bookingEnabled: p.bookingEnabled ?? true,
          shape: (p.shape || 'RECTANGLE').toLowerCase(),
          seatingArrangement: p.seatingArrangement || [5,5,5,5],
        }))
        setPonds(normalized)
      })
    } catch (error) {
      console.error('Error loading events data:', error)
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

  // Event management functions
  // const handleEventSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setIsLoading(true)
    
  //   try {
  //     // Find pond name
  //     const selectedPond = ponds.find(p => p.id === eventFormData.assignedPonds[0])
  //     const finalEventData = {
  //       ...eventFormData,
  //       pondName: selectedPond?.name || 'Unknown Pond',
  //       date: new Date(eventFormData.date).toISOString(),
  //       bookingOpens: new Date(eventFormData.bookingOpens).toISOString()
  //     }
      
  //     if (editingEvent) {
  //       // Update existing event
  //       const success = updateEvent(editingEvent.id, finalEventData)
  //       if (success) {
  //         alert('Event updated successfully!')
  //       } else {
  //         alert('Failed to update event.')
  //       }
  //     } else {
  //       // Create new event
  //       addEvent(finalEventData)
  //       alert('Event created successfully!')
  //     }
      
  //     setIsEventDialogOpen(false)
  //     setEditingEvent(null)
  //     resetEventForm()
  //     loadData()
  //   } catch (error) {
  //     console.error('Error saving event:', error)
  //     alert('Error saving event. Please try again.')
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }
 // Modify the handleEventSubmit function to use alerts instead of toast
const handleEventSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  
  try {
    const finalEventData = {
      ...eventFormData,
      startDate: new Date(eventFormData.date + 'T' + eventFormData.startTime),
      endDate: new Date(eventFormData.date + 'T' + eventFormData.endTime),
      bookingOpens: eventFormData.bookingOpens ? new Date(eventFormData.bookingOpens) : new Date(),
      pondIds: eventFormData.assignedPonds,
    }

    if (editingEvent) {
      const resp = await updateEventApi(editingEvent.id, finalEventData)
      if (resp.ok) {
        toast ? toast.push({ message: 'Event updated successfully!', variant: 'success' }) : window.alert('Event updated successfully!')
      } else {
        toast ? toast.push({ message: 'Failed to update event: ' + resp.error, variant: 'error' }) : window.alert('Failed to update event: ' + resp.error)
      }
    } else {
      const resp = await createEventApi(finalEventData)
      if (resp.ok) {
        toast ? toast.push({ message: 'Event created successfully!', variant: 'success' }) : window.alert('Event created successfully!')
      } else {
        toast ? toast.push({ message: 'Failed to create event: ' + resp.error, variant: 'error' }) : window.alert('Failed to create event: ' + resp.error)
      }
    }

    setIsEventDialogOpen(false)
    setEditingEvent(null)
    resetEventForm()
    loadData()
  } catch (error) {
    console.error('Error saving event:', error)
    toast ? toast.push({ message: 'Failed to save event. Please try again.', variant: 'error' }) : window.alert('Failed to save event. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

  const handleDeleteEvent = async (eventId: number, eventName: string) => {
    if (confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      setIsLoading(true)
      try {
        const result = await deleteEventApi(eventId)
        if (result.ok) {
          toast ? toast.push({ message: 'Event deleted successfully!', variant: 'success' }) : window.alert('Event deleted successfully!')
          loadData()
        } else {
          toast ? toast.push({ message: result.error || 'Failed to delete event.', variant: 'error' }) : window.alert(result.error || 'Failed to delete event.')
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        toast ? toast.push({ message: 'Error deleting event. Please try again.', variant: 'error' }) : window.alert('Error deleting event. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleEventStatusChange = async (eventId: number, currentStatus: string) => {
    const statusCycle = { 'upcoming': 'open', 'open': 'closed', 'closed': 'upcoming' }
    const newStatus = statusCycle[currentStatus as keyof typeof statusCycle] as 'open' | 'upcoming' | 'closed'
    
    setIsLoading(true)
    try {
      const resp = await updateEventApi(eventId, { status: newStatus })
      if (resp.ok) {
        loadData()
      } else {
        toast ? toast.push({ message: 'Failed to update event status: ' + resp.error, variant: 'error' }) : window.alert('Failed to update event status: ' + resp.error)
      }
    } catch (error) {
      console.error('Error updating event status:', error)
      toast ? toast.push({ message: 'Error updating event status. Please try again.', variant: 'error' }) : window.alert('Error updating event status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelAllBookings = async (eventId: number, eventName: string) => {
    if (confirm(`Cancel ALL bookings for "${eventName}"? This action cannot be undone.`)) {
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

  const handleGameChange = (gameIndex: number, gameId: number) => {
    setEventFormData(prev => ({
      ...prev,
      games: prev.games.map((game, idx) =>
        idx === gameIndex ? { ...game, gameId } : game
      )
    }))
  }
  
  // const handleAddGame = () => {
  //   setEventFormData(prev => ({
  //     ...prev,
  //     eventGames: [...prev.eventGames, {
  //       id: Date.now(),
  //       gameId: games[0]?.id || 0,
  //       prizes: []
  //     }]
  //   }))
  // }
  
  // const handleAddPrize = (gameIndex: number) => {
  //   setEventFormData(prev => ({
  //     ...prev,
  //     eventGames: prev.eventGames.map((game, idx) =>
  //       idx === gameIndex ? {
  //         ...game,
  //         prizes: [...game.prizes, {
  //           prizeId: prizes[0]?.id || 0,
  //           rank: game.prizes.length + 1
  //         }]
  //       } : game
  //     )
  //   }))
  // }
  
  const handlePrizeChange = (gameIndex: number, prizeIndex: number, prizeId: number) => {
    setEventFormData(prev => ({
      ...prev,
      games: prev.games.map((game, gIdx) =>
        gIdx === gameIndex ? {
          ...game,
          prizes: game.prizes.map((prize, pIdx) =>
            pIdx === prizeIndex ? { ...prize, prizeId } : prize
          )
        } : game
      )
    }))
  }
  
  const handlePrizeRankChange = (gameIndex: number, prizeIndex: number, rank: number) => {
    setEventFormData(prev => ({
      ...prev,
      games: prev.games.map((game, gIdx) =>
        gIdx === gameIndex ? {
          ...game,
          prizes: game.prizes.map((prize, pIdx) =>
            pIdx === prizeIndex ? { ...prize, rank } : prize
          )
        } : game
      )
    }))
  }
  const resetEventForm = () => {
    setEventFormData({
      name: '',
      date: '',
      startTime: '08:00',
      endTime: '16:00',
      maxParticipants: 50,
      // pondId: ponds[0]?.id || 1,
      // pondName: '',
      // prize: '',
      entryFee: 50,
      bookingOpens: '',
      status: 'upcoming',
      assignedPonds: [],
      games: []
    })
  }

  const openEventDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event)
      setEventFormData({
        name: event.name,
        date: new Date(event.date).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        startTime: event.startTime,
        endTime: event.endTime,
        maxParticipants: event.maxParticipants,
        // pondId: event.pondId,
        // pondName: event.pondName,
        // prize: event.prize,
        entryFee: event.entryFee,
        bookingOpens: new Date(event.bookingOpens).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        status: event.status,
        assignedPonds: event.assignedPonds,
        games: event.games.map(eg => ({
          id: eg.id,
          name: eg.name,
          type: eg.type,
          measurementUnit: eg.measurementUnit,
          targetValue: eg.targetValue,
          decimalPlaces: eg.decimalPlaces,
          isActive: eg.isActive,
          createdAt: eg.createdAt,
          updatedAt: eg.updatedAt,
          description: eg.description,
          prizes: eg.prizes.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            value: p.value,
            description: p.description,
            isActive: p.isActive,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
          }))
        }))
      })
    } else {
      setEditingEvent(null)
      resetEventForm()
    }
    setIsEventDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-red-100 text-red-800'
      case 'upcoming': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString)
    const now = new Date()
    const diffTime = eventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Add game to event
  const handleAddGame = () => {
    setEventFormData(prev => ({
      ...prev,
      games: [...prev.games, {
        id: Date.now(),
        name: '',
        type: 'heaviest',
        measurementUnit: 'kg',
        decimalPlaces: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: '',
        prizes: []
      }]
    }))
  }

  // Add prize to game
  const handleAddPrize = (gameId: number) => {
    setEventFormData(prev => ({
      ...prev,
      games: prev.games.map(game => 
        game.id === gameId 
          ? {
              ...game,
              prizes: [...game.prizes, {
                id: Date.now(),
                name: '',
                rank: game.prizes.length + 1,
                type: 'money',
                value: 0,
                description: '',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }]
            }
          : game
      )
    }))
  }

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
                  <Calendar className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">Events Management</h1>
                    <p className="text-xs text-gray-500 truncate">Manage all fishing events</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={refreshData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEventDialog()}>
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
                <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{events.length}</div>
                <div className="text-xs text-gray-600">Total Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {events.reduce((sum, event) => sum + event.participants, 0)}
                </div>
                <div className="text-xs text-gray-600">Participants</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  ${events.reduce((sum, event) => sum + event.revenue, 0)}
                </div>
                <div className="text-xs text-gray-600">Total Revenue</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {events.filter(e => e.status === 'open').length}
                </div>
                <div className="text-xs text-gray-600">Open Events</div>
              </CardContent>
            </Card>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => {
              const daysUntil = getDaysUntil(event.date)
              return (
                <Card key={event.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{event.name}</CardTitle>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Event Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(event.date)}</span>
                        {daysUntil >= 0 && (
                          <span className="text-xs text-gray-500">
                            ({daysUntil === 0 ? 'Today' : `${daysUntil}d`})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{formatEventTimeRange(event)}</span>
                      </div>
                      {/* // Replace the pond display section in the event card */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🌊</span>
                        <span>
                          {event.assignedPonds
                            .map(pondId => ponds.find(p => p.id === pondId)?.name)
                            .filter(Boolean)
                            .join(', ') || 'No ponds assigned'}
                        </span>
                      </div>
                    </div>

                    {/* Prize and Fee */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {/* <div>
                        <span className="text-gray-600">Prize:</span>
                        <span className="font-medium ml-1">{event.prize}</span>
                      </div> */}
                      <div>
                        <span className="text-gray-600">Entry:</span>
                        <span className="font-medium ml-1">${event.entryFee}</span>
                      </div>
                    </div>

                    {/* Participants Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Participants</span>
                        <span>{event.participants}/{event.maxParticipants}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${Math.min(100, (event.participants / event.maxParticipants) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-semibold text-blue-700">{event.participants}</div>
                        <div className="text-blue-600">Signed Up</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-green-700">${event.revenue}</div>
                        <div className="text-green-600">Revenue</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-semibold text-orange-700">{event.availableSpots}</div>
                        <div className="text-orange-600">Available</div>
                      </div>
                    </div>

                    {/* Booking Opens Info */}
                    {event.bookingOpenIn && event.bookingOpenIn > 0 && (
                      <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                        Booking opens in {event.bookingOpenIn} days
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-2 border-t">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEventDialog(event)}
                          className="h-8 w-8 p-0"
                          title="Edit event"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEventStatusChange(event.id, event.status)}
                          className="h-8 w-8 p-0 text-blue-600"
                          title="Toggle status"
                        >
                          <Power className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete event"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {event.participants > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelAllBookings(event.id, event.name)}
                          className="text-xs h-8"
                        >
                          Cancel All
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {events.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first fishing event.</p>
                <Button onClick={() => openEventDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Event Management Dialog */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Event Name</label>
                <Input
                  value={eventFormData.name}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter event name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assigned Ponds</label>
                <div className="grid grid-cols-2 gap-2">
                  {ponds.map(pond => (
                    <label key={pond.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={eventFormData.assignedPonds.includes(pond.id)}
                        onChange={(e) => {
                          const newPonds = e.target.checked
                            ? [...eventFormData.assignedPonds, pond.id]
                            : eventFormData.assignedPonds.filter(id => id !== pond.id)
                          setEventFormData(prev => ({ ...prev, assignedPonds: newPonds }))
                        }}
                      />
                      <span>{pond.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Event Date</label>
                  <Input
                    type="date"
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Booking Opens</label>
                  <Input
                    type="date"
                    value={eventFormData.bookingOpens}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, bookingOpens: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={eventFormData.startTime}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={eventFormData.endTime}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Max Participants</label>
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={eventFormData.maxParticipants}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 50 }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Entry Fee ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventFormData.entryFee}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, entryFee: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* <div>
                  <label className="text-sm font-medium">Prize</label>
                  <Input
                    value={eventFormData.prize}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, prize: e.target.value }))}
                    placeholder="$1,000"
                    required
                  />
                </div> */}
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={eventFormData.status}
                    onChange={(e) => setEventFormData(prev => ({ 
                      ...prev, 
                      status: e.target.value as 'open' | 'upcoming' | 'closed'
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Games Section */}
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Competition Games</h3>
                  <Button type="button" onClick={handleAddGame} variant="outline" size="sm">
                    Add Game
                  </Button>
                </div>

                {eventFormData.games.map((gameEntry, index) => (
                  <Card key={gameEntry.id} className="mb-4">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <select
                          value={gameEntry.id}
                          onChange={(e) => handleGameChange(index, parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select a game</option>
                          {games.map(game => (
                            <option key={game.id} value={game.id}>
                              {game.name} ({game.type})
                            </option>
                          ))}
                        </select>
              
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Prizes</h4>
                            <Button 
                              type="button"
                              onClick={() => handleAddPrize(index)} 
                              variant="outline" 
                              size="sm"
                            >
                              Add Prize
                            </Button>
                          </div>
                          
                          {gameEntry.prizes.map((prizeEntry, prizeIndex) => (
                            <div key={prizeIndex} className="grid grid-cols-2 gap-2">
                              <select
                                value={prizeEntry.id}
                                onChange={(e) => handlePrizeChange(index, prizeIndex, parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-md"
                              >
                                <option value="">Select a prize</option>
                                {prizes.map(prize => (
                                  <option key={prize.id} value={prize.id}>
                                    {prize.name} (${prize.value})
                                  </option>
                                ))}
                              </select>
                              <Input
                                type="number"
                                placeholder="Rank"
                                value={prizeEntry.rank}
                                onChange={(e) => handlePrizeRankChange(index, prizeIndex, parseInt(e.target.value))}
                                min={1}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2">Competition Games</h3>
                {eventFormData.games.map((game, index) => (
                  <Card key={game.id} className="mb-4">
                    <CardContent className="p-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Game Name"
                            value={game.name}
                            onChange={(e) => handleGameChange(game.id, 'name', e.target.value)}
                          />
                          <select
                            value={game.type}
                            onChange={(e) => handleGameChange(game.id, 'type', e.target.value)}
                            className="form-select"
                          >
                            <option value="heaviest">Heaviest Catch</option>
                            <option value="nearest">Nearest Weight</option>
                            <option value="biggest">Biggest Size</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {/* Prize Section 
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Prizes</h4>
                            <Button onClick={() => handleAddPrize(game.id)} size="sm">
                              Add Prize
                            </Button>
                          </div>
                          {game.prizes.map((prize, prizeIndex) => (
                            <div key={prizeIndex} className="grid grid-cols-3 gap-2">
                              <Input
                                type="number"
                                placeholder="Rank"
                                value={prize.rank}
                                onChange={(e) => handlePrizeChange(game.id, prizeIndex, 'rank', parseInt(e.target.value))}
                              />
                              <Input
                                type="number"
                                placeholder="Value"
                                value={prize.value}
                                onChange={(e) => handlePrizeChange(game.id, prizeIndex, 'value', parseFloat(e.target.value))}
                              />
                              <Input
                                placeholder="Description"
                                value={prize.description}
                                onChange={(e) => handlePrizeChange(game.id, prizeIndex, 'description', e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={handleAddGame}>Add Game</Button>
              </div> */}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEventDialogOpen(false)}
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
