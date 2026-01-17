'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Job, Student, Application } from '@/types'
import { formatDate, calculateMatchScore } from '@/lib/utils'
import toast from 'react-hot-toast'
import { addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore'

export default function AvailableRolesPage() {
  const [user] = useAuthState(auth)
  const [jobs, setJobs] = useState<Job[]>([])
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
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

      // Load open jobs
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('status', '==', 'open')
      )
      const snapshot = await getDocs(jobsQuery)
      const jobsData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          jobId: docSnap.id,
          ...data,
          applicantCount: data.applicantCount ?? 0, // ✅ DEFAULT FIX
          workMode: Array.isArray(data.workMode) ? data.workMode : [data.workMode], // ✅ FIX
          deadline: data.deadline.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        }
      }) as Job[]
      

      // Check existing applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', user.uid)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const appliedJobIds = new Set(
        applicationsSnapshot.docs.map((doc) => doc.data().jobId)
      )

      // Calculate match scores and filter
      const jobsWithMatch = jobsData.map((job) => {
        const matchScore = student
          ? calculateMatchScore(student.skills, job.requirements || [], student.cgpa)
          : 0
        return {
          ...job,
          matchScore,
          hasApplied: appliedJobIds.has(job.jobId),
        }
      })

      setJobs(jobsWithMatch.sort((a, b) => b.matchScore - a.matchScore))
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (job: Job) => {
    if (!user || !student) return

    if (student.isFrozen) {
      toast.error('Your profile is frozen. Unfreeze to apply.')
      return
    }

    if ((job.applicantCount ?? 0) >= job.maxApplicants) {
      toast.error('This job has reached maximum applicants')
      return
    }

    setApplying(job.jobId)

    try {
      // Transaction-like check
      const jobDoc = await getDoc(doc(db, 'jobs', job.jobId))
      if (!jobDoc.exists()) {
        toast.error('Job not found')
        return
      }
      const currentCount = jobDoc.data().applicantCount ?? 0
      if (currentCount >= job.maxApplicants) {
        toast.error('This job has reached maximum applicants')
        return
      }

      // Create application
      const applicationData = {
        studentId: user.uid,
        jobId: job.jobId,
        status: 'applied',
        appliedAt: serverTimestamp(),
        queueRank: currentCount + 1,
        aiScore: calculateMatchScore(
          student.skills,
          job.requirements || [],
          student.cgpa
        ),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'applications'), applicationData)

      // Increment applicant count
      await updateDoc(doc(db, 'jobs', job.jobId), {
        applicantCount: increment(1),
        updatedAt: serverTimestamp(),
      })

      toast.success('Application submitted successfully!')
      loadData()
    } catch (error) {
      console.error('Error applying:', error)
      toast.error('Failed to submit application')
    } finally {
      setApplying(null)
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
      <h1 className="text-3xl font-bold mb-6">Available Roles</h1>

      <div className="grid gap-6">
        {jobs.map((job) => (
          <div
            key={job.jobId}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {job.title}
                </h2>
                <p className="text-lg text-gray-600">{job.companyName}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {job.matchScore}%
                </div>
                <div className="text-sm text-gray-500">Match</div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{job.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.workMode.map((mode) => (
                <span
                  key={mode}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {mode}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>Deadline: {formatDate(job.deadline)}</p>
                <p>
                  Slots left:{' '}
                  {Math.max(0, job.maxApplicants - job.applicantCount)} /{' '}
                  {job.maxApplicants}
                </p>
                <p className="font-semibold text-green-600">
                  ₹{job.stipend.toLocaleString()}/month
                </p>
              </div>

              {job.hasApplied ? (
                <button
                  disabled
                  className="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                >
                  Applied
                </button>
              ) : (
                <button
                  onClick={() => handleApply(job)}
                  disabled={applying === job.jobId || job.applicantCount >= job.maxApplicants}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {applying === job.jobId ? 'Applying...' : 'Apply Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No jobs available at the moment
        </div>
      )}
    </div>
  )
}
