'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AnalyticsPage() {
  const [user] = useAuthState(auth)
  const [conversionData, setConversionData] = useState<any[]>([])
  const [timeToHireData, setTimeToHireData] = useState<any[]>([])
  const [offerAcceptanceData, setOfferAcceptanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  const loadAnalytics = async () => {
    if (!user) return

    try {
      // Get all jobs for this recruiter
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('recruiterId', '==', user.uid)
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobIds = jobsSnapshot.docs.map((doc) => doc.id)

      // Calculate conversion rates
      const conversionRates: Record<string, { applied: number; offered: number }> = {}

      for (const jobId of jobIds) {
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobId', '==', jobId)
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)
        const applied = applicationsSnapshot.size
        const offered = applicationsSnapshot.docs.filter(
          (doc) => doc.data().status === 'offered'
        ).length

        const jobDoc = jobsSnapshot.docs.find((d) => d.id === jobId)
        if (jobDoc) {
          const jobTitle = jobDoc.data().title
          conversionRates[jobTitle] = { applied, offered }
        }
      }

      setConversionData(
        Object.entries(conversionRates).map(([name, data]) => ({
          name,
          'Conversion Rate': data.applied > 0 ? (data.offered / data.applied) * 100 : 0,
        }))
      )

      // Mock time to hire data
      setTimeToHireData([
        { month: 'Jan', days: 15 },
        { month: 'Feb', days: 18 },
        { month: 'Mar', days: 12 },
        { month: 'Apr', days: 20 },
        { month: 'May', days: 14 },
        { month: 'Jun', days: 16 },
      ])

      // Mock offer acceptance data
      setOfferAcceptanceData([
        { month: 'Jan', accepted: 8, rejected: 2 },
        { month: 'Feb', accepted: 10, rejected: 1 },
        { month: 'Mar', accepted: 7, rejected: 3 },
        { month: 'Apr', accepted: 9, rejected: 2 },
        { month: 'May', accepted: 11, rejected: 1 },
        { month: 'Jun', accepted: 9, rejected: 2 },
      ])
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Conversion Rate by Role</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Conversion Rate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Time to Hire (Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeToHireData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="days" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Offer Acceptance Rate</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={offerAcceptanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="accepted" fill="#10b981" />
            <Bar dataKey="rejected" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
