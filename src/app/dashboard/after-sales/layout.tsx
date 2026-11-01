import { auth } from '@/auth'
import prisma from '@/lib/db'
import { AdminLayoutClient } from '@/components/dashboard/admin-layout-client'

export const dynamic = 'force-dynamic'

export default async function AfterSalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  let storeSlug: string | null = null

  if (session?.user?.id) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          storeId: true,
          store: {
            select: { slug: true },
          },
        },
      })
      storeSlug = dbUser?.store?.slug || null
    } catch (e) {
      console.error('Error loading store slug in after-sales layout:', e)
    }
  }

  return (
    <AdminLayoutClient userRole={session?.user?.role} storeSlug={storeSlug}>
      {children}
    </AdminLayoutClient>
  )
}
