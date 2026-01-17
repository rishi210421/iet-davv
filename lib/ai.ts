import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const provider = process.env.AI_PROVIDER || 'openai'

let openaiClient: OpenAI | null = null
let geminiClient: GoogleGenerativeAI | null = null

if (typeof window === 'undefined') {
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  } else if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
}

export interface ResumeAnalysisResult {
  atsScore: number
  sections: {
    personal: { score: number; feedback: string }
    education: { score: number; feedback: string }
    experience: { score: number; feedback: string }
    skills: { score: number; feedback: string }
    projects: { score: number; feedback: string }
  }
  suggestions: string[]
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResult> {
  const prompt = `Analyze this resume text and provide a structured JSON response with:
1. ATS score (0-100)
2. Section-wise scores and feedback for: personal info, education, experience, skills, projects
3. Top 5 suggestions for improvement

Resume text:
${resumeText}

Return ONLY valid JSON in this format:
{
  "atsScore": number,
  "sections": {
    "personal": {"score": number, "feedback": "string"},
    "education": {"score": number, "feedback": "string"},
    "experience": {"score": number, "feedback": "string"},
    "skills": {"score": number, "feedback": "string"},
    "projects": {"score": number, "feedback": "string"}
  },
  "suggestions": ["string", "string", ...]
}`

  try {
    if (provider === 'openai' && openaiClient) {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        return JSON.parse(content)
      }
    } else if (provider === 'gemini' && geminiClient) {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-pro' })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
  } catch (error) {
    console.error('AI analysis error:', error)
  }

  // Fallback response
  return {
    atsScore: 75,
    sections: {
      personal: { score: 80, feedback: 'Good personal information' },
      education: { score: 75, feedback: 'Education section is clear' },
      experience: { score: 70, feedback: 'Could add more details' },
      skills: { score: 80, feedback: 'Skills are well listed' },
      projects: { score: 70, feedback: 'Projects need more description' },
    },
    suggestions: [
      'Add more quantifiable achievements',
      'Include relevant keywords from job descriptions',
      'Expand on project descriptions',
      'Add certifications if any',
      'Optimize formatting for ATS systems',
    ],
  }
}

export interface InterviewAnalysisResult {
  sentiment: number
  eyeContact: number
  fillerWords: number
  technicalDepth: number
  overallScore: number
  feedback: string
  transcript: string
}

export async function analyzeInterview(
  transcript: string,
  question: string,
  field: string
): Promise<InterviewAnalysisResult> {
  const prompt = `Analyze this interview answer transcript and provide a structured JSON response.

Question: ${question}
Field: ${field}
Answer Transcript: ${transcript}

Evaluate:
1. Sentiment (0-100): Positive tone and confidence
2. Eye Contact (0-100): Based on video analysis (estimate if not available)
3. Filler Words (0-100): Lower score = more filler words
4. Technical Depth (0-100): How well the answer demonstrates technical knowledge
5. Overall Score (0-100): Weighted average
6. Detailed feedback (string)
7. Clean transcript (string)

Return ONLY valid JSON:
{
  "sentiment": number,
  "eyeContact": number,
  "fillerWords": number,
  "technicalDepth": number,
  "overallScore": number,
  "feedback": "string",
  "transcript": "string"
}`

  try {
    if (provider === 'openai' && openaiClient) {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        return JSON.parse(content)
      }
    } else if (provider === 'gemini' && geminiClient) {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-pro' })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
  } catch (error) {
    console.error('AI analysis error:', error)
  }

  // Fallback response
  const fillerWordCount = (transcript.match(/\b(um|uh|like|you know|so|well)\b/gi) || []).length
  const fillerScore = Math.max(0, 100 - fillerWordCount * 10)

  return {
    sentiment: 75,
    eyeContact: 70,
    fillerWords: fillerScore,
    technicalDepth: 70,
    overallScore: 72,
    feedback: 'Good answer structure. Try to reduce filler words and provide more specific examples.',
    transcript: transcript,
  }
}

export async function generateCareerPathPrediction(
  skills: string[],
  interests: string[],
  currentLevel: string
): Promise<string> {
  const prompt = `Generate a motivational career path prediction banner text (max 150 characters) for a student with:
Skills: ${skills.join(', ')}
Interests: ${interests.join(', ')}
Current Level: ${currentLevel}

Make it inspiring and specific.`

  try {
    if (provider === 'openai' && openaiClient) {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
      })

      return response.choices[0]?.message?.content || 'Your career path is bright!'
    } else if (provider === 'gemini' && geminiClient) {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-pro' })
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text().substring(0, 150) || 'Your career path is bright!'
    }
  } catch (error) {
    console.error('AI prediction error:', error)
  }

  return 'Your career path is bright! Keep learning and growing.'
}
