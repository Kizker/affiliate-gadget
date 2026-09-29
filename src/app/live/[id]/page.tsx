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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    const res = await fetch(`${baseUrl}/api/live-streams/${id}`, {
      next: { revalidate: 10 },
    })
    const data = await res.json()
    if (data.success && data.data) {
      const stream = data.data
      const storeName =
        stream.store?.name?.replace('Affiliate Gadget - ', '') || 'Toko'
      return {
        title: `${stream.title} — ${storeName} | Affiliate Gadget Live`,
        description:
          stream.description ||
          `Tonton live streaming ${storeName} di Affiliate Gadget`,
      }
    }
  } catch {
    /* ignore */
  }
  return {
    title: 'Live Streaming | Affiliate Gadget',
  }
}

export default async function LiveStreamPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar variant="dark" />

      <main className="mx-auto max-w-7xl px-3 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <LiveStreamViewer streamId={id} />
      </main>

      <Footer variant="dark" />
      <div className="block md:hidden">
        <MobileBottomNav activeTab="none" />
      </div>
    </div>
  )
}
