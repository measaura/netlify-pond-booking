"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Trophy,
  ChevronDown,
  DollarSign,
  Gift,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useToastSafe } from '@/components/ui/toast'

// API endpoints
const PRIZE_SETS_API = '/api/admin/prize-sets'
const PRIZES_API = '/api/admin/prizes'

// Types
interface PrizeSet {
  id: number
  name: string
  description: string | null
  isActive: boolean
  prizes: Prize[]
  eventGames: Array<{
    id: number
    event: {
      id: number
      name: string
    }
    game: {
      id: number
      name: string
    }
  }>
  createdAt: string
  updatedAt: string
}

interface Prize {
  id: number
  name: string
  type: 'MONEY' | 'ITEM'
  value: number
  rankStart: number
  rankEnd: number
  description: string | null
  isActive: boolean
  prizeSetId: number
  createdAt: string
  updatedAt: string
}

interface PrizeSetFormData {
  name: string
  description: string
  isActive: boolean
}

interface PrizeFormData {
  name: string
  type: 'MONEY' | 'ITEM'
  value: number
  rankStart: number
  rankEnd: number
  description: string
  isActive: boolean
  prizeSetId: number
}

export default function PrizesManagementPage() {
  const toast = useToastSafe()
  
  // State
  const [prizeSets, setPrizeSets] = useState<PrizeSet[]>([])
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Prize Set Dialog
  const [isPrizeSetDialogOpen, setIsPrizeSetDialogOpen] = useState(false)
  const [editingPrizeSet, setEditingPrizeSet] = useState<PrizeSet | null>(null)
  const [prizeSetFormData, setPrizeSetFormData] = useState<PrizeSetFormData>({
    name: '',
    description: '',
    isActive: true
  })
  
  // Prize Dialog
  const [isPrizeDialogOpen, setIsPrizeDialogOpen] = useState(false)
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
  const [selectedPrizeSetId, setSelectedPrizeSetId] = useState<number | null>(null)
  const [prizeFormData, setPrizeFormData] = useState<PrizeFormData>({
    name: '',
    type: 'MONEY',
    value: 0,
    rankStart: 1,
    rankEnd: 1,
    description: '',
    isActive: true,
    prizeSetId: 0
  })

  // Load all prize sets with their prizes
  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(PRIZE_SETS_API)
      const json = await res.json()
      if (json.ok) {
        setPrizeSets(json.data)
      } else {
        throw new Error(json.error || 'Failed to load prize sets')
      }
    } catch (error) {
      console.error('Error loading prize sets:', error)
      toast?.push({
        message: error instanceof Error ? error.message : 'Failed to load data',
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Prize Set handlers
  const resetPrizeSetForm = () => {
    setPrizeSetFormData({
      name: '',
      description: '',
      isActive: true
    })
  }

  const openPrizeSetDialog = (prizeSet?: PrizeSet) => {
    if (prizeSet) {
      setEditingPrizeSet(prizeSet)
      setPrizeSetFormData({
        name: prizeSet.name,
        description: prizeSet.description || '',
        isActive: prizeSet.isActive
      })
    } else {
      setEditingPrizeSet(null)
      resetPrizeSetForm()
    }
    setIsPrizeSetDialogOpen(true)
  }

  const handlePrizeSetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const method = editingPrizeSet ? 'PUT' : 'POST'
      const body = editingPrizeSet 
        ? { id: editingPrizeSet.id, ...prizeSetFormData }
        : prizeSetFormData

      const res = await fetch(PRIZE_SETS_API, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const json = await res.json()
      
      if (json.ok) {
        toast?.push({
          message: editingPrizeSet ? 'Prize set updated' : 'Prize set created',
          variant: 'success'
        })
        loadData()
        setIsPrizeSetDialogOpen(false)
        setEditingPrizeSet(null)
        resetPrizeSetForm()
      } else {
        throw new Error(json.error || 'Failed to save prize set')
      }
    } catch (error) {
      toast?.push({
        message: error instanceof Error ? error.message : 'Failed to save prize set',
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePrizeSet = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prize set? All prizes in this set will also be deleted.')) {
      return
    }

    try {
      const res = await fetch(PRIZE_SETS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      const json = await res.json()
      
      if (json.ok) {
        toast?.push({
          message: 'Prize set deleted',
          variant: 'success'
        })
        loadData()
      } else {
        throw new Error(json.error || 'Failed to delete prize set')
      }
    } catch (error) {
      toast?.push({
        message: error instanceof Error ? error.message : 'Failed to delete prize set',
        variant: 'error'
      })
    }
  }

  // Prize handlers
  const resetPrizeForm = () => {
    setPrizeFormData({
      name: '',
      type: 'MONEY',
      value: 0,
      rankStart: 1,
      rankEnd: 1,
      description: '',
      isActive: true,
      prizeSetId: selectedPrizeSetId || 0
    })
  }

  const openPrizeDialog = (prizeSetId: number, prize?: Prize) => {
    setSelectedPrizeSetId(prizeSetId)
    
    if (prize) {
      setEditingPrize(prize)
      setPrizeFormData({
        name: prize.name,
        type: prize.type,
        value: prize.value,
        rankStart: prize.rankStart,
        rankEnd: prize.rankEnd,
        description: prize.description || '',
        isActive: prize.isActive,
        prizeSetId: prize.prizeSetId
      })
    } else {
      setEditingPrize(null)
      resetPrizeForm()
      setPrizeFormData(prev => ({ ...prev, prizeSetId }))
    }
    setIsPrizeDialogOpen(true)
  }

  const handlePrizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const method = editingPrize ? 'PUT' : 'POST'
      const body = editingPrize 
        ? { id: editingPrize.id, ...prizeFormData }
        : prizeFormData

      const res = await fetch(PRIZES_API, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const json = await res.json()
      
      if (json.ok) {
        toast?.push({
          message: editingPrize ? 'Prize updated' : 'Prize created',
          variant: 'success'
        })
        loadData()
        setIsPrizeDialogOpen(false)
        setEditingPrize(null)
        resetPrizeForm()
      } else {
        throw new Error(json.error || 'Failed to save prize')
      }
    } catch (error) {
      toast?.push({
        message: error instanceof Error ? error.message : 'Failed to save prize',
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePrize = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prize?')) {
      return
    }

    try {
      const res = await fetch(PRIZES_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      const json = await res.json()
      
      if (json.ok) {
        toast?.push({
          message: 'Prize deleted',
          variant: 'success'
        })
        loadData()
      } else {
        throw new Error(json.error || 'Failed to delete prize')
      }
    } catch (error) {
      toast?.push({
        message: error instanceof Error ? error.message : 'Failed to delete prize',
        variant: 'error'
      })
    }
  }

  // Helper functions
  const getTotalPrizeValue = (prizes: Prize[]) => {
    return prizes.reduce((sum, prize) => sum + prize.value, 0)
  }

  const getRankDisplay = (prize: Prize) => {
    if (prize.rankStart === prize.rankEnd) {
      const rank = prize.rankStart
      if (rank === 1) return '🥇 1st'
      if (rank === 2) return '🥈 2nd'
      if (rank === 3) return '🥉 3rd'
      return `#${rank}`
    }
    return `#${prize.rankStart}-${prize.rankEnd}`
  }

  return (
    <AuthGuard requiredRole='admin'>
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
                  <Trophy className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">Prize Sets Management</h1>
                    <p className="text-xs text-gray-500 truncate">Manage reusable prize collections</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => openPrizeSetDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">New Set</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{prizeSets.length}</div>
                <div className="text-xs text-gray-600">Prize Sets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Gift className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {prizeSets.reduce((sum, set) => sum + set.prizes.length, 0)}
                </div>
                <div className="text-xs text-gray-600">Total Prizes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  ${prizeSets.reduce((sum, set) => sum + getTotalPrizeValue(set.prizes), 0)}
                </div>
                <div className="text-xs text-gray-600">Total Value</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {prizeSets.filter(set => set.isActive).length}
                </div>
                <div className="text-xs text-gray-600">Active Sets</div>
              </CardContent>
            </Card>
          </div>

          {/* Prize Sets List */}
          {prizeSets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Prize Sets Yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create your first prize set to organize prizes for events and games
                </p>
                <Button onClick={() => openPrizeSetDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prize Set
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {prizeSets.map(prizeSet => {
                const isExpanded = expandedSetId === prizeSet.id
                const totalValue = getTotalPrizeValue(prizeSet.prizes)
                const usageCount = prizeSet.eventGames.length

                return (
                  <Card key={prizeSet.id} className="overflow-hidden">
                    {/* Prize Set Header - Accordion Toggle */}
                    <CardHeader 
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 transition-colors cursor-pointer"
                      onClick={() => setExpandedSetId(isExpanded ? null : prizeSet.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-left min-w-0 flex-1">
                          <Trophy className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg truncate">{prizeSet.name}</CardTitle>
                              {!prizeSet.isActive && (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            {prizeSet.description && (
                              <p className="text-sm text-gray-600 truncate">{prizeSet.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-gray-600">
                              <span>{prizeSet.prizes.length} prizes</span>
                              <span>Total: ${totalValue}</span>
                              {usageCount > 0 && (
                                <span className="text-blue-600">Used in {usageCount} event{usageCount !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openPrizeSetDialog(prizeSet)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePrizeSet(prizeSet.id)
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronDown 
                            className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </CardHeader>

                    {/* Prize Set Content - Expandable */}
                    {isExpanded && (
                      <CardContent className="p-4 border-t animate-in slide-in-from-top-2 duration-200">
                        
                        {/* Add Prize Button */}
                        <div className="mb-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openPrizeDialog(prizeSet.id)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Prize to Set
                          </Button>
                        </div>

                        {/* Prizes List */}
                        {prizeSet.prizes.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            <Gift className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No prizes in this set yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {prizeSet.prizes
                              .sort((a, b) => a.rankStart - b.rankStart)
                              .map(prize => (
                                <div 
                                  key={prize.id}
                                  className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="text-2xl flex-shrink-0">
                                      {prize.rankStart === 1 && '🥇'}
                                      {prize.rankStart === 2 && '🥈'}
                                      {prize.rankStart === 3 && '🥉'}
                                      {prize.rankStart > 3 && '🏆'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                          {getRankDisplay(prize)} - {prize.name}
                                        </span>
                                        {!prize.isActive && (
                                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                        )}
                                      </div>
                                      {prize.description && (
                                        <p className="text-xs text-gray-600 truncate">{prize.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge className="text-xs bg-yellow-600">
                                          {prize.type === 'MONEY' ? `$${prize.value}` : prize.value}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {prize.type === 'MONEY' ? 'Cash' : 'Item'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openPrizeDialog(prizeSet.id, prize)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeletePrize(prize.id)}
                                      className="h-8 w-8 p-0 text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Usage Information */}
                        {prizeSet.eventGames.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Used In:</h4>
                            <div className="space-y-1">
                              {prizeSet.eventGames.map(eg => (
                                <div key={eg.id} className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                  {eg.event.name} - {eg.game.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Prize Set Dialog */}
        <Dialog open={isPrizeSetDialogOpen} onOpenChange={setIsPrizeSetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPrizeSet ? 'Edit Prize Set' : 'Create New Prize Set'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePrizeSetSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Set Name</label>
                <Input
                  placeholder="e.g., Standard Podium, Big Pool, Single Winner"
                  value={prizeSetFormData.name}
                  onChange={(e) => setPrizeSetFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Brief description of this prize set"
                  value={prizeSetFormData.description}
                  onChange={(e) => setPrizeSetFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prizeSetActive"
                  checked={prizeSetFormData.isActive}
                  onChange={(e) => setPrizeSetFormData(prev => ({ 
                    ...prev, 
                    isActive: e.target.checked 
                  }))}
                  className="rounded"
                />
                <label htmlFor="prizeSetActive" className="text-sm font-medium cursor-pointer">
                  Active (available for selection)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : editingPrizeSet ? 'Update Set' : 'Create Set'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsPrizeSetDialogOpen(false)
                    setEditingPrizeSet(null)
                    resetPrizeSetForm()
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Prize Dialog */}
        <Dialog open={isPrizeDialogOpen} onOpenChange={setIsPrizeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPrize ? 'Edit Prize' : 'Add New Prize'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePrizeSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Prize Name</label>
                <Input
                  placeholder="e.g., 1st Place, Champion Prize"
                  value={prizeFormData.name}
                  onChange={(e) => setPrizeFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Prize Type</label>
                  <select
                    value={prizeFormData.type}
                    onChange={(e) => setPrizeFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'MONEY' | 'ITEM'
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="MONEY">Cash Prize</option>
                    <option value="ITEM">Item/Trophy</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    {prizeFormData.type === 'MONEY' ? 'Amount ($)' : 'Value'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={prizeFormData.type === 'MONEY' ? '5000' : '1'}
                    value={prizeFormData.value}
                    onChange={(e) => setPrizeFormData(prev => ({ 
                      ...prev, 
                      value: parseFloat(e.target.value) || 0
                    }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Rank Start</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={prizeFormData.rankStart}
                    onChange={(e) => setPrizeFormData(prev => ({ 
                      ...prev, 
                      rankStart: parseInt(e.target.value) || 1
                    }))}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Starting position</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Rank End</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={prizeFormData.rankEnd}
                    onChange={(e) => setPrizeFormData(prev => ({ 
                      ...prev, 
                      rankEnd: parseInt(e.target.value) || 1
                    }))}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Ending position</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder={prizeFormData.type === 'MONEY' ? 'Cash prize details' : 'Item description'}
                  value={prizeFormData.description}
                  onChange={(e) => setPrizeFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prizeActive"
                  checked={prizeFormData.isActive}
                  onChange={(e) => setPrizeFormData(prev => ({ 
                    ...prev, 
                    isActive: e.target.checked 
                  }))}
                  className="rounded"
                />
                <label htmlFor="prizeActive" className="text-sm font-medium cursor-pointer">
                  Active
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : editingPrize ? 'Update Prize' : 'Add Prize'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsPrizeDialogOpen(false)
                    setEditingPrize(null)
                    resetPrizeForm()
                  }}
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