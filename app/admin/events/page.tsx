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
  Clock,
  X,
  ChevronDown
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
  const data = await res.json()
  return data.data || []
}

async function fetchGamesAdmin() {
  const res = await fetch('/api/admin/games')
  const data = await res.json()
  return data.data || []
}

async function fetchPrizesAdmin() {
  const res = await fetch('/api/admin/prizes')
  const data = await res.json()
  return data.data || []
}

async function fetchPrizeSets() {
  const res = await fetch('/api/admin/prize-sets')
  const data = await res.json()
  return data.data || []
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
  assignedPonds: number[] // Changed from single pondId
  description?: string
  eventGames: {
    gameId: number
    prizeSetId: number
    customGameName?: string
    displayOrder: number
    // For displaying selected game/prize set details
    game?: Game
    prizeSet?: any
  }[]
}

export default function EventsManagementPage() {
  const toast = useToastSafe()
  const [events, setEvents] = useState<(Event & {
    participants: number;
    revenue: number;
    availableSpots: number;
    assignedPonds?: number[];
    prizePool?: number;
    bookingOpenIn?: number;
    eventIn?: number;
  })[]>([])
  const [ponds, setPonds] = useState<Pond[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [prizeSets, setPrizeSets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null)

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
    eventGames: []
  })

  const loadData = () => {
    setIsLoading(true)
    try {
      fetchEvents().then((evs: any[]) => {
        // Process events to calculate statistics from bookings
        const processedEvents = evs.map(event => {
          const bookings = event.bookings || []
          const participants = bookings.length
          const revenue = bookings.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0)
          const availableSpots = (event.maxParticipants || 0) - participants
          
          // Extract pond IDs from eventPonds
          const assignedPonds = (event.eventPonds || []).map((ep: any) => ep.pondId)
          
          // Calculate total prize pool from eventGames
          const prizePool = (event.eventGames || []).reduce((total: number, eg: any) => {
            const prizes = eg.prizeSet?.prizes || []
            const gameTotal = prizes.reduce((sum: number, prize: any) => sum + (prize.value || 0), 0)
            return total + gameTotal
          }, 0)
          
          return {
            ...event,
            participants,
            revenue,
            availableSpots,
            assignedPonds,
            prizePool
          }
        })
        setEvents(processedEvents)
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
      fetchGamesAdmin().then((gs: any[]) => {
        setGames(gs)
      })
      fetchPrizesAdmin().then((ps: any[]) => {
        setPrizes(ps)
      })
      fetchPrizeSets().then((psets: any[]) => {
        setPrizeSets(psets)
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
      // Transform eventGames to API format (remove UI helper fields)
      eventGames: eventFormData.eventGames.map(eg => ({
        gameId: eg.gameId,
        prizeSetId: eg.prizeSetId,
        customGameName: eg.customGameName || null,
        displayOrder: eg.displayOrder,
        isActive: true
      }))
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

  // Event Game Handlers for New Structure
  const handleAddEventGame = () => {
    setEventFormData(prev => ({
      ...prev,
      eventGames: [...prev.eventGames, {
        gameId: games[0]?.id || 0,
        prizeSetId: prizeSets[0]?.id || 0,
        customGameName: undefined,
        displayOrder: prev.eventGames.length,
        game: games[0],
        prizeSet: prizeSets[0]
      }]
    }))
  }

  const handleEventGameChange = (index: number, field: 'gameId' | 'prizeSetId' | 'customGameName', value: number | string | undefined) => {
    setEventFormData(prev => ({
      ...prev,
      eventGames: prev.eventGames.map((eg, idx) => {
        if (idx !== index) return eg
        
        const updated = { ...eg }
        
        if (field === 'gameId') {
          const gameId = value as number
          updated.gameId = gameId
          updated.game = games.find(g => g.id === gameId)
        } else if (field === 'prizeSetId') {
          const prizeSetId = value as number
          updated.prizeSetId = prizeSetId
          updated.prizeSet = prizeSets.find(ps => ps.id === prizeSetId)
        } else if (field === 'customGameName') {
          updated.customGameName = value as string || undefined
        }
        
        return updated
      })
    }))
  }

  const handleRemoveEventGame = (index: number) => {
    setEventFormData(prev => ({
      ...prev,
      eventGames: prev.eventGames.filter((_, i) => i !== index).map((eg, i) => ({
        ...eg,
        displayOrder: i
      }))
    }))
  }

  const handleMoveEventGame = (index: number, direction: 'up' | 'down') => {
    setEventFormData(prev => {
      const newEventGames = [...prev.eventGames]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      
      if (targetIndex < 0 || targetIndex >= newEventGames.length) return prev
      
      // Swap positions
      const temp = newEventGames[index]
      newEventGames[index] = newEventGames[targetIndex]
      newEventGames[targetIndex] = temp
      
      // Update displayOrder
      return {
        ...prev,
        eventGames: newEventGames.map((eg, i) => ({ ...eg, displayOrder: i }))
      }
    })
  }

  // Remove old handler functions (these are no longer used)
  const handleGameChange = (gameIndex: number, gameId: number) => {
    // Deprecated - kept for compatibility during transition
  }
  
  const handlePrizeChange = (gameIndex: number, prizeIndex: number, prizeId: number) => {
    // Deprecated - kept for compatibility during transition
  }
  
  const handlePrizeRankChange = (gameIndex: number, prizeIndex: number, rank: number) => {
    // Deprecated - kept for compatibility during transition
  }

  const handleAddGame = () => {
    // Deprecated - use handleAddEventGame instead
    handleAddEventGame()
  }

  const handleAddPrize = (gameIndex: number) => {
    // Deprecated - prizes are now assigned via prize sets
  }

  const handleRemoveGame = (index: number) => {
    // Deprecated - use handleRemoveEventGame instead
    handleRemoveEventGame(index)
  }

  const handleRemovePrize = (gameIndex: number, prizeIndex: number) => {
    // Deprecated - prizes are now managed via prize sets
  }
  const resetEventForm = () => {
    setEventFormData({
      name: '',
      date: '',
      startTime: '08:00',
      endTime: '16:00',
      maxParticipants: 50,
      entryFee: 50,
      bookingOpens: '',
      status: 'upcoming',
      assignedPonds: [],
      eventGames: []
    })
  }

  const openEventDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event)
      
      // Extract assigned pond IDs from eventPonds relation or use existing assignedPonds field
      const assignedPondIds = event.assignedPonds 
        || (event as any).eventPonds?.map((ep: any) => ep.pondId) 
        || []
      
      // Extract eventGames from the event
      const eventGamesData = (event as any).eventGames || []
      
      setEventFormData({
        name: event.name,
        date: new Date(event.date).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        startTime: event.startTime,
        endTime: event.endTime,
        maxParticipants: event.maxParticipants,
        entryFee: event.entryFee,
        bookingOpens: new Date(event.bookingOpens).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        status: event.status,
        assignedPonds: assignedPondIds,
        description: (event as any).description,
        eventGames: eventGamesData.map((eg: any) => ({
          gameId: eg.gameId,
          prizeSetId: eg.prizeSetId,
          customGameName: eg.customGameName,
          displayOrder: eg.displayOrder,
          game: eg.game,
          prizeSet: eg.prizeSet
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
                  {events.reduce((sum, event) => sum + (event.participants || 0), 0)}
                </div>
                <div className="text-xs text-gray-600">Participants</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  ${events.reduce((sum, event) => sum + (event.revenue || 0), 0)}
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
                      {/* Pond display section */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🌊</span>
                        <span>
                          {(() => {
                            // Extract pond names directly from eventPonds relation
                            const pondNames = ((event as any).eventPonds || [])
                              .map((ep: any) => ep.pond?.name)
                              .filter(Boolean)
                              .join(', ')
                            return pondNames || 'No ponds assigned'
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Prize and Fee */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Prize Pool:</span>
                        <span className="font-medium ml-1">${event.prizePool || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Entry:</span>
                        <span className="font-medium ml-1">${event.entryFee}</span>
                      </div>
                    </div>

                    {/* Participants Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Participants</span>
                        <span>{event.participants || 0}/{event.maxParticipants || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${Math.min(100, ((event.participants || 0) / (event.maxParticipants || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-semibold text-blue-700">{event.participants || 0}</div>
                        <div className="text-blue-600">Signed Up</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-green-700">${event.revenue || 0}</div>
                        <div className="text-green-600">Revenue</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-semibold text-orange-700">{event.availableSpots || 0}</div>
                        <div className="text-orange-600">Available</div>
                      </div>
                    </div>

                    {/* Games & Prizes Accordion Section */}
                    {((event as any).eventGames || []).length > 0 && (
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-1">
                          <Trophy className="h-2.5 w-2.5" />
                          <span className="font-medium">Games</span>
                        </div>
                        
                        {((event as any).eventGames || []).map((eg: any, idx: number) => {
                          const gameName = eg.customGameName || eg.gameTemplate?.name || eg.game?.name || 'Unknown Game'
                          const gameType = eg.gameTemplate?.type || eg.game?.type || ''
                          const targetWeight = eg.gameTemplate?.targetWeight || eg.game?.targetWeight
                          const isExpanded = expandedGameId === eg.id
                          
                          // Get top 3 prizes sorted by rank
                          const topPrizes = (eg.prizeSet?.prizes || [])
                            .filter((p: any) => p.rankStart <= 3)
                            .sort((a: any, b: any) => a.rankStart - b.rankStart)
                            .slice(0, 3)
                          
                          return (
                            <div key={eg.id || idx} className="border rounded overflow-hidden">
                              {/* Game Title - Always Visible (Accordion Header) */}
                              <button
                                onClick={() => setExpandedGameId(isExpanded ? null : eg.id)}
                                className="w-full flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100 transition-colors"
                              >
                                <div className="flex items-center gap-1 text-left">
                                  <Trophy className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                  <div>
                                    <h4 className="font-semibold text-xs text-gray-900">{gameName}</h4>
                                    <p className="text-[10px] text-gray-600">
                                      {gameType === 'HEAVIEST_WEIGHT' && 'Heaviest'}
                                      {gameType === 'TARGET_WEIGHT' && targetWeight && `${targetWeight}kg`}
                                      {gameType === 'TOTAL_WEIGHT' && 'Total'}
                                      {!gameType && 'Game'}
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown 
                                  className={`h-3 w-3 text-blue-600 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              
                              {/* Game Details - Expandable (Accordion Body) */}
                              {isExpanded && (
                                <div className="p-2 bg-white border-t animate-in slide-in-from-top-2 duration-200">
                                  {topPrizes.length > 0 && (
                                    <div className="space-y-1">
                                      {topPrizes.map((prize: any, pIdx: number) => (
                                        <div key={prize.id || pIdx} className="flex items-center justify-between p-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded text-[10px]">
                                          <span className="text-gray-700">
                                            {prize.rankStart === 1 && '🥇'}
                                            {prize.rankStart === 2 && '🥈'}
                                            {prize.rankStart === 3 && '🥉'}
                                            {' '}
                                            {prize.rankStart === prize.rankEnd 
                                              ? `${prize.rankStart}${prize.rankStart === 1 ? 'st' : prize.rankStart === 2 ? 'nd' : 'rd'}`
                                              : `${prize.rankStart}-${prize.rankEnd}`
                                            }
                                          </span>
                                          <span className="font-bold text-yellow-700">${prize.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

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

              {/* Event Games Section - NEW STRUCTURE */}
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Competition Games</h3>
                  <Button type="button" onClick={handleAddEventGame} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Game
                  </Button>
                </div>

                {eventFormData.eventGames.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No games added yet. Click "Add Game" to get started.
                  </div>
                )}

                {eventFormData.eventGames.map((eventGame, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Game Selection and Actions */}
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 space-y-3">
                            {/* Game Template Dropdown */}
                            <div>
                              <label className="text-sm font-medium mb-1 block">Game Template</label>
                              <select
                                value={eventGame.gameId}
                                onChange={(e) => handleEventGameChange(index, 'gameId', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-md"
                              >
                                <option value="">Select a game template</option>
                                {games.map(game => {
                                  // Format game type display (same as accordion below game title)
                                  const gameType = (game as any).type;
                                  const targetWeight = (game as any).targetWeight;
                                  let gameTypeDisplay = '';
                                  
                                  if (gameType === 'HEAVIEST_WEIGHT') {
                                    gameTypeDisplay = 'Heaviest';
                                  } else if (gameType === 'TARGET_WEIGHT') {
                                    gameTypeDisplay = targetWeight ? `${targetWeight}kg` : 'Target Weight';
                                  } else if (gameType === 'TOTAL_WEIGHT') {
                                    gameTypeDisplay = 'Total';
                                  } else if (gameType === 'EXACT_WEIGHT') {
                                    gameTypeDisplay = 'Exact Weight';
                                  } else {
                                    gameTypeDisplay = gameType || 'Game';
                                  }
                                  
                                  return (
                                    <option key={game.id} value={game.id}>
                                      {game.name} ({gameTypeDisplay})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* Custom Game Name (Optional) */}
                            <div>
                              <label className="text-sm font-medium mb-1 block">
                                Custom Name (Optional)
                                <span className="text-xs text-gray-500 ml-2">Override template name for this event</span>
                              </label>
                              <Input
                                value={eventGame.customGameName || ''}
                                onChange={(e) => handleEventGameChange(index, 'customGameName', e.target.value)}
                                placeholder={eventGame.game?.name || "Enter custom name..."}
                              />
                            </div>

                            {/* Prize Set Selection */}
                            <div>
                              <label className="text-sm font-medium mb-1 block">Prize Set</label>
                              <select
                                value={eventGame.prizeSetId}
                                onChange={(e) => handleEventGameChange(index, 'prizeSetId', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-md"
                              >
                                <option value="">Select a prize set</option>
                                {prizeSets.map(ps => (
                                  <option key={ps.id} value={ps.id}>
                                    {ps.name} ({ps.prizes?.length || 0} prizes)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Show Prize Set Details */}
                            {eventGame.prizeSet && (
                              <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm font-medium mb-2">Prize Breakdown:</p>
                                <div className="space-y-1 text-sm">
                                  {eventGame.prizeSet.prizes?.map((prize: any) => (
                                    <div key={prize.id} className="flex justify-between">
                                      <span>{prize.name}</span>
                                      <span className="font-medium">${prize.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveEventGame(index, 'up')}
                              disabled={index === 0}
                              title="Move up"
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveEventGame(index, 'down')}
                              disabled={index === eventFormData.eventGames.length - 1}
                              title="Move down"
                            >
                              ↓
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveEventGame(index)}
                              title="Remove game"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

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
