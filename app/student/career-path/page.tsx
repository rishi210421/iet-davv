'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Student } from '@/types'
import { generateCareerPathPrediction } from '@/lib/ai'
import toast from 'react-hot-toast'
import { TrendingUp, Book, Code, Server, Cloud, Brain } from 'lucide-react'

const careerPaths = [
  {
    id: 'foundations',
    title: 'Foundations',
    icon: Book,
    description: 'Build strong fundamentals in programming and computer science',
    steps: ['Learn basic programming', 'Understand algorithms', 'Practice problem solving'],
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    icon: Code,
    description: 'Master DSA for technical interviews',
    steps: ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming'],
  },
  {
    id: 'webdev',
    title: 'Web Development',
    icon: Code,
    description: 'Build modern web applications',
    steps: ['HTML/CSS/JS', 'React/Next.js', 'Backend APIs'],
  },
  {
    id: 'backend',
    title: 'Backend Development',
    icon: Server,
    description: 'Design scalable server systems',
    steps: ['Database Design', 'API Development', 'System Design'],
  },
  {
    id: 'cloud',
    title: 'Cloud & DevOps',
    icon: Cloud,
    description: 'Deploy and manage cloud infrastructure',
    steps: ['AWS/Azure', 'Docker/Kubernetes', 'CI/CD'],
  },
  {
    id: 'ai',
    title: 'AI & Machine Learning',
    icon: Brain,
    description: 'Build intelligent systems',
    steps: ['ML Fundamentals', 'Deep Learning', 'NLP/CV'],
  },
]

export default function CareerPathPage() {
  const [user] = useAuthState(auth)
  const [student, setStudent] = useState<Student | null>(null)
  const [prediction, setPrediction] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
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

        // Generate AI prediction
        const aiPrediction = await generateCareerPathPrediction(
          data.skills || [],
          [], // interests would come from profile
          'Beginner'
        )
        setPrediction(aiPrediction)
      }
    } catch (error) {
      console.error('Error loading career path:', error)
      toast.error('Failed to load career path')
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
      <h1 className="text-3xl font-bold mb-6">Career Path</h1>

      {prediction && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6" />
            <h2 className="text-xl font-semibold">AI Prediction</h2>
          </div>
          <p className="text-lg">{prediction}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {careerPaths.map((path) => {
          const Icon = path.icon
          return (
            <div
              key={path.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon className="w-8 h-8 text-blue-600" />
                <h2 className="text-xl font-semibold">{path.title}</h2>
              </div>
              <p className="text-gray-600 mb-4">{path.description}</p>
              <ul className="space-y-2">
                {path.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
