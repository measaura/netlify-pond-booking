"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { Game, Prize } from '@/types'
import { useToastSafe } from '@/components/ui/toast'
// Client-side will call serverless admin routes under /api/admin
const API_BASE = '/api/admin/games'

interface GameFormData {
  name: string
  type: 'TARGET_WEIGHT' | 'EXACT_WEIGHT' | 'HEAVIEST_WEIGHT'
  targetWeight?: number
  targetDirection?: 'uptrend' | 'downtrend' | null
  measurementUnit: 'kg' | 'cm' | 'other'
  decimalPlaces?: number
  description: string
  prizes: Prize[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function GamesManagementPage() {
  const toast = useToastSafe()
  const [games, setGames] = useState<Game[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [formData, setFormData] = useState<GameFormData>({
    name: '',
    type: 'HEAVIEST_WEIGHT',
    measurementUnit: 'kg',
    description: '',
    prizes: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const loadData = () => {
    setIsLoading(true)
    try {
      fetch(API_BASE)
        .then(res => res.json())
        .then(json => {
          if (json.ok) setGames(json.data)
          else throw new Error(json.error || 'Failed to load games')
        })
    } catch (error) {
      console.error('Error loading games:', error)
      toast ? toast.push({ message: 'Error loading games', variant: 'error' }) : window.alert('Error loading games')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate TARGET_WEIGHT games have required fields
      if (formData.type === 'TARGET_WEIGHT') {
        if (!formData.targetWeight) {
          throw new Error('Target weight is required for TARGET_WEIGHT games')
        }
        if (!formData.targetDirection) {
          throw new Error('Target direction is required for TARGET_WEIGHT games')
        }
      }
      
      // Validate EXACT_WEIGHT games have target weight
      if (formData.type === 'EXACT_WEIGHT') {
        if (!formData.targetWeight) {
          throw new Error('Target weight is required for EXACT_WEIGHT games')
        }
      }

      // Prepare data - only include fields that exist in the Game model
      const gameData = {
        name: formData.name,
        type: formData.type,
        targetWeight: formData.targetWeight,
        targetDirection: formData.targetDirection,
        measurementUnit: formData.measurementUnit,
        decimalPlaces: formData.decimalPlaces,
        description: formData.description,
        isActive: formData.isActive
      }

      console.log('Submitting game data:', gameData)
      console.log('Is editing?', !!editingGame)

      // Create or update via API
      if (editingGame) {
        const res = await fetch(API_BASE, { method: 'PUT', body: JSON.stringify({ id: editingGame.id, ...gameData }), headers: { 'Content-Type': 'application/json' } })
        const json = await res.json()
        if (!json.ok) throw new Error(json.error || 'Failed to update game')
        toast ? toast.push({ message: 'Game updated successfully!', variant: 'success' }) : window.alert('Game updated successfully!')
      } else {
        const res = await fetch(API_BASE, { method: 'POST', body: JSON.stringify(gameData), headers: { 'Content-Type': 'application/json' } })
        const json = await res.json()
        if (!json.ok) throw new Error(json.error || 'Failed to create game')
        toast ? toast.push({ message: 'Game created successfully!', variant: 'success' }) : window.alert('Game created successfully!')
      }

      setIsDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving game:', error)
      toast ? toast.push({ message: 'Error saving game. Please try again.', variant: 'error' }) : window.alert('Error saving game. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'HEAVIEST_WEIGHT',
      measurementUnit: 'kg',
      decimalPlaces: 3,
      description: '',
      prizes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    setEditingGame(null)
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin/settings">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-xl font-bold">Games Management</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="max-w-4xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map(game => (
              <Card key={game.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{game.name}</h3>
                      <p className="text-sm text-gray-500">{game.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGame(game)
                          setFormData({
                            name: game.name,
                            type: (game as any).type || 'HEAVIEST_WEIGHT',
                            targetWeight: (game as any).targetWeight,
                            targetDirection: (game as any).targetDirection,
                            measurementUnit: game.measurementUnit,
                            decimalPlaces: game.decimalPlaces,
                            description: game.description,
                            prizes: game.prizes,
                            isActive: game.isActive,
                            createdAt: game.createdAt,
                            updatedAt: game.updatedAt
                          })
                          setIsDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this game?')) {
                            try {
                              const res = await fetch(API_BASE, { method: 'DELETE', body: JSON.stringify({ id: game.id }), headers: { 'Content-Type': 'application/json' } })
                              const json = await res.json()
                              if (json.ok) loadData()
                              else throw new Error(json.error || 'Failed to delete game')
                            } catch (error) {
                              toast ? toast.push({ 
                                message: error instanceof Error ? error.message : 'Failed to delete game', 
                                variant: 'error' 
                              }) : window.alert(error instanceof Error ? error.message : 'Failed to delete game')
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Game Details - Full Width */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Type:</span>{' '}
                        {(game as any).type === 'HEAVIEST_WEIGHT' && 'Heaviest Weight'}
                        {(game as any).type === 'TARGET_WEIGHT' && 'Target Weight'}
                        {(game as any).type === 'EXACT_WEIGHT' && 'Exact Weight'}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Unit:</span> {game.measurementUnit}
                      </div>
                    </div>
                    {(game as any).targetWeight && (
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-blue-900">Target:</span>
                          <span className="text-blue-700">{Number((game as any).targetWeight).toFixed(3)} kg</span>
                        </div>
                        {(game as any).targetDirection && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="font-medium text-blue-900">Direction:</span>
                            <span className="text-blue-700 capitalize">{(game as any).targetDirection}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Game Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Game Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'TARGET_WEIGHT' | 'EXACT_WEIGHT' | 'HEAVIEST_WEIGHT',
                    // Reset target fields when changing type
                    targetWeight: undefined,
                    targetDirection: null
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="HEAVIEST_WEIGHT">Heaviest Weight</option>
                  <option value="TARGET_WEIGHT">Target Weight</option>
                  <option value="EXACT_WEIGHT">Exact Weight</option>
                </select>
              </div>

              {/* Target Weight Configuration */}
              {(formData.type === 'TARGET_WEIGHT' || formData.type === 'EXACT_WEIGHT') && (
                <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900">Target Weight Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Target Weight (kg)</label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="e.g., 5.250"
                        value={formData.targetWeight || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '') {
                            setFormData(prev => ({ ...prev, targetWeight: undefined }))
                          } else {
                            const parsed = parseFloat(value)
                            // Round to 3 decimal places
                            const rounded = Math.round(parsed * 1000) / 1000
                            setFormData(prev => ({ ...prev, targetWeight: rounded }))
                          }
                        }}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum 3 decimal places</p>
                    </div>
                    
                    {formData.type === 'TARGET_WEIGHT' && (
                      <div>
                        <label className="text-sm font-medium">Target Direction</label>
                        <select
                          value={formData.targetDirection || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            targetDirection: e.target.value as 'uptrend' | 'downtrend' || null
                          }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Select direction</option>
                          <option value="uptrend">Uptrend</option>
                          <option value="downtrend">Downtrend</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {formData.type === 'TARGET_WEIGHT' && (
                    <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded space-y-1">
                      <p><strong>Uptrend:</strong> Only catches ≥ target weight are ranked. Nearest to target wins.</p>
                      <p><strong>Downtrend:</strong> Only catches ≤ target weight are ranked. Nearest to target wins.</p>
                    </div>
                  )}
                  
                  {formData.type === 'EXACT_WEIGHT' && (
                    <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                      <p><strong>Exact Weight:</strong> Only catches that exactly match the target weight are valid. First to achieve it wins.</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Measurement Unit</label>
                <select
                  value={formData.measurementUnit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    measurementUnit: e.target.value as 'kg' | 'cm' | 'other'
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      isActive: e.target.checked 
                    }))}
                    className="mr-2"
                  />
                  Active
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : editingGame ? 'Update Game' : 'Create Game'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
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