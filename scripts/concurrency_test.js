// concurrency_test.js
// Fires parallel POST requests to /api/bookings to test transaction safety

// Prefer global fetch (Node 18+). If not present, use a tiny fallback.
let _fetch = global.fetch
if (!_fetch) {
  const http = require('http')
  const https = require('https')
  _fetch = (url, opts = {}) => {
    return new Promise((resolve, reject) => {
      try {
        const lib = url.startsWith('https') ? https : http
        const u = new URL(url)
        const req = lib.request({
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search,
          method: opts.method || 'GET',
          headers: opts.headers || {},
        }, (res) => {
          const chunks = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8')
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: async () => body })
          })
        })
        req.on('error', reject)
        if (opts.body) req.write(opts.body)
        req.end()
      } catch (err) { reject(err) }
    })
  }
}

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const PATH = '/api/bookings';

async function sendBooking(i) {
  // Use a unique future date to avoid colliding with existing bookings
  const futureDate = new Date(Date.now() + 60_000).toISOString()
  const payload = {
    bookingId: `TEST_CONC_${Date.now()}_${i}`,
    type: 'POND',
    bookedByUserId: 1,
    pondId: 1,
    date: futureDate,
    timeSlotId: 1,
    seats: [ { number: i } ],
    totalPrice: 10,
  }

  try {
    const res = await fetch(API_BASE + PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, body: text }
  } catch (err) {
    return { ok: false, status: 0, body: String(err) }
  }
}

async function main() {
  const concurrency = parseInt(process.env.CONCURRENCY || '20', 10)
  console.log(`Running concurrency test: ${concurrency} parallel requests to ${API_BASE}${PATH}`)
  const promises = []
  for (let i = 0; i < concurrency; i++) promises.push(sendBooking(i + 1))

  const results = await Promise.all(promises)
  const successes = results.filter(r => r.ok)
  const failures = results.filter(r => !r.ok)

  console.log('Summary:')
  console.log('  total:', results.length)
  console.log('  successes:', successes.length)
  console.log('  failures:', failures.length)

  if (failures.length > 0) {
    console.log('\nFailures (first 10):')
    failures.slice(0,10).forEach((f, idx) => {
      console.log(`#${idx+1} status=${f.status} body=${f.body}`)
    })
  }

  if (successes.length > 0) {
    console.log('\nSuccesses (first 10):')
    successes.slice(0,10).forEach((s, idx) => {
      console.log(`#${idx+1} status=${s.status} body=${s.body.substring(0,200)}`)
    })
  }
}

main().catch(err => { console.error(err); process.exit(1) })
