'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, storage } from '@/lib/firebase/config'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { ResumeAnalysis } from '@/types'
import { analyzeResume } from '@/lib/ai'
import toast from 'react-hot-toast'
import { FileText, Upload, CheckCircle } from 'lucide-react'

export default function ResumeVerifierPage() {
  const [user] = useAuthState(auth)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [resumeText, setResumeText] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // In production, use a PDF parsing library like pdf-parse
    // For now, return a placeholder
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        // This is a simplified version - in production use pdf-parse
        resolve('Resume text extracted from PDF...')
      }
      reader.readAsText(file)
    })
  }

  const handleAnalyze = async () => {
    if (!user || !file) return

    setAnalyzing(true)

    try {
      // Extract text from PDF
      const text = await extractTextFromPDF(file)
      setResumeText(text)

      // Analyze with AI
      const result = await analyzeResume(text)

      // Upload resume to storage
      const resumeRef = ref(storage, `resumes/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(resumeRef, file)
      const resumeUrl = await getDownloadURL(resumeRef)

      // Save analysis to Firestore
      const analysisData: Omit<ResumeAnalysis, 'analysisId'> = {
        studentId: user.uid,
        resumeUrl,
        atsScore: result.atsScore,
        sections: result.sections,
        suggestions: result.suggestions,
        analyzedAt: new Date(),
      }

      await addDoc(collection(db, 'resume_analysis'), analysisData)

      setAnalysis({
        analysisId: '',
        ...analysisData,
      })

      toast.success('Resume analyzed successfully!')
    } catch (error) {
      console.error('Error analyzing resume:', error)
      toast.error('Failed to analyze resume')
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadLatestAnalysis()
    }
  }, [user])

  const loadLatestAnalysis = async () => {
    if (!user) return

    try {
      const q = query(
        collection(db, 'resume_analysis'),
        where('studentId', '==', user.uid),
        orderBy('analyzedAt', 'desc'),
        limit(1)
      )
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const data = {
          analysisId: doc.id,
          ...doc.data(),
          analyzedAt: doc.data().analyzedAt.toDate(),
        } as ResumeAnalysis
        setAnalysis(data)
      }
    } catch (error) {
      console.error('Error loading analysis:', error)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">AI Resume Verifier</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              Choose File
            </label>
            {file && (
              <p className="mt-4 text-sm text-gray-600">{file.name}</p>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          {analysis ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">ATS Score</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {analysis.atsScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${analysis.atsScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Section Scores</h3>
                {Object.entries(analysis.sections).map(([key, value]) => (
                  <div key={key} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="capitalize font-medium">{key}</span>
                      <span className="text-sm font-semibold">{value.score}/100</span>
                    </div>
                    <p className="text-sm text-gray-600">{value.feedback}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Suggestions</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Upload and analyze your resume to see results
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
