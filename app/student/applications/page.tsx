'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Application, Job } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const statusColors = {
  applied: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-green-100 text-green-700',
  interview: 'bg-purple-100 text-purple-700',
  offered: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ApplicationsPage() {
  const [user] = useAuthState(auth)
  const [applications, setApplications] = useState<(Application & { job: Job })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<(Application & { job: Job }) | null>(null)

  useEffect(() => {
    if (user) {
      loadApplications()
    }
  }, [user])

  const loadApplications = async () => {
    if (!user) return

    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', user.uid)
      )
      const snapshot = await getDocs(applicationsQuery)
      const apps = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = {
            applicationId: docSnap.id,
            ...docSnap.data(),
           appliedAt: docSnap.data().appliedAt?.toDate?.() ?? null,
           updatedAt: docSnap.data().updatedAt?.toDate?.() ?? null,

          } as Application

          // Load job data
          const jobDoc = await getDoc(doc(db, 'jobs', data.jobId))
          const job = jobDoc.exists()
          ? ({
      jobId: jobDoc.id,
      ...jobDoc.data(),
      deadline: jobDoc.data().deadline?.toDate?.() ?? null,
      createdAt: jobDoc.data().createdAt?.toDate?.() ?? null,
      updatedAt: jobDoc.data().updatedAt?.toDate?.() ?? null,
      applicantCount: jobDoc.data().applicantCount ?? 0,
      workMode: Array.isArray(jobDoc.data().workMode)
        ? jobDoc.data().workMode
        : [jobDoc.data().workMode],
    } as Job)
  : null


          return { ...data, job: job! }
        })
      )

      setApplications(apps.filter((app) => app.job))
    }catch (error: any) {
  console.error('Error loading applications:', error)
  alert(error?.message || JSON.stringify(error))
  toast.error('Failed to load applications')
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
      <h1 className="text-3xl font-bold mb-6">My Applications</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Applied Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.map((app) => (
              <tr key={app.applicationId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {app.job.companyName}
                </td>
                <td className="px-6 py-4">{app.job.title}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[app.status]}`}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(app.appliedAt)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {applications.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No applications yet. Start applying to jobs!
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">Company</h3>
                <p>{selectedApp.job.companyName}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Role</h3>
                <p>{selectedApp.job.title}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Status</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[selectedApp.status]}`}
                >
                  {selectedApp.status}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Queue Rank</h3>
                <p>#{selectedApp.queueRank}</p>
              </div>
              {selectedApp.aiScore && (
                <div>
                  <h3 className="font-semibold text-gray-700">AI Match Score</h3>
                  <p>{selectedApp.aiScore}%</p>
                </div>
              )}
              {selectedApp.recruiterFeedback && (
                <div>
                  <h3 className="font-semibold text-gray-700">Recruiter Feedback</h3>
                  <p className="text-gray-600">{selectedApp.recruiterFeedback}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-700">Applied Date</h3>
                <p>{formatDate(selectedApp.appliedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
