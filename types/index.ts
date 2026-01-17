export type UserRole = 'student' | 'recruiter'

export interface User {
  uid: string
  role: UserRole
  email: string
  createdAt: Date
}

export interface Student {
  uid: string
  name: string
  email: string
  phone: string
  studentId: string
  program: string
  year: number
  cgpa: number
  graduationDate: string
  skills: string[]
  github?: string
  linkedin?: string
  resumeUrl?: string
  isFrozen: boolean
  elitePoints: number
  profileCompletion: number
  createdAt: Date
  updatedAt: Date
}

export interface Recruiter {
  uid: string
  companyName: string
  companyEmail: string
  phone: string
  gstOrCin: string
  linkedinPage?: string
  industry: string
  size: string
  locations: string[]
  hiringTimeline: string
  recruiterHours: string
  techStack: string[]
  workMode: string[]
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PlacementCell {
  recruiterId: string
  instituteName: string
  address: string
  coordinatorName: string
  designation: string
  createdAt: Date
}

export interface Job {
  jobId: string
  recruiterId: string
  companyName: string
  title: string
  description: string
  requirements: string[]
  stipend: number
  workMode: string[]
  maxApplicants: number
  deadline: Date
  applicantCount: number
  status: 'open' | 'closed'
  createdAt: Date
  updatedAt: Date
}

export interface Application {
  applicationId: string
  studentId: string
  jobId: string
  status: 'applied' | 'shortlisted' | 'interview' | 'offered' | 'rejected'
  appliedAt: Date
  queueRank: number
  aiScore?: number
  recruiterFeedback?: string
  updatedAt: Date
}

export interface Interview {
  interviewId: string
  studentId: string
  jobId: string
  stage: string
  datetime: Date
  mode: 'online' | 'offline'
  link?: string
  address?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  createdAt: Date
}

export interface Offer {
  offerId: string
  studentId: string
  jobId: string
  offerLetterUrl: string
  joiningDate: Date
  package: number
  verified: boolean
  createdAt: Date
}

export interface Challenge {
  challengeId: string
  recruiterId: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  rewardPoints: number
  deadline: Date
  testCases: TestCase[]
  starterCode?: string
  createdAt: Date
}

export interface TestCase {
  input: string
  expectedOutput: string
  isHidden: boolean
}

export interface ChallengeSubmission {
  submissionId: string
  challengeId: string
  studentId: string
  code: string
  result: 'passed' | 'failed' | 'error'
  score: number
  testCasesPassed: number
  submittedAt: Date
}

export interface Vlog {
  vlogId: string
  studentId: string
  company: string
  videoUrl: string
  views: number
  createdAt: Date
}

export interface Announcement {
  announcementId: string
  title: string
  type: 'trending' | 'hackathon' | 'opportunity' | 'alert'
  description: string
  link?: string
  expiryDate: Date
  createdAt: Date
}

export interface InterviewQuestion {
  questionId: string
  field: string
  question: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface MockInterview {
  mockInterviewId: string
  studentId: string
  questionId: string
  videoUrl: string
  transcript: string
  sentiment: number
  eyeContact: number
  fillerWords: number
  technicalDepth: number
  overallScore: number
  feedback: string
  createdAt: Date
}

export interface ResumeAnalysis {
  analysisId: string
  studentId: string
  resumeUrl: string
  atsScore: number
  sections: {
    personal: { score: number; feedback: string }
    education: { score: number; feedback: string }
    experience: { score: number; feedback: string }
    skills: { score: number; feedback: string }
    projects: { score: number; feedback: string }
  }
  suggestions: string[]
  analyzedAt: Date
}
