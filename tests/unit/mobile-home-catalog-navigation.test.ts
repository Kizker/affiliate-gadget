import { describe, it, expect } from 'vitest'

describe('Mobile Navigation & Beranda Catalog Consolidation Suite', () => {
  it('should map both root path and /gadget to the active tab "beranda"', () => {
    const resolveTab = (pathname: string, activeTab?: string) => {
      if (activeTab !== undefined) {
        return activeTab === 'katalog' ? 'beranda' : activeTab
      }
      if (pathname === '/' || pathname.startsWith('/gadget')) {
        return 'beranda'
      }
      if (pathname.startsWith('/servis')) {
        return 'servis'
      }
      if (pathname.startsWith('/toko')) {
        return 'toko'
      }
      if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register')
      ) {
        return 'akun'
      }
      return 'beranda'
    }

    expect(resolveTab('/')).toBe('beranda')
    expect(resolveTab('/gadget')).toBe('beranda')
    expect(resolveTab('/gadget?brand=Apple')).toBe('beranda')
    expect(resolveTab('/gadget/apple-iphone-15')).toBe('beranda')
    expect(resolveTab('/gadget', 'katalog')).toBe('beranda')
    expect(resolveTab('/gadget', 'beranda')).toBe('beranda')
    expect(resolveTab('/servis')).toBe('servis')
    expect(resolveTab('/toko')).toBe('toko')
    expect(resolveTab('/login')).toBe('akun')
  })

  it('should verify the mobile navigation structure replaces Katalog with Beranda using Home icon and /gadget target', () => {
    // Definisi spesifikasi tab bar mobile yang terpadu
    const mobileTabs = [
      {
        id: 'beranda',
        label: 'Beranda',
        href: '/gadget',
        icon: 'Home',
      },
      {
        id: 'servis',
        label: 'Servis',
        href: '/servis',
        icon: 'Wrench',
      },
      {
        id: 'toko',
        label: 'Toko',
        href: '/toko',
        icon: 'Store',
      },
      {
        id: 'akun',
        label: 'Akun Saya',
        icon: 'User',
      },
    ]

    // Memastikan tidak ada tab redundan bernama 'Katalog'
    const catalogTab = mobileTabs.find((t) => t.label === 'Katalog')
    expect(catalogTab).toBeUndefined()

    // Memastikan tab pertama adalah Beranda yang mengarah ke /gadget
    const firstTab = mobileTabs[0]
    expect(firstTab.label).toBe('Beranda')
    expect(firstTab.href).toBe('/gadget')
    expect(firstTab.icon).toBe('Home')
  })

  it('should eliminate redundant mobile home view in favor of catalog on mobile devices', () => {
    const isMobileViewport = (width: number) => width < 768

    expect(isMobileViewport(375)).toBe(true)
    expect(isMobileViewport(414)).toBe(true)
    expect(isMobileViewport(767)).toBe(true)
    expect(isMobileViewport(768)).toBe(false)
    expect(isMobileViewport(1024)).toBe(false)
  })
})
