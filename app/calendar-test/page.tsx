"use client"

import { Calendar } from "@/components/ui/calendar"
import { SimpleCalendar } from "@/components/ui/simple-calendar"
import { useState } from "react"

export default function CalendarTestPage() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [simpleDate, setSimpleDate] = useState<Date | undefined>(undefined)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Calendar Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="max-w-md">
          <h2 className="text-lg font-semibold mb-4">Default shadcn Calendar:</h2>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>

        <div className="max-w-md">
          <h2 className="text-lg font-semibold mb-4">Simple Custom Calendar:</h2>
          <SimpleCalendar
            selected={simpleDate}
            onSelect={setSimpleDate}
            disabled={(date) => {
              // Disable past dates as an example
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return date < today
            }}
            className="rounded-md border"
          />
        </div>
      </div>
    </div>
  )
}
