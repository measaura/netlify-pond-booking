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
import { Prize } from '@/types'
import { getPrizes, addPrize, updatePrize, deletePrize } from '@/lib/localStorage'

interface PrizeFormData {
  name: string
  type: 'money' | 'item'
  value: number
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function PrizesManagementPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
  const [formData, setFormData] = useState<PrizeFormData>({
    name: '',
    type: 'money',
    value: 0,
    description: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const loadData = () => {
    setIsLoading(true)
    try {
      const allPrizes = getPrizes()
      setPrizes(allPrizes)
    } catch (error) {
      console.error('Error loading prizes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'money',
      value: 0,
      description: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingPrize) {
        // Update existing prize
        try {
          const updatedPrize = updatePrize(editingPrize.id, formData)
          if (updatedPrize) {
            loadData()
            setIsDialogOpen(false)
            setEditingPrize(null)
            resetForm()
          }
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Failed to update prize')
        }
      } else {
        // Add new prize
        try {
          const newPrize = addPrize(formData)
          if (newPrize) {
            loadData()
            setIsDialogOpen(false)
            resetForm()
          }
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Failed to add prize')
        }
      }
    } catch (error) {
      console.error('Error saving prize:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requiredRole='admin'>
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
                <h1 className="text-xl font-bold">Prizes Management</h1>
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

        {/* Prizes Grid */}
        <div className="max-w-4xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prizes.map(prize => (
              <Card key={prize.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{prize.name}</h3>
                      <p className="text-sm text-gray-500">{prize.description}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>Type: {prize.type}</div>
                        <div>Value: {prize.type === 'money' ? `RM${prize.value}` : `${prize.value} sets`}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPrize(prize)
                          setFormData({
                            name: prize.name,
                            type: prize.type,
                            value: prize.value,
                            description: prize.description,
                            isActive: prize.isActive,
                            createdAt: prize.createdAt,
                            updatedAt: prize.updatedAt
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
                              const success = deletePrize(prize.id)
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
              <DialogTitle>{editingPrize ? 'Edit Prize' : 'Add New Prize'}</DialogTitle>
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
              
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as Prize['type']
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="money">Money</option>
                    <option value="item">Item</option>
                  </select>
                </div>
              {/* </div>

              <div className="grid grid-cols-2 gap-4"> */}
                <div>
                  <label className="text-sm font-medium">Value</label>
                  <Input
                    type="number"
                    step="1"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      value: parseFloat(e.target.value) 
                    }))}
                    required
                  />
                </div>
                
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
                  {isLoading ? 'Saving...' : editingPrize ? 'Update Prize' : 'Create Prize'}
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