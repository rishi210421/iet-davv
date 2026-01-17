'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { collection, query, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Student, Challenge } from '@/types'
import toast from 'react-hot-toast'
import { Trophy, Code, Plus } from 'lucide-react'

export default function TopTalentPage() {
  const [user] = useAuthState(auth)
  const [students, setStudents] = useState<Student[]>([])
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    rewardPoints: 100,
    deadline: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTopTalent()
    }
  }, [user])

  const loadTopTalent = async () => {
    try {
      const studentsQuery = query(collection(db, 'students'))
      const snapshot = await getDocs(studentsQuery)
      const studentsData = snapshot.docs
        .map((doc) => ({
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Student[]

      // Sort by elite points and CGPA
      const sorted = studentsData
        .filter((s) => !s.isFrozen)
        .sort((a, b) => {
          const scoreA = a.elitePoints * 10 + a.cgpa * 100
          const scoreB = b.elitePoints * 10 + b.cgpa * 100
          return scoreB - scoreA
        })
        .slice(0, 20)

      setStudents(sorted)
    } catch (error) {
      console.error('Error loading top talent:', error)
      toast.error('Failed to load top talent')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await addDoc(collection(db, 'challenges'), {
        recruiterId: user.uid,
        ...challengeForm,
        deadline: new Date(challengeForm.deadline),
        testCases: [],
        createdAt: serverTimestamp(),
      })

      toast.success('Challenge created!')
      setShowChallengeForm(false)
      setChallengeForm({
        title: '',
        description: '',
        difficulty: 'medium',
        rewardPoints: 100,
        deadline: '',
      })
    } catch (error) {
      console.error('Error creating challenge:', error)
      toast.error('Failed to create challenge')
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
        <h1 className="text-3xl font-bold">Top Talent</h1>
        <button
          onClick={() => setShowChallengeForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Post Challenge
        </button>
      </div>

      {showChallengeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Create Challenge</h2>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={challengeForm.title}
                  onChange={(e) =>
                    setChallengeForm({ ...challengeForm, title: e.target.value })
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
                  value={challengeForm.description}
                  onChange={(e) =>
                    setChallengeForm({ ...challengeForm, description: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={challengeForm.difficulty}
                    onChange={(e) =>
                      setChallengeForm({
                        ...challengeForm,
                        difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward Points
                  </label>
                  <input
                    type="number"
                    value={challengeForm.rewardPoints}
                    onChange={(e) =>
                      setChallengeForm({
                        ...challengeForm,
                        rewardPoints: parseInt(e.target.value),
                      })
                    }
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={challengeForm.deadline}
                  onChange={(e) =>
                    setChallengeForm({ ...challengeForm, deadline: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Challenge
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {students.map((student, index) => (
          <div
            key={student.uid}
            className="bg-white rounded-lg shadow p-6 flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">#{index + 1} {student.name}</h2>
                <p className="text-gray-600">{student.email}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-blue-600 font-semibold">
                    {student.elitePoints} Elite Points
                  </span>
                  <span className="text-gray-600">CGPA: {student.cgpa}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {student.resumeUrl && (
                <a
                  href={student.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Resume
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
