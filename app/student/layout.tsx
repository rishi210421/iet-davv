import AuthGuard from '@/components/AuthGuard'
import StudentSidebar from '@/components/StudentSidebar'
import AnnouncementStrip from '@/components/AnnouncementStrip'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="student">
      <div className="flex min-h-screen">
        <StudentSidebar />
        <div className="flex-1 flex flex-col">
          <AnnouncementStrip />
          <main className="flex-1 p-6 bg-gray-50">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
