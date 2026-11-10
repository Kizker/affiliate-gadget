import { headers } from 'next/headers'
import { parseUserAgent } from '@/lib/user-agent-parser'
import { HomeClient } from '@/components/landing/home-client'

export default async function HomePage() {
  const headerList = await headers()
  const ua = headerList.get('user-agent') || ''
  const isMobileDevice = parseUserAgent(ua).deviceType === 'mobile'

  return <HomeClient initialIsMobile={isMobileDevice} />
}
