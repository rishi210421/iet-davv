'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Application, Interview, Offer, Job } from '@/types'
import { Briefcase, Users, Calendar, Award } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function RecruiterDashboard() {
  const [user] = useAuthState(auth)
  const [stats, setStats] = useState({
    totalApplicants: 0,
    shortlisted: 0,
    interviews: 0,
    offers: 0,
  })
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [roleDistribution, setRoleDistribution] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboard()
    }
  }, [user])

  const loadDashboard = async () => {
    if (!user) return

    try {
      // Get all jobs for this recruiter
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('recruiterId', '==', user.uid)
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobIds = jobsSnapshot.docs.map((doc) => doc.id)

      // Get applications for these jobs
      let totalApplicants = 0
      let shortlisted = 0
      const roleCounts: Record<string, number> = {}

      for (const jobId of jobIds) {
        const jobDoc = jobsSnapshot.docs.find((d) => d.id === jobId)
        if (jobDoc) {
          const jobData = jobDoc.data()
          roleCounts[jobData.title] = (roleCounts[jobData.title] || 0) + 1
        }

        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobId', '==', jobId)
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)
        totalApplicants += applicationsSnapshot.size

        applicationsSnapshot.docs.forEach((doc) => {
          const app = doc.data()
          if (app.status === 'shortlisted' || app.status === 'interview') {
            shortlisted++
          }
        })
      }

      // Get interviews
      const interviewsQuery = query(
        collection(db, 'interviews'),
        where('status', '==', 'scheduled')
      )
      const interviewsSnapshot = await getDocs(interviewsQuery)
      let interviews = 0
      interviewsSnapshot.docs.forEach((doc) => {
        const interview = doc.data()
        if (jobIds.includes(interview.jobId)) {
          interviews++
        }
      })

      // Get offers
      const offersQuery = query(collection(db, 'offers'))
      const offersSnapshot = await getDocs(offersQuery)
      let offers = 0
      offersSnapshot.docs.forEach((doc) => {
        const offer = doc.data()
        if (jobIds.includes(offer.jobId)) {
          offers++
        }
      })

      setStats({
        totalApplicants,
        shortlisted,
        interviews,
        offers,
      })

      // Funnel data
      setFunnelData([
        { name: 'Applied', value: totalApplicants },
        { name: 'Shortlisted', value: shortlisted },
        { name: 'Interview', value: interviews },
        { name: 'Offered', value: offers },
      ])

      // Role distribution
      setRoleDistribution(
        Object.entries(roleCounts).map(([name, value]) => ({ name, value }))
      )
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Applicants</p>
              <p className="text-3xl font-bold mt-2">{stats.totalApplicants}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Shortlisted</p>
              <p className="text-3xl font-bold mt-2">{stats.shortlisted}</p>
            </div>
            <Briefcase className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Interviews</p>
              <p className="text-3xl font-bold mt-2">{stats.interviews}</p>
            </div>
            <Calendar className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Offers</p>
              <p className="text-3xl font-bold mt-2">{stats.offers}</p>
            </div>
            <Award className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recruitment Funnel</h2>
          <BarChart width={400} height={300} data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Role Distribution</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={roleDistribution}
              cx={200}
              cy={150}
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {roleDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>
    </div>
  )
}
