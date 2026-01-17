'use client'

import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Offer, Job, Application } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Award, Download, CheckCircle } from 'lucide-react'

export default function OffersPage() {
  const [user] = useAuthState(auth)
  const [offers, setOffers] = useState<(Offer & { job: Job })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOffers()
    }
  }, [user])

  const loadOffers = async () => {
    if (!user) return

    try {
      // First get all applications with status 'offered'
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('studentId', '==', user.uid),
        where('status', '==', 'offered')
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)
      const offeredJobIds = applicationsSnapshot.docs.map((doc) => doc.data().jobId)

      // Then get offers for those jobs
      const offersQuery = query(
        collection(db, 'offers'),
        where('studentId', '==', user.uid)
      )
      const offersSnapshot = await getDocs(offersQuery)
      const offersData = await Promise.all(
        offersSnapshot.docs.map(async (doc) => {
          const data = {
            offerId: doc.id,
            ...doc.data(),
            joiningDate: doc.data().joiningDate.toDate(),
            createdAt: doc.data().createdAt.toDate(),
          } as Offer

          const jobDoc = await getDoc(doc(db, 'jobs', data.jobId))
          const job = jobDoc.exists()
            ? ({
                jobId: jobDoc.id,
                ...jobDoc.data(),
                deadline: jobDoc.data().deadline.toDate(),
                createdAt: jobDoc.data().createdAt.toDate(),
                updatedAt: jobDoc.data().updatedAt.toDate(),
              } as Job)
            : null

          return { ...data, job: job! }
        })
      )

      setOffers(offersData.filter((offer) => offer.job))
    } catch (error) {
      console.error('Error loading offers:', error)
      toast.error('Failed to load offers')
    } finally {
      setLoading(false)
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
      <h1 className="text-3xl font-bold mb-6">My Offers</h1>

      <div className="grid gap-6">
        {offers.map((offer) => (
          <div
            key={offer.offerId}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{offer.job.title}</h2>
                <p className="text-lg text-gray-600">{offer.job.companyName}</p>
              </div>
              <div className="flex items-center gap-2">
                {offer.verified && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Package</p>
                <p className="text-xl font-bold text-green-600">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Download Offer Letter
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {offers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No offers received yet. Keep applying!
        </div>
      )}
    </div>
  )
}
