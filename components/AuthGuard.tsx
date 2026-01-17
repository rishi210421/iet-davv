'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getUserRole } from '@/lib/firebase/auth'
import { UserRole } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  redirectTo?: string
}

export default function AuthGuard({
  children,
  requiredRole,
  redirectTo = '/auth/signin',
}: AuthGuardProps) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (requiredRole) {
          const role = await getUserRole(user.uid)
          if (role === requiredRole) {
            setAuthenticated(true)
          } else {
            router.push(redirectTo)
          }
        } else {
          setAuthenticated(true)
        }
      } else {
        router.push(redirectTo)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [requiredRole, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}
