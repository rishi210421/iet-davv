'use client'

import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function PlacementCellSetupPage() {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const [formData, setFormData] = useState({
    instituteName: '',
    address: '',
    coordinatorName: '',
    designation: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkExistingSetup()
    }
  }, [user])

  const checkExistingSetup = async () => {
    if (!user) return

    try {
      const placementCellQuery = await getDoc(
        doc(db, 'placement_cells', user.uid)
      )
      if (placementCellQuery.exists()) {
        router.push('/recruiter/dashboard')
      }
    } catch (error) {
      console.error('Error checking setup:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      await setDoc(doc(db, 'placement_cells', user.uid), {
        recruiterId: user.uid,
        ...formData,
        createdAt: serverTimestamp(),
      })

      toast.success('Placement cell setup completed!')
      router.push('/recruiter/dashboard')
    } catch (error) {
      console.error('Error setting up placement cell:', error)
      toast.error('Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Placement Cell Setup</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-6">
          Please provide your placement cell information to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institute Name
            </label>
            <input
              type="text"
              value={formData.instituteName}
              onChange={(e) =>
                setFormData({ ...formData, instituteName: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coordinator Name
            </label>
            <input
              type="text"
              value={formData.coordinatorName}
              onChange={(e) =>
                setFormData({ ...formData, coordinatorName: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
