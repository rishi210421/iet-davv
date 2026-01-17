'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Briefcase,
  FileText,
  Calendar,
  Award,
  FileCheck,
  BookOpen,
  TrendingUp,
  User,
} from 'lucide-react'

const menuItems = [
  { href: '/student/dashboard', label: 'Home', icon: Home },
  { href: '/student/roles', label: 'Available Roles', icon: Briefcase },
  { href: '/student/applications', label: 'Applications', icon: FileText },
  { href: '/student/interviews', label: 'Interviews', icon: Calendar },
  { href: '/student/calendar', label: 'Smart Calendar', icon: Calendar },
  { href: '/student/offers', label: 'Offers', icon: Award },
  { href: '/student/resume-verifier', label: 'Resume Verifier', icon: FileCheck },
  { href: '/student/prep-hub', label: 'Prep Hub', icon: BookOpen },
  { href: '/student/career-path', label: 'Career Path', icon: TrendingUp },
  { href: '/student/profile', label: 'Profile', icon: User },
]

export default function StudentSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-8">Career Oracle</h1>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
