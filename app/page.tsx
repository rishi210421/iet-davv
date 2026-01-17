import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Career Oracle
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your Complete Recruitment & Placement Operating System
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          <Link
            href="/auth/signin?role=student"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              For Students
            </h2>
            <p className="text-gray-600 mb-4">
              Find opportunities, track applications, prepare for interviews, and
              grow your career.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500 space-y-2">
              <li>Job applications & tracking</li>
              <li>AI Resume Verifier</li>
              <li>Interview preparation</li>
              <li>Coding challenges</li>
              <li>Career path guidance</li>
            </ul>
          </Link>

          <Link
            href="/auth/signin?role=recruiter"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4 text-indigo-600">
              For Recruiters
            </h2>
            <p className="text-gray-600 mb-4">
              Discover top talent, manage hiring pipeline, and streamline your
              recruitment process.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500 space-y-2">
              <li>Post jobs & challenges</li>
              <li>Track applicants</li>
              <li>Schedule interviews</li>
              <li>Analytics & insights</li>
              <li>Top talent discovery</li>
            </ul>
          </Link>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">New here?</p>
          <div className="space-x-4">
            <Link
              href="/auth/signup?role=student"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up as Student
            </Link>
            <Link
              href="/auth/signup?role=recruiter"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign Up as Recruiter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
