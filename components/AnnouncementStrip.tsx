'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Announcement } from '@/types'
import { formatDate } from '@/lib/utils'

export default function AnnouncementStrip() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(
          collection(db, 'announcements'),
          where('expiryDate', '>', new Date()),
          orderBy('expiryDate', 'asc'),
          limit(10)
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map((doc) => ({
          announcementId: doc.id,
          ...doc.data(),
          expiryDate: doc.data().expiryDate.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Announcement[]
        setAnnouncements(data)
      } catch (error) {
        console.error('Error fetching announcements:', error)
      }
    }

    fetchAnnouncements()
  }, [])

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [announcements.length])

  if (announcements.length === 0) return null

  const current = announcements[currentIndex]
  const typeColors = {
    trending: 'bg-purple-500',
    hackathon: 'bg-blue-500',
    opportunity: 'bg-green-500',
    alert: 'bg-red-500',
  }

  return (
    <div className="bg-gray-900 text-white py-2 overflow-hidden relative">
      <div className="flex items-center animate-scroll">
        <span
          className={`px-3 py-1 rounded text-xs font-semibold mr-4 ${typeColors[current.type]}`}
        >
          {current.type.toUpperCase()}
        </span>
        <span className="flex-1">{current.title}</span>
        {current.link && (
          <a
            href={current.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 text-blue-300 hover:text-blue-200 underline"
          >
            Learn More →
          </a>
        )}
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
