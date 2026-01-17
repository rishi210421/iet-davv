'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Interview, Job } from '@/types'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

export default function InterviewsPage() {
  const [user] = useAuthState(auth)
  const [interviews, setInterviews] = useState<(Interview & { job: Job })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadInterviews()
    }
  }, [user])

  const loadInterviews = async () => {
    if (!user) return

    try {
      const interviewsQuery = query(
        collection(db, 'interviews'),
        where('studentId', '==', user.uid)
      )
      const snapshot = await getDocs(interviewsQuery)
      const interviewsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = {
            interviewId: doc.id,
            ...doc.data(),
            datetime: doc.data().datetime.toDate(),
            createdAt: doc.data().createdAt.toDate(),
          } as Interview

          const jobDoc = await getDoc(doc(db, 'jobs', data.jobId))
          const job = jobDoc.exists()
            ? ({
                jobId: jobDoc.id,
                ...jobDoc.data(),
                deadline: jobDoc.data().deadline.toDate(),
                createdAt: jobDoc.data().createdAt.toDate(),
                updatedAt: jobDoc.data().updatedAt.toDate(),
              } as Job)
            : null

          return { ...data, job: job! }
        })
      )

      // Check for overlaps
      const sortedInterviews = interviewsData
        .filter((i) => i.job)
        .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())

      // Mark overlaps
      const interviewsWithOverlaps = sortedInterviews.map((interview, index) => {
        const hasOverlap = sortedInterviews.some((other, otherIndex) => {
          if (index === otherIndex) return false
          const timeDiff = Math.abs(
            interview.datetime.getTime() - other.datetime.getTime()
          )
          return timeDiff < 60 * 60 * 1000 // 1 hour overlap
        })
        return { ...interview, hasOverlap }
      })

      setInterviews(interviewsWithOverlaps)
    } catch (error) {
      console.error('Error loading interviews:', error)
      toast.error('Failed to load interviews')
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
      <h1 className="text-3xl font-bold mb-6">My Interviews</h1>

      <div className="grid gap-6">
        {interviews.map((interview) => (
          <div
            key={interview.interviewId}
            className={`bg-white rounded-lg shadow p-6 ${
              interview.hasOverlap ? 'border-2 border-red-500' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{interview.job.title}</h2>
                <p className="text-lg text-gray-600">{interview.job.companyName}</p>
              </div>
              {interview.hasOverlap && (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-semibold">Clash</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-semibold">{formatDateTime(interview.datetime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mode</p>
                <p className="font-semibold capitalize">{interview.mode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stage</p>
                <p className="font-semibold">{interview.stage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold capitalize">{interview.status}</p>
              </div>
            </div>

            {interview.mode === 'online' && interview.link && (
              <div className="mb-4">
                <a
                  href={interview.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Join Interview Link
                </a>
              </div>
            )}

            {interview.mode === 'offline' && interview.address && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Address</p>
                <p>{interview.address}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {interviews.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No interviews scheduled yet
        </div>
      )}
    </div>
  )
}
