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
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Offer, Job, Student } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle } from 'lucide-react'

export default function OfferManagementPage() {
  const [user] = useAuthState(auth)
  const [offers, setOffers] = useState<(Offer & { job: Job; student: Student })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOffers()
    }
  }, [user])

  const loadOffers = async () => {
    if (!user) return

    try {
      // Get all jobs for this recruiter
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('recruiterId', '==', user.uid)
      )
      const jobsSnapshot = await getDocs(jobsQuery)
      const jobIds = jobsSnapshot.docs.map((doc) => doc.id)

      // Get offers for these jobs
      const offersQuery = query(collection(db, 'offers'))
      const offersSnapshot = await getDocs(offersQuery)
      const offersData: (Offer & { job: Job; student: Student })[] = []

      for (const offerDoc of offersSnapshot.docs) {
        const offer = {
          offerId: offerDoc.id,
          ...offerDoc.data(),
          joiningDate: offerDoc.data().joiningDate.toDate(),
          createdAt: offerDoc.data().createdAt.toDate(),
        } as Offer

        if (jobIds.includes(offer.jobId)) {
          const jobDoc = jobsSnapshot.docs.find((d) => d.id === offer.jobId)
          if (jobDoc) {
            const job = {
              jobId: jobDoc.id,
              ...jobDoc.data(),
              deadline: jobDoc.data().deadline.toDate(),
              createdAt: jobDoc.data().createdAt.toDate(),
              updatedAt: jobDoc.data().updatedAt.toDate(),
            } as Job

            const studentDoc = await getDoc(doc(db, 'students', offer.studentId))
            if (studentDoc.exists()) {
              const student = {
                uid: studentDoc.id,
                ...studentDoc.data(),
                createdAt: studentDoc.data().createdAt?.toDate(),
                updatedAt: studentDoc.data().updatedAt?.toDate(),
              } as Student

              offersData.push({ ...offer, job, student })
            }
          }
        }
      }

      setOffers(offersData)
    } catch (error) {
      console.error('Error loading offers:', error)
      toast.error('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOffer = async (offerId: string) => {
    try {
      await updateDoc(doc(db, 'offers', offerId), {
        verified: true,
      })
      toast.success('Offer verified')
      loadOffers()
    } catch (error) {
      console.error('Error verifying offer:', error)
      toast.error('Failed to verify offer')
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
      <h1 className="text-3xl font-bold mb-6">Offer Management</h1>

      <div className="grid gap-6">
        {offers.map((offer) => (
          <div
            key={offer.offerId}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{offer.student.name}</h2>
                <p className="text-gray-600">{offer.job.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {offer.verified ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    Verified
                  </span>
                ) : (
                  <button
                    onClick={() => handleVerifyOffer(offer.offerId)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Verify Offer
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Package</p>
                <p className="font-semibold text-lg text-green-600">
                  ₹{offer.package.toLocaleString()}/year
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joining Date</p>
                <p className="font-semibold">{formatDate(offer.joiningDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold">
                  {offer.verified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>

            {offer.offerLetterUrl && (
              <div className="mt-4">
                <a
                  href={offer.offerLetterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Offer Letter →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {offers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No offers to manage yet
        </div>
      )}
    </div>
  )
}
