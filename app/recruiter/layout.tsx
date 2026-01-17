import AuthGuard from '@/components/AuthGuard'
import RecruiterSidebar from '@/components/RecruiterSidebar'

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="recruiter">
      <div className="flex min-h-screen">
        <RecruiterSidebar />
        <div className="flex-1">
          <main className="p-6 bg-gray-50">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
