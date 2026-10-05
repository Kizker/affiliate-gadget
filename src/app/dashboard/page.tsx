import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getDashboardRoute } from '@/lib/dashboard-utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await requireAuth()
  const dashboardRoute = getDashboardRoute(session.user.role)
  redirect(dashboardRoute)
}
