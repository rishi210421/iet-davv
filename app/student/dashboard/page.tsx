'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Student, Application, Interview, Offer } from '@/types'
import { formatDate } from '@/lib/utils'
import { Briefcase, Calendar, Award, Snowflake } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateDoc } from 'firebase/firestore'

export default function StudentDashboard() {
  const [user] = useAuthState(auth)
  const [student, setStudent] = useState<Student | null>(null)
  const [stats, setStats] = useState({
    activeApplications: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboard()
    }
  }, [user])

  const loadDashboard = async () => {
    if (!user) return

    try {
      // Load student data
      const studentDoc = await getDoc(doc(db, 'students', user.uid))
      if (studentDoc.exists()) {
        const data = {
          uid: studentDoc.id,
          ...studentDoc.data(),
          createdAt: studentDoc.data().createdAt?.toDate(),
          updatedAt: studentDoc.data().updatedAt?.toDate(),
        } as Student
        setStudent(data)
      }

      // Load applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', user.uid),
        where('status', 'in', ['applied', 'shortlisted', 'interview'])
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const activeApplications = applicationsSnapshot.size

      // Load interviews
      const interviewsQuery = query(
        collection(db, 'interviews'),
        where('studentId', '==', user.uid),
        where('status', '==', 'scheduled')
      )
      const interviewsSnapshot = await getDocs(interviewsQuery)
      const interviewsScheduled = interviewsSnapshot.size

      // Load offers
      const offersQuery = query(
        collection(db, 'offers'),
        where('studentId', '==', user.uid)
      )
      const offersSnapshot = await getDocs(offersQuery)
      const offersReceived = offersSnapshot.size

      setStats({
        activeApplications,
        interviewsScheduled,
        offersReceived,
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const toggleFreeze = async () => {
    if (!user || !student) return

    try {
      await updateDoc(doc(db, 'students', user.uid), {
        isFrozen: !student.isFrozen,
        updatedAt: new Date(),
      })
      setStudent({ ...student, isFrozen: !student.isFrozen })
      toast.success(
        student.isFrozen
          ? 'Profile unfrozen. You can now apply to jobs.'
          : 'Profile frozen. You are hidden from recruiters.'
      )
    } catch (error) {
      console.error('Error toggling freeze:', error)
      toast.error('Failed to update freeze status')
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
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Applications</p>
              <p className="text-3xl font-bold mt-2">{stats.activeApplications}</p>
            </div>
            <Briefcase className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Interviews Scheduled</p>
              <p className="text-3xl font-bold mt-2">{stats.interviewsScheduled}</p>
            </div>
            <Calendar className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Offers Received</p>
              <p className="text-3xl font-bold mt-2">{stats.offersReceived}</p>
            </div>
            <Award className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Freeze Status</p>
              <button
                onClick={toggleFreeze}
                className={`mt-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  student?.isFrozen
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {student?.isFrozen ? 'Frozen' : 'Active'}
              </button>
            </div>
            <Snowflake className="w-12 h-12 text-gray-500" />
          </div>
        </div>
      </div>

      {student && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Completion</h2>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${student.profileCompletion}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {student.profileCompletion}% complete
          </p>
        </div>
      )}
    </div>
  )
}
