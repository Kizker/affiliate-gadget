export interface ParsedClientDevice {
  deviceType: 'desktop' | 'mobile' | 'tablet'
  os: string
  browser: string
  deviceLabel: string
  browserLabel: string
}

/**
 * Accurately parses a User-Agent string into OS, browser, and device classification.
 */
export function parseUserAgent(uaString?: string | null): ParsedClientDevice {
  if (!uaString) {
    return {
      deviceType: 'desktop',
      os: 'Desktop (Windows)',
      browser: 'Google Chrome',
      deviceLabel: 'PC / Desktop (Windows)',
      browserLabel: 'Google Chrome',
    }
  }

  const ua = uaString.toLowerCase()

  // 1. Detect Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  if (
    /ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk/i.test(
      ua
    )
  ) {
    deviceType = 'tablet'
  } else if (
    /mobi|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)
  ) {
    deviceType = 'mobile'
  }

  // 2. Detect Operating System
  let os = 'Unknown OS'
  let osDetail = ''

  if (ua.includes('windows nt 10.0')) {
    // Windows 10 or 11 (Windows 11 shares NT 10.0 in user-agent string)
    os = 'Windows'
    osDetail = 'Windows 11 / 10'
  } else if (ua.includes('windows nt 6.3')) {
    os = 'Windows'
    osDetail = 'Windows 8.1'
  } else if (ua.includes('windows nt 6.2')) {
    os = 'Windows'
    osDetail = 'Windows 8'
  } else if (ua.includes('windows nt 6.1')) {
    os = 'Windows'
    osDetail = 'Windows 7'
  } else if (ua.includes('windows')) {
    os = 'Windows'
    osDetail = 'Windows'
  } else if (ua.includes('iphone')) {
    os = 'iOS'
    const match = ua.match(/os (\d+([_\.]\d+)?)/)
    const ver = match ? match[1].replace('_', '.') : ''
    osDetail = ver ? `iOS ${ver}` : 'iOS'
  } else if (ua.includes('ipad')) {
    os = 'iPadOS'
    const match = ua.match(/os (\d+([_\.]\d+)?)/)
    const ver = match ? match[1].replace('_', '.') : ''
    osDetail = ver ? `iPadOS ${ver}` : 'iPadOS'
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    os = 'macOS'
    const match = ua.match(/mac os x (\d+([_\.]\d+)?)/)
    const ver = match ? match[1].replace(/_/g, '.') : ''
    osDetail = ver ? `macOS ${ver}` : 'macOS'
  } else if (ua.includes('android')) {
    os = 'Android'
    const match = ua.match(/android (\d+(\.\d+)?)/)
    const ver = match ? match[1] : ''
    osDetail = ver ? `Android ${ver}` : 'Android'
  } else if (ua.includes('linux')) {
    os = 'Linux'
    osDetail = 'Linux'
  }

  // 3. Detect Browser
  let browser = 'Web Browser'
  if (ua.includes('edg/')) {
    browser = 'Microsoft Edge'
  } else if (ua.includes('opr/') || ua.includes('opera/')) {
    browser = 'Opera'
  } else if (ua.includes('chrome/') || ua.includes('crios/')) {
    browser = 'Google Chrome'
  } else if (ua.includes('firefox/') || ua.includes('fxios/')) {
    browser = 'Mozilla Firefox'
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Apple Safari'
  }

  // 4. Construct Clean Labels
  let deviceLabel = ''
  if (deviceType === 'desktop') {
    deviceLabel = `PC / Desktop (${osDetail || os})`
  } else if (deviceType === 'tablet') {
    deviceLabel = `Tablet (${osDetail || os})`
  } else {
    deviceLabel = `Smartphone (${osDetail || os})`
  }

  return {
    deviceType,
    os: osDetail || os,
    browser,
    deviceLabel,
    browserLabel: browser,
  }
}
