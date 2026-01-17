import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateMatchScore(
  studentSkills: string[],
  jobRequirements: string[],
  studentCGPA: number
): number {
  const skillMatch = studentSkills.filter((skill) =>
    jobRequirements.some((req) =>
      req.toLowerCase().includes(skill.toLowerCase())
    )
  ).length

  const skillScore = (skillMatch / Math.max(jobRequirements.length, 1)) * 60
  const cgpaScore = (studentCGPA / 10) * 40

  return Math.round(skillScore + cgpaScore)
}

export function validateCompanyEmail(email: string): boolean {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
  const domain = email.split('@')[1]?.toLowerCase()
  return !personalDomains.includes(domain || '')
}
