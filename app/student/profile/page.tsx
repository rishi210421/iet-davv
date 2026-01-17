'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, storage } from '@/lib/firebase/config'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Student } from '@/types'
import toast from 'react-hot-toast'
import { User, Upload } from 'lucide-react'

export default function ProfilePage() {
  const [user] = useAuthState(auth)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    program: '',
    year: 1,
    cgpa: 0,
    graduationDate: '',
    skills: [] as string[],
    github: '',
    linkedin: '',
  })
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const studentDoc = await getDoc(doc(db, 'students', user.uid))
      if (studentDoc.exists()) {
        const data = {
          uid: studentDoc.id,
          ...studentDoc.data(),
          createdAt: studentDoc.data().createdAt?.toDate(),
          updatedAt: studentDoc.data().updatedAt?.toDate(),
        } as Student
        setStudent(data)
        setFormData({
          name: data.name,
          phone: data.phone,
          program: data.program,
          year: data.year,
          cgpa: data.cgpa,
          graduationDate: data.graduationDate,
          skills: data.skills || [],
          github: data.github || '',
          linkedin: data.linkedin || '',
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const calculateCompletion = (data: typeof formData): number => {
    let completed = 0
    const total = 10

    if (data.name) completed++
    if (data.phone) completed++
    if (data.program) completed++
    if (data.year) completed++
    if (data.cgpa) completed++
    if (data.graduationDate) completed++
    if (data.skills.length > 0) completed++
    if (data.github) completed++
    if (data.linkedin) completed++
    if (student?.resumeUrl) completed++

    return Math.round((completed / total) * 100)
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)

    try {
      const completion = calculateCompletion(formData)
      await updateDoc(doc(db, 'students', user.uid), {
        ...formData,
        profileCompletion: completion,
        updatedAt: serverTimestamp(),
      })

      setStudent({ ...student!, ...formData, profileCompletion: completion })
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return

    try {
      const file = e.target.files[0]
      const resumeRef = ref(storage, `resumes/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(resumeRef, file)
      const resumeUrl = await getDownloadURL(resumeRef)

      const completion = calculateCompletion(formData)
      await updateDoc(doc(db, 'students', user.uid), {
        resumeUrl,
        profileCompletion: completion,
        updatedAt: serverTimestamp(),
      })

      setStudent({ ...student!, resumeUrl, profileCompletion: completion })
      toast.success('Resume uploaded successfully!')
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error('Failed to upload resume')
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    })
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
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile Completion</h2>
          <span className="text-2xl font-bold text-blue-600">
            {student?.profileCompletion || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all"
            style={{ width: `${student?.profileCompletion || 0}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program
            </label>
            <input
              type="text"
              value={formData.program}
              onChange={(e) => setFormData({ ...formData, program: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              min="1"
              max="4"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CGPA
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.cgpa}
              onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Graduation Date
            </label>
            <input
              type="date"
              value={formData.graduationDate}
              onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub
            </label>
            <input
              type="url"
              value={formData.github}
              onChange={(e) => setFormData({ ...formData, github: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn
            </label>
            <input
              type="url"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              placeholder="Add a skill"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-blue-700 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            {student?.resumeUrl ? 'Update Resume' : 'Upload Resume'}
          </label>
          {student?.resumeUrl && (
            <a
              href={student.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 text-blue-600 hover:text-blue-800"
            >
              View Current Resume
            </a>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
