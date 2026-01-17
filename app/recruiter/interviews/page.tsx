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
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Interview, Job, Application, Student } from '@/types'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'

export default function InterviewSchedulePage() {
  const [user] = useAuthState(auth)
  const [interviews, setInterviews] = useState<
    (Interview & { job: Job; student: Student })[]
  >([])
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [applications, setApplications] = useState<
    (Application & { job: Job; student: Student })[]
  >([])
  const [formData, setFormData] = useState({
    applicationId: '',
    stage: '',
    datetime: '',
    mode: 'online' as 'online' | 'offline',
    link: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      // Get all jobs for this recruiter
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('recruiterId', '==', user.uid)
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobIds = jobsSnapshot.docs.map((doc) => doc.id)

      // Load interviews
      const interviewsQuery = query(collection(db, 'interviews'))
      const interviewsSnapshot = await getDocs(interviewsQuery)
      const interviewsData: (Interview & { job: Job; student: Student })[] = []

      for (const interviewDoc of interviewsSnapshot.docs) {
        const interview = {
          interviewId: interviewDoc.id,
          ...interviewDoc.data(),
          datetime: interviewDoc.data().datetime.toDate(),
          createdAt: interviewDoc.data().createdAt.toDate(),
        } as Interview

        if (jobIds.includes(interview.jobId)) {
          const jobDoc = jobsSnapshot.docs.find((d) => d.id === interview.jobId)
          if (jobDoc) {
            const job = {
              jobId: jobDoc.id,
              ...jobDoc.data(),
              deadline: jobDoc.data().deadline.toDate(),
              createdAt: jobDoc.data().createdAt.toDate(),
              updatedAt: jobDoc.data().updatedAt.toDate(),
            } as Job

            const studentDoc = await getDoc(doc(db, 'students', interview.studentId))
            if (studentDoc.exists()) {
              const student = {
                uid: studentDoc.id,
                ...studentDoc.data(),
                createdAt: studentDoc.data().createdAt?.toDate(),
                updatedAt: studentDoc.data().updatedAt?.toDate(),
              } as Student

              interviewsData.push({ ...interview, job, student })
            }
          }
        }
      }

      setInterviews(interviewsData)

      // Load applications for scheduling
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
          where('jobId', '==', jobId),
          where('status', 'in', ['shortlisted', 'interview'])
        )
        const applicationsSnapshot = await getDocs(applicationsQuery)

        for (const appDoc of applicationsSnapshot.docs) {
          const app = {
            applicationId: appDoc.id,
            ...appDoc.data(),
            appliedAt: appDoc.data().appliedAt.toDate(),
            updatedAt: appDoc.data().updatedAt.toDate(),
          } as Application

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
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const selectedApp = applications.find(
        (app) => app.applicationId === formData.applicationId
      )
      if (!selectedApp) return

      await addDoc(collection(db, 'interviews'), {
        studentId: selectedApp.studentId,
        jobId: selectedApp.jobId,
        stage: formData.stage,
        datetime: new Date(formData.datetime),
        mode: formData.mode,
        link: formData.mode === 'online' ? formData.link : '',
        address: formData.mode === 'offline' ? formData.address : '',
        status: 'scheduled',
        createdAt: serverTimestamp(),
      })

      // Update application status
      await updateDoc(doc(db, 'applications', formData.applicationId), {
        status: 'interview',
        updatedAt: serverTimestamp(),
      })

      toast.success('Interview scheduled successfully!')
      setShowScheduleForm(false)
      setFormData({
        applicationId: '',
        stage: '',
        datetime: '',
        mode: 'online',
        link: '',
        address: '',
      })
      loadData()
    } catch (error) {
      console.error('Error scheduling interview:', error)
      toast.error('Failed to schedule interview')
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Interview Schedule</h1>
        <button
          onClick={() => setShowScheduleForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Schedule Interview</h2>
            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Applicant
                </label>
                <select
                  value={formData.applicationId}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose applicant...</option>
                  {applications.map((app) => (
                    <option key={app.applicationId} value={app.applicationId}>
                      {app.student.name} - {app.job.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage
                </label>
                <input
                  type="text"
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({ ...formData, stage: e.target.value })
                  }
                  required
                  placeholder="e.g., Technical Round 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) =>
                    setFormData({ ...formData, datetime: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="online"
                      checked={formData.mode === 'online'}
                      onChange={(e) =>
                        setFormData({ ...formData, mode: e.target.value as 'online' | 'offline' })
                      }
                      className="mr-2"
                    />
                    Online
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="offline"
                      checked={formData.mode === 'offline'}
                      onChange={(e) =>
                        setFormData({ ...formData, mode: e.target.value as 'online' | 'offline' })
                      }
                      className="mr-2"
                    />
                    Offline
                  </label>
                </div>
              </div>

              {formData.mode === 'online' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formData.mode === 'offline' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {interviews.map((interview) => (
          <div key={interview.interviewId} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{interview.student.name}</h2>
                <p className="text-gray-600">{interview.job.title}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  interview.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-700'
                    : interview.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {interview.status}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-semibold">{formatDateTime(interview.datetime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stage</p>
                <p className="font-semibold">{interview.stage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mode</p>
                <p className="font-semibold capitalize">{interview.mode}</p>
              </div>
              {interview.mode === 'online' && interview.link && (
                <div>
                  <p className="text-sm text-gray-500">Link</p>
                  <a
                    href={interview.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Join Interview
                  </a>
                </div>
              )}
            </div>
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
