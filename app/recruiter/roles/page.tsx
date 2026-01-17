'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Job } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

export default function RoleManagementPage() {
  const [user] = useAuthState(auth)
  const [jobs, setJobs] = useState<Job[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [] as string[],
    stipend: 0,
    workMode: [] as string[],
    maxApplicants: 10,
    deadline: '',
  })
  const [newRequirement, setNewRequirement] = useState('')
  const [recruiter, setRecruiter] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      // Load recruiter data
      const recruiterDoc = await getDoc(doc(db, 'recruiters', user.uid))
      if (recruiterDoc.exists()) {
        setRecruiter(recruiterDoc.data())
      }

      // Load jobs
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('recruiterId', '==', user.uid)
      )
      const snapshot = await getDocs(jobsQuery)
      const data = snapshot.docs.map((doc) => ({
        jobId: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as Job[]
      setJobs(data)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !recruiter) return

    try {
      await addDoc(collection(db, 'jobs'), {
        recruiterId: user.uid,
        companyName: recruiter.companyName,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        stipend: formData.stipend,
        workMode: formData.workMode,
        maxApplicants: formData.maxApplicants,
        deadline: new Date(formData.deadline),
        applicantCount: 0,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast.success('Job created successfully!')
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        requirements: [],
        stipend: 0,
        workMode: [],
        maxApplicants: 10,
        deadline: '',
      })
      loadData()
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error('Failed to create job')
    }
  }

  const handleCloseJob = async (jobId: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      })
      toast.success('Job closed')
      loadData()
    } catch (error) {
      console.error('Error closing job:', error)
      toast.error('Failed to close job')
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()],
      })
      setNewRequirement('')
    }
  }

  const toggleWorkMode = (mode: string) => {
    if (formData.workMode.includes(mode)) {
      setFormData({
        ...formData,
        workMode: formData.workMode.filter((m) => m !== mode),
      })
    } else {
      setFormData({
        ...formData,
        workMode: [...formData.workMode, mode],
      })
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
        <h1 className="text-3xl font-bold">Role Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create New Job</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    placeholder="Add requirement"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.map((req) => (
                    <span
                      key={req}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stipend (₹/month)
                  </label>
                  <input
                    type="number"
                    value={formData.stipend}
                    onChange={(e) =>
                      setFormData({ ...formData, stipend: parseInt(e.target.value) })
                    }
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Applicants
                  </label>
                  <input
                    type="number"
                    value={formData.maxApplicants}
                    onChange={(e) =>
                      setFormData({ ...formData, maxApplicants: parseInt(e.target.value) })
                    }
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Mode
                </label>
                <div className="flex gap-2">
                  {['Remote', 'Hybrid', 'On-site'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => toggleWorkMode(mode)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        formData.workMode.includes(mode)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Job
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {jobs.map((job) => (
          <div key={job.jobId} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{job.title}</h2>
                <p className="text-gray-600">{job.companyName}</p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    job.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {job.status}
                </span>
                {job.status === 'open' && (
                  <button
                    onClick={() => handleCloseJob(job.jobId)}
                    className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Close Job
                  </button>
                )}
              </div>
            </div>

            <p className="text-gray-700 mb-4">{job.description}</p>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Applicants</p>
                <p className="font-semibold">
                  {job.applicantCount} / {job.maxApplicants}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Stipend</p>
                <p className="font-semibold">₹{job.stipend.toLocaleString()}/month</p>
              </div>
              <div>
                <p className="text-gray-500">Deadline</p>
                <p className="font-semibold">{formatDate(job.deadline)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No jobs created yet. Create your first job!
        </div>
      )}
    </div>
  )
}
