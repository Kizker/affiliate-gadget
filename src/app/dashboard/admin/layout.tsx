import { Footer } from '@/components/layouts/footer'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/dashboard/sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar - Shows menu based on actual role (ADMIN vs SUPER_ADMIN) */}
      <Sidebar variant="light" />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Background Image with Overlay */}
        <div className="fixed inset-0 -z-10 lg:left-64">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80)',
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.92] via-blue-50/[0.99] to-white/[0.92]"></div>
        </div>

        {/* Main content - no navbar, start from top */}
        <main className="relative z-10 min-h-screen pb-8 pt-20 lg:pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <Footer variant="light" />
        <Toaster position="top-right" richColors />
      </div>
    </div>
  )
}
