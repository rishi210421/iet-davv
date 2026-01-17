'use client'

import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { collection, query, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Challenge, ChallengeSubmission, InterviewQuestion, MockInterview } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import { Code, Video, MessageSquare } from 'lucide-react'
import { analyzeInterview } from '@/lib/ai'

export default function PrepHubPage() {
  const [user] = useAuthState(auth)
  const [activeTab, setActiveTab] = useState<'challenges' | 'vlogs' | 'interview'>('challenges')
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [interviewQuestion, setInterviewQuestion] = useState<InterviewQuestion | null>(null)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    if (user && activeTab === 'challenges') {
      loadChallenges()
    } else if (user && activeTab === 'interview') {
      loadRandomQuestion()
    }
  }, [user, activeTab])

  const loadChallenges = async () => {
    try {
      const q = query(collection(db, 'challenges'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        challengeId: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Challenge[]
      setChallenges(data)
    } catch (error) {
      console.error('Error loading challenges:', error)
      toast.error('Failed to load challenges')
    }
  }

  const loadRandomQuestion = async () => {
    try {
      const q = query(collection(db, 'interview_questions'))
      const snapshot = await getDocs(q)
      const questions = snapshot.docs.map((doc) => ({
        questionId: doc.id,
        ...doc.data(),
      })) as InterviewQuestion[]
      
      if (questions.length > 0) {
        const random = questions[Math.floor(Math.random() * questions.length)]
        setInterviewQuestion(random)
      }
    } catch (error) {
      console.error('Error loading question:', error)
    }
  }

  const runTestCases = (code: string, testCases: any[]): { passed: number; total: number } => {
    // Simplified test case runner - in production, use a proper code execution service
    let passed = 0
    const total = testCases.length

    try {
      // This is a placeholder - real implementation would execute code safely
      testCases.forEach((testCase) => {
        // Mock execution
        passed++
      })
    } catch (error) {
      console.error('Error running tests:', error)
    }

    return { passed, total }
  }

  const handleSubmitChallenge = async () => {
    if (!user || !selectedChallenge) return

    setSubmitting(true)

    try {
      const result = runTestCases(code, selectedChallenge.testCases)
      const submission: Omit<ChallengeSubmission, 'submissionId'> = {
        challengeId: selectedChallenge.challengeId,
        studentId: user.uid,
        code,
        result: result.passed === result.total ? 'passed' : 'failed',
        score: Math.round((result.passed / result.total) * 100),
        testCasesPassed: result.passed,
        submittedAt: new Date(),
      }

      await addDoc(collection(db, 'challenge_submissions'), {
        ...submission,
        submittedAt: serverTimestamp(),
      })

      if (result.passed === result.total) {
        // Award elite points
        const studentDoc = await getDoc(doc(db, 'students', user.uid))
        if (studentDoc.exists()) {
          const currentPoints = studentDoc.data().elitePoints || 0
          await updateDoc(doc(db, 'students', user.uid), {
            elitePoints: currentPoints + selectedChallenge.rewardPoints,
          })
        }
        toast.success(`Challenge completed! +${selectedChallenge.rewardPoints} elite points`)
      } else {
        toast.error(`Some test cases failed. ${result.passed}/${result.total} passed`)
      }
    } catch (error) {
      console.error('Error submitting challenge:', error)
      toast.error('Failed to submit challenge')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartInterview = () => {
    setRecording(true)
    // In production, implement video recording
    toast.info('Interview recording started')
  }

  const handleStopInterview = async () => {
    if (!user || !interviewQuestion) return

    setRecording(false)
    // In production, upload video and get transcript
    const transcript = 'Mock transcript from video...'
    
    try {
      const analysis = await analyzeInterview(transcript, interviewQuestion.question, interviewQuestion.field)
      
      const mockInterview: Omit<MockInterview, 'mockInterviewId'> = {
        studentId: user.uid,
        questionId: interviewQuestion.questionId,
        videoUrl: '', // Would be uploaded to storage
        transcript: analysis.transcript,
        sentiment: analysis.sentiment,
        eyeContact: analysis.eyeContact,
        fillerWords: analysis.fillerWords,
        technicalDepth: analysis.technicalDepth,
        overallScore: analysis.overallScore,
        feedback: analysis.feedback,
        createdAt: new Date(),
      }

      await addDoc(collection(db, 'mock_interviews'), {
        ...mockInterview,
        createdAt: serverTimestamp(),
      })

      toast.success('Interview analyzed! Check your results.')
      loadRandomQuestion()
    } catch (error) {
      console.error('Error analyzing interview:', error)
      toast.error('Failed to analyze interview')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Prep Hub</h1>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'challenges'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="w-5 h-5 inline mr-2" />
            Micro-Internships
          </button>
          <button
            onClick={() => setActiveTab('vlogs')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'vlogs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="w-5 h-5 inline mr-2" />
            Intern Vlogs
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'interview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-5 h-5 inline mr-2" />
            AI Interview Coach
          </button>
        </div>
      </div>

      {activeTab === 'challenges' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Available Challenges</h2>
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div
                  key={challenge.challengeId}
                  onClick={() => {
                    setSelectedChallenge(challenge)
                    setCode(challenge.starterCode || '')
                  }}
                  className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedChallenge?.challengeId === challenge.challengeId
                      ? 'border-blue-500 bg-blue-50'
                      : ''
                  }`}
                >
                  <h3 className="font-semibold">{challenge.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                      {challenge.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 bg-yellow-200 rounded">
                      +{challenge.rewardPoints} points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {selectedChallenge ? (
              <>
                <h2 className="text-xl font-semibold mb-4">{selectedChallenge.title}</h2>
                <p className="text-gray-600 mb-4">{selectedChallenge.description}</p>
                <Editor
                  height="400px"
                  defaultLanguage="javascript"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                />
                <button
                  onClick={handleSubmitChallenge}
                  disabled={submitting || !code}
                  className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Solution'}
                </button>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Select a challenge to start coding
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'vlogs' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Intern Vlogs</h2>
          <p className="text-gray-600 mb-4">
            Share your internship experience! Upload a video (max 60 seconds).
          </p>
          <input
            type="file"
            accept="video/*"
            className="mb-4"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Upload Vlog
          </button>
        </div>
      )}

      {activeTab === 'interview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AI Interview Coach</h2>
          {interviewQuestion ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Field: {interviewQuestion.field}</p>
                <p className="text-lg font-medium">{interviewQuestion.question}</p>
              </div>
              <div className="flex gap-4">
                {!recording ? (
                  <button
                    onClick={handleStartInterview}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={handleStopInterview}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Stop & Analyze
                  </button>
                )}
                <button
                  onClick={loadRandomQuestion}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  New Question
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Loading question...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
