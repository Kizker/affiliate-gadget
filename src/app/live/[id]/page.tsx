import { Metadata } from 'next'
import { headers } from 'next/headers'
import prisma from '@/lib/db'
import { parseUserAgent } from '@/lib/user-agent-parser'
import { LiveStreamViewer } from '@/components/live/live-stream-viewer'
import {
  LiveDesktopNavbar,
  LiveDesktopFooter,
} from '@/components/live/live-desktop-chrome'
import {
  getLiveStreamInitialData,
  getGuestViewerToken,
} from '@/lib/live-stream-data'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://affiliategadget.tech'

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

      const timestamp = stream.updatedAt
        ? new Date(stream.updatedAt).getTime()
        : Date.now()
      const imageUrl = `${baseUrl}/api/live-streams/${id}/thumbnail?t=${timestamp}`

      return {
        title,
        description,
        alternates: {
          canonical: `${baseUrl}/live/${id}`,
        },
        robots: {
          index: stream.status === 'LIVE',
          follow: true,
        },
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
    description:
      'Tonton siaran langsung demo & promo gadget original bergaransi resmi dari toko cabang terdekat. Demo interaktif & promo diskon eksklusif!',
    alternates: {
      canonical: `${baseUrl}/live/${id}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function LiveStreamPage({ params }: Props) {
  const { id } = await params

  // Detect mobile device on the server to prevent mobile hydration flash & double-mount
  const headerList = await headers()
  const ua = headerList.get('user-agent') || ''
  const isMobileDevice = parseUserAgent(ua).deviceType === 'mobile'

  // Preload initial stream data on the server to eliminate client loading spinner & drop LCP to < 2.5s
  const initialStream = await getLiveStreamInitialData(id)
  const initialToken = initialStream
    ? await getGuestViewerToken(initialStream)
    : null

  // Extract LiveKit domain for early preconnect
  const livekitUrl =
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    process.env.LIVEKIT_URL ||
    'https://affiliate-s0uljg9p.livekit.cloud'
  const livekitDomain = livekitUrl.replace(/^wss?:\/\//, 'https://')

  return (
    <div className="flex min-h-screen flex-col justify-between bg-black text-slate-900 selection:bg-orange-500 selection:text-white dark:bg-slate-950 dark:text-slate-100 md:bg-slate-50">
      {/* Early preconnect hints for LiveKit WebRTC connection */}
      <link rel="preconnect" href={livekitDomain} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={livekitDomain} />
      {/* High-priority preload for LCP stream cover poster */}
      {initialStream?.coverImage && (
        <link
          rel="preload"
          as="image"
          href={initialStream.coverImage}
          fetchPriority="high"
        />
      )}

      {/* Desktop Only Navigation Bar (Omitted on mobile to eliminate client chunk load & CSS blocking) */}
      {!isMobileDevice && <LiveDesktopNavbar />}

      {/* Main Content Area with Semantic Accessible Landmark */}
      <main
        id="main-content"
        role="main"
        className="h-[100dvh] w-full overflow-hidden md:mx-auto md:h-auto md:max-w-[1440px] md:flex-1 md:overflow-visible md:px-6 md:pb-16 md:pt-24 lg:px-8 xl:max-w-[1536px]"
      >
        <LiveStreamViewer
          streamId={id}
          initialStream={initialStream}
          initialToken={initialToken}
          initialIsMobile={isMobileDevice}
        />
      </main>

      {/* Desktop Only Footer (Omitted on mobile to eliminate client chunk load & CSS blocking) */}
      {!isMobileDevice && <LiveDesktopFooter />}
    </div>
  )
}
