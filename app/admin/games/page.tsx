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
import { getGames, addGame, updateGame, deleteGame } from '@/lib/localStorage'

interface GameFormData {
  name: string
  type: 'heaviest' | 'nearest' | 'biggest' | 'other'
  targetValue?: number
  measurementUnit: 'kg' | 'cm' | 'other'
  decimalPlaces?: number
  description: string
  prizes: Prize[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function GamesManagementPage() {
  const [games, setGames] = useState<Game[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [formData, setFormData] = useState<GameFormData>({
    name: '',
    type: 'heaviest',
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
      const allGames = getGames()
      setGames(allGames)
    } catch (error) {
      console.error('Error loading games:', error)
      alert('Error loading games')
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
      if (editingGame) {
        const success = updateGame(editingGame.id, formData)
        if (success) {
          alert('Game updated successfully!')
        } else {
          throw new Error('Failed to update game')
        }
      } else {
        addGame(formData)
        alert('Game created successfully!')
      }

      setIsDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving game:', error)
      alert('Error saving game. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'heaviest',
      measurementUnit: 'kg',
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
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{game.name}</h3>
                      <p className="text-sm text-gray-500">{game.description}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className='grid grid-cols-3 gap-2'>
                          <div>Type: {game.type}</div>
                          <div>Unit: {game.measurementUnit}</div>
                          {game.targetValue && <div>Target: {game.targetValue} kg</div>}
                        </div>
                        {/* <div>Prize: {game.prizes.map(prize => prize.value).reduce((a, b) => a + b, 0) > 0 ? game.prizes.map(prize => prize.value).reduce((a, b) => a + b, 0) : 'No Prize'}</div> */}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGame(game)
                          setFormData({
                            name: game.name,
                            type: game.type,
                            targetValue: game.targetValue,
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
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this game?')) {
                            try {
                              const success = deleteGame(game.id)
                              if (success) {
                                loadData()
                              }
                            } catch (error) {
                              alert(error instanceof Error ? error.message : 'Failed to delete game')
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                <label className="text-sm font-medium">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as Game['type']
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="heaviest">Heaviest Catch</option>
                  <option value="nearest">Nearest Weight</option>
                  <option value="biggest">Biggest Size</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Measurement Unit</label>
                  <select
                    value={formData.measurementUnit}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      measurementUnit: e.target.value as Game['measurementUnit']
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {formData.type === 'nearest' && (
                  <div>
                    <label className="text-sm font-medium">Target Value</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.targetValue}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        targetValue: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                )}
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