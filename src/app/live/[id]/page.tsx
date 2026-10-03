import { Metadata } from 'next'
import prisma from '@/lib/db'
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
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: {
        store: { select: { name: true, city: true } },
      },
    })

    if (stream) {
      const storeName =
        stream.store?.name?.replace('Affiliate Gadget - ', '') || 'Toko Resmi'
      const title = `🔴 [LIVE] ${stream.title} — ${storeName}`
      const description =
        stream.description ||
        `Tonton siaran langsung demo & promo gadget original dari ${storeName}. Garansi 30 Hari Ganti Baru!`

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'
      const timestamp = stream.updatedAt
        ? new Date(stream.updatedAt).getTime()
        : Date.now()
      const imageUrl = `${baseUrl}/api/live-streams/${id}/thumbnail?t=${timestamp}`

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${baseUrl}/live/${id}`,
          siteName: 'Affiliate Gadget Live',
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: stream.title,
            },
          ],
          type: 'video.other',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [imageUrl],
        },
      }
    }
  } catch (err) {
    console.error('Error generating live metadata:', err)
  }
  return {
    title: 'Siaran Langsung Toko | Affiliate Gadget',
    description: 'Tonton siaran langsung penjualan gadget bergaransi resmi.',
  }
}

export default async function LiveStreamPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="flex min-h-screen flex-col justify-between bg-black text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100 md:bg-slate-50">
      {/* Desktop Only Navigation Bar */}
      <div className="hidden md:block">
        <Navbar variant="light" />
      </div>

      {/* Main Content Area */}
      <main className="h-[100dvh] w-full overflow-hidden md:mx-auto md:h-auto md:max-w-7xl md:flex-1 md:overflow-visible md:px-6 md:pb-16 md:pt-24 lg:px-8">
        <LiveStreamViewer streamId={id} />
      </main>

      {/* Desktop Only Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Bottom Nav Hidden during Live Streaming */}
      <div className="hidden">
        <MobileBottomNav activeTab="none" />
      </div>
    </div>
  )
}
