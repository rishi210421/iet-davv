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
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Application, Job, Student } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const statusOptions = ['applied', 'shortlisted', 'interview', 'offered', 'rejected']

export default function ApplicantsPage() {
  const [user] = useAuthState(auth)
  const [applications, setApplications] = useState<
    (Application & { job: Job; student: Student })[]
  >([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadApplicants()
    }
  }, [user])

  const loadApplicants = async () => {
    if (!user) return

    try {
      // Get all jobs for this recruiter
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('recruiterId', '==', user.uid)
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobIds = jobsSnapshot.docs.map((doc) => doc.id)

      // Get all applications for these jobs
      const allApplications: (Application & { job: Job; student: Student })[] = []

      for (const jobId of jobIds) {
        const jobDoc = jobsSnapshot.docs.find((d) => d.id === jobId)
        if (!jobDoc) continue

        const job = {
          jobId: jobDoc.id,
          ...jobDoc.data(),
          deadline: jobDoc.data().deadline.toDate(),
          createdAt: jobDoc.data().createdAt.toDate(),
          updatedAt: jobDoc.data().updatedAt.toDate(),
        } as Job

        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobId', '==', jobId)
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)

        for (const appDoc of applicationsSnapshot.docs) {
          const app = {
            applicationId: appDoc.id,
            ...appDoc.data(),
            appliedAt: appDoc.data().appliedAt.toDate(),
            updatedAt: appDoc.data().updatedAt.toDate(),
          } as Application

          // Load student data
          const studentDoc = await getDoc(doc(db, 'students', app.studentId))
          if (studentDoc.exists()) {
            const student = {
              uid: studentDoc.id,
              ...studentDoc.data(),
              createdAt: studentDoc.data().createdAt?.toDate(),
              updatedAt: studentDoc.data().updatedAt?.toDate(),
            } as Student

            allApplications.push({ ...app, job, student })
          }
        }
      }

      setApplications(allApplications)
    } catch (error) {
      console.error('Error loading applicants:', error)
      toast.error('Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })
      toast.success('Status updated')
      loadApplicants()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Job', 'Status', 'Applied Date', 'CGPA', 'Skills']
    const rows = filteredApplications.map((app) => [
      app.student.name,
      app.student.email,
      app.job.title,
      app.status,
      formatDate(app.appliedAt),
      app.student.cgpa,
      app.student.skills.join(', '),
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'applicants.csv'
    a.click()
  }

  const filteredApplications =
    filterStatus === 'all'
      ? applications
      : applications.filter((app) => app.status === filterStatus)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Applicants</h1>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Job
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                CGPA
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
            {filteredApplications.map((app) => (
              <tr key={app.applicationId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{app.student.name}</p>
                    <p className="text-sm text-gray-500">{app.student.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">{app.job.title}</td>
                <td className="px-6 py-4">
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusUpdate(app.applicationId, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">{app.student.cgpa}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(app.appliedAt)}
                </td>
                <td className="px-6 py-4">
                  {app.student.resumeUrl && (
                    <a
                      href={app.student.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Resume
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No applicants found
        </div>
      )}
    </div>
  )
}
