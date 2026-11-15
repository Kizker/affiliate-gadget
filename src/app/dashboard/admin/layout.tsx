import { auth } from '@/auth'
import prisma from '@/lib/db'
import { AdminLayoutClient } from '@/components/dashboard/admin-layout-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  let storeSlug: string | null = null
  let isUserActive = true
  let hasStore = true

  if (session?.user?.id) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          isActive: true,
          role: true,
          storeId: true,
          store: {
            select: { slug: true },
          },
        },
      })
      storeSlug = dbUser?.store?.slug || null
      isUserActive = dbUser?.isActive ?? true
      if (dbUser?.role === 'STORE_ADMIN') {
        hasStore = !!dbUser.storeId && !!dbUser.store
      }
    } catch (e) {
      console.error('Error loading admin store slug in layout:', e)
    }
  }

  return (
    <AdminLayoutClient
      userRole={session?.user?.role}
      storeSlug={storeSlug}
      isUserActive={isUserActive}
      hasStore={hasStore}
    >
      {children}
    </AdminLayoutClient>
  )
}
