"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SimpleCalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
}

export function SimpleCalendar({ 
  selected, 
  onSelect, 
  disabled = () => false,
  className 
}: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  
  // Get previous month's last days to fill the grid
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0)
  const prevMonthDays = prevMonth.getDate()
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const isSelected = (date: Date) => {
    if (!selected) return false
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    )
  }

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handleDateClick = (date: Date) => {
    if (disabled(date)) return
    onSelect?.(date)
  }

  // Generate calendar grid
  const calendarDays = []
  
  // Previous month's trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, prevMonthDays - i)
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isDisabled: disabled(date)
    })
  }
  
  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    calendarDays.push({
      date,
      isCurrentMonth: true,
      isDisabled: disabled(date)
    })
  }
  
  // Next month's leading days to fill 42 slots (6 weeks * 7 days)
  const remainingSlots = 42 - calendarDays.length
  for (let day = 1; day <= remainingSlots; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day)
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isDisabled: disabled(date)
    })
  }

  return (
    <div className={cn("p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={previousMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-sm font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="h-9 w-9 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((dayInfo, index) => {
          const { date, isCurrentMonth, isDisabled } = dayInfo
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={cn(
                "h-9 w-9 text-sm rounded-md transition-colors relative",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                !isCurrentMonth && "text-muted-foreground opacity-60",
                isSelected(date) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-current text-muted-foreground/70"
              )}
            >
              {date.getDate()}
              {/* Today indicator - small dot */}
              {isToday(date) && !isSelected(date) && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
