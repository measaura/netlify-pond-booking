'use client'

import { useEffect, useState } from 'react'
import { login } from '@/lib/auth'
import { fetchUnreadNotificationCount, fetchCurrentUserFromSession } from '@/lib/api'
import { testNotificationBadges } from '@/lib/testBadges'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [testResults, setTestResults] = useState<string>('')

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = () => {
    ;(async () => {
      const user = await fetchCurrentUserFromSession()
      const notificationCount = user ? await fetchUnreadNotificationCount() : 0
      const info: any = {
        currentUser: user,
        isLoggedIn: !!user,
        localStorage: {
          authState: typeof window !== 'undefined' ? localStorage.getItem('authState') : null,
          users: typeof window !== 'undefined' ? localStorage.getItem('users') : null,
          fishingAppDB: typeof window !== 'undefined' ? localStorage.getItem('fishingAppDB') : null,
        },
        notificationCount
      }
      setDebugInfo(info)
      setIsLoggedIn(!!user)
    })()
  }

  const testLogin = async (email: string, password: string) => {
    console.log('Attempting login with:', email)
    const success = await login(email, password)
    console.log('Login result:', success)
    if (success) {
      setTimeout(() => {
        checkAuthState()
      }, 100)
    }
  }

  const clearStorage = () => {
    localStorage.clear()
    checkAuthState()
  }

  const runBadgeTest = async () => {
    // Capture console output
    const originalLog = console.log
    const logs: string[] = []
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalLog(...args)
    }
    
    try {
      await testNotificationBadges()
      setTestResults(logs.join('\n'))
    } catch (error) {
      setTestResults('Error: ' + error)
    } finally {
      console.log = originalLog
      checkAuthState()
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Notification Badges</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Actions</h2>
          <div className="space-x-2 space-y-2">
            <button 
              onClick={() => testLogin('user1@fishing.com', '123456@$')}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Login as User 1
            </button>
            <button 
              onClick={() => testLogin('manager1@fishing.com', '123456@$')}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Login as Manager 1
            </button>
            <button 
              onClick={() => testLogin('admin@fishing.com', '123456@$')}
              className="bg-purple-500 text-white px-4 py-2 rounded"
            >
              Login as Admin
            </button>
            <button 
              onClick={clearStorage}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Clear Storage
            </button>
            <button 
              onClick={checkAuthState}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Refresh
            </button>
            <button 
              onClick={runBadgeTest}
              className="bg-orange-500 text-white px-4 py-2 rounded"
            >
              Run Badge Test
            </button>
          </div>
        </div>

        {testResults && (
          <div>
            <h2 className="text-lg font-semibold">Test Results</h2>
            <pre className="bg-black text-green-400 p-4 rounded text-sm overflow-auto">
              {testResults}
            </pre>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold">Debug Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {isLoggedIn && (
          <div>
            <h2 className="text-lg font-semibold">User Status</h2>
            <p>Logged in as: {debugInfo.currentUser?.name} (ID: {debugInfo.currentUser?.id})</p>
            <p>Role: {debugInfo.currentUser?.role}</p>
            <p>Notification Count: {debugInfo.notificationCount}</p>
          </div>
        )}
      </div>
    </div>
  )
}
