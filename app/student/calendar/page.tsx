'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Interview, Job, Challenge } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Calendar as CalendarIcon, AlertCircle, Briefcase, Code } from 'lucide-react'

interface CalendarEvent {
  date: Date
  type: 'interview' | 'deadline' | 'challenge'
  title: string
  data: Interview | Job | Challenge
}

export default function SmartCalendarPage() {
  const [user] = useAuthState(auth)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadCalendarData()
    }
  }, [user, currentMonth])

  const loadCalendarData = async () => {
    if (!user) return

    try {
      const allEvents: CalendarEvent[] = []

      // Load interviews
      const interviewsQuery = query(
        collection(db, 'interviews'),
        where('studentId', '==', user.uid),
        where('status', '==', 'scheduled')
      )
      const interviewsSnapshot = await getDocs(interviewsQuery)
      interviewsSnapshot.docs.forEach((doc) => {
        const data = {
          interviewId: doc.id,
          ...doc.data(),
          datetime: doc.data().datetime.toDate(),
        } as Interview
        allEvents.push({
          date: data.datetime,
          type: 'interview',
          title: 'Interview',
          data,
        })
      })

      // Load job deadlines
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', user.uid)
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const jobIds = applicationsSnapshot.docs.map((doc) => doc.data().jobId)

      for (const jobId of jobIds) {
        const jobDoc = await getDoc(doc(db, 'jobs', jobId))
        if (jobDoc.exists()) {
          const job = {
            jobId: jobDoc.id,
            ...jobDoc.data(),
            deadline: jobDoc.data().deadline.toDate(),
          } as Job
          allEvents.push({
            date: job.deadline,
            type: 'deadline',
            title: job.title,
            data: job,
          })
        }
      }

      // Load challenges
      const challengesQuery = query(collection(db, 'challenges'))
      const challengesSnapshot = await getDocs(challengesQuery)
      challengesSnapshot.docs.forEach((doc) => {
        const challenge = {
          challengeId: doc.id,
          ...doc.data(),
          deadline: doc.data().deadline.toDate(),
        } as Challenge
        allEvents.push({
          date: challenge.deadline,
          type: 'challenge',
          title: challenge.title,
          data: challenge,
        })
      })

      setEvents(allEvents)
    } catch (error) {
      console.error('Error loading calendar:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getIntensity = (date: Date | null) => {
    if (!date) return 0
    const dayEvents = getEventsForDate(date)
    return Math.min(dayEvents.length, 5)
  }

  const days = getDaysInMonth(currentMonth)
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Smart Calendar</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Today
                </button>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-20"></div>
                }

                const intensity = getIntensity(day)
                const isToday =
                  day.toDateString() === new Date().toDateString()
                const isSelected =
                  selectedDate &&
                  day.toDateString() === selectedDate.toDateString()

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`h-20 border rounded-lg p-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500'
                        : isToday
                        ? 'border-blue-500'
                        : 'border-gray-200'
                    }`}
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${intensity * 0.2})`,
                    }}
                  >
                    <div className="text-sm font-semibold mb-1">{day.getDate()}</div>
                    <div className="flex gap-1 flex-wrap">
                      {getEventsForDate(day).slice(0, 3).map((event, i) => (
                        <span
                          key={i}
                          className={`text-xs px-1 rounded ${
                            event.type === 'interview'
                              ? 'bg-purple-500 text-white'
                              : event.type === 'deadline'
                              ? 'bg-red-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {event.type === 'interview' ? '🟣' : event.type === 'deadline' ? '🔴' : '⚠'}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedDate
                ? formatDate(selectedDate)
                : 'Select a date'}
            </h2>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((event, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      {event.type === 'interview' ? (
                        <CalendarIcon className="w-5 h-5 text-purple-500 mt-1" />
                      ) : event.type === 'deadline' ? (
                        <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
                      ) : (
                        <Code className="w-5 h-5 text-blue-500 mt-1" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{event.title}</h3>
                        {event.type === 'interview' && (
                          <p className="text-sm text-gray-600">
                            {formatDateTime((event.data as Interview).datetime)}
                          </p>
                        )}
                        {event.type === 'deadline' && (
                          <p className="text-sm text-gray-600">
                            Application deadline
                          </p>
                        )}
                        {event.type === 'challenge' && (
                          <p className="text-sm text-gray-600">
                            Challenge deadline
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No events scheduled
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
