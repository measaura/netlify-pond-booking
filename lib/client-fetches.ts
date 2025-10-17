// Small client-side fetch helpers to replace localStorage calls in the UI
export async function fetchPonds() {
  try {
    const res = await fetch('/api/ponds')
    if (!res.ok) return []
    const j = await res.json()
    return j.data || []
  } catch (e) {
    console.error('fetchPonds error', e)
    return []
  }
}

export async function fetchAllBookings() {
  try {
    const res = await fetch('/api/bookings')
    if (!res.ok) return []
    const j = await res.json()
    return j.data || []
  } catch (e) {
    console.error('fetchAllBookings error', e)
    return []
  }
}

export async function fetchEvents() {
  try {
    const res = await fetch('/api/events')
    if (!res.ok) return []
    const j = await res.json()
    return j.data || []
  } catch (e) {
    console.error('fetchEvents error', e)
    return []
  }
}
