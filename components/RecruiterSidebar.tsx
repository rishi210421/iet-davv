'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Calendar,
  BarChart3,
  Award,
} from 'lucide-react'

const menuItems = [
  { href: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recruiter/top-talent', label: 'Top Talent', icon: Users },
  { href: '/recruiter/roles', label: 'Role Management', icon: Briefcase },
  { href: '/recruiter/applicants', label: 'Applicants', icon: FileText },
  { href: '/recruiter/interviews', label: 'Interview Schedule', icon: Calendar },
  { href: '/recruiter/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/recruiter/offers', label: 'Offer Management', icon: Award },
]

export default function RecruiterSidebar() {
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
                  ? 'bg-indigo-600 text-white'
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
