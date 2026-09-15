import { auth } from '@/auth'
import { AdminLayoutClient } from '@/components/dashboard/admin-layout-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <AdminLayoutClient userRole={session?.user?.role}>
      {children}
    </AdminLayoutClient>
  )
}
