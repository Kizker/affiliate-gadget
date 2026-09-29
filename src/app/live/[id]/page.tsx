import { Metadata } from 'next'
import { Navbar } from '@/components/layouts/navbar'
import { Footer } from '@/components/layouts/footer'
import { LiveStreamViewer } from '@/components/live/live-stream-viewer'
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/live-streams/${id}`, {
      next: { revalidate: 10 },
    })
    const data = await res.json()
    if (data.success && data.data) {
      const stream = data.data
      const storeName =
        stream.store?.name?.replace('Affiliate Gadget - ', '') || 'Toko Cabang'
      return {
        title: `${stream.title} — ${storeName} | Affiliate Gadget Live`,
        description:
          stream.description ||
          `Tonton siaran langsung toko cabang ${storeName} di platform resmi Affiliate Gadget`,
      }
    }
  } catch {
    /* ignore */
  }
  return {
    title: 'Siaran Langsung Toko | Affiliate Gadget',
  }
}

export default async function LiveStreamPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="light" />

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <LiveStreamViewer streamId={id} />
      </main>

      <Footer />
      <div className="block md:hidden">
        <MobileBottomNav activeTab="none" />
      </div>
    </div>
  )
}
