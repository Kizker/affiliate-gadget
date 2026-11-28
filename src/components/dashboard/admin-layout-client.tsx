'use client'

import React, { useState, useEffect } from 'react'
import { SidebarProvider, useSidebar } from '@/context/sidebar-context'
import { AdminNotificationsProvider } from '@/context/admin-notifications-context'
import { Sidebar } from '@/components/dashboard/sidebar'
import { AdminNotificationBell } from '@/components/dashboard/admin-notification-bell'
import { ExternalLink, Store } from 'lucide-react'
import { AdminFooter } from '@/components/dashboard/admin-footer'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

function AdminLayoutInner({
  children,
  userRole,
  storeSlug,
  isUserActive = true,
  hasStore = true,
}: {
  children: React.ReactNode
  userRole?: string
  storeSlug?: string | null
  isUserActive?: boolean
  hasStore?: boolean
}) {
  const { isCollapsed } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const isChatPage =
    pathname?.startsWith('/dashboard/admin/chat') ||
    pathname?.startsWith('/dashboard/after-sales/chat')
  const isOnboardingPage = pathname?.startsWith('/dashboard/admin/onboarding')

  const [activeSlug, setActiveSlug] = useState<string | null>(storeSlug || null)
  const isStoreAdmin = userRole === 'STORE_ADMIN' || userRole === 'STORE_SALES'
  const needsStoreOnboarding =
    userRole === 'STORE_ADMIN' && (!isUserActive || !hasStore)

  useEffect(() => {
    if (needsStoreOnboarding && !isOnboardingPage) {
      router.replace('/dashboard/admin/onboarding')
    }
  }, [needsStoreOnboarding, isOnboardingPage, router])

  useEffect(() => {
    if (storeSlug) {
      setActiveSlug(storeSlug)
    } else if (isStoreAdmin && !activeSlug && hasStore) {
      fetch('/api/admin/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data?.store?.slug) {
            setActiveSlug(data.store.slug)
          }
        })
        .catch(() => {})
    }
  }, [storeSlug, isStoreAdmin, activeSlug, hasStore])

  // Superadmin -> Beranda website ('/?preview=1'), Admin Toko -> Halaman Toko Cabang ('/toko/[slug]')
  const publicHref = isStoreAdmin
    ? activeSlug
      ? `/toko/${activeSlug}`
      : '/toko'
    : '/?preview=1'

  // If store admin is in onboarding state, render clean distraction-free layout without locked sidebar
  if (isOnboardingPage || needsStoreOnboarding) {
    return (
      <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.webp"
              alt="Affiliate Gadget"
              className="h-7 w-7 rounded-lg object-contain"
            />
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              Affiliate<span className="text-orange-500">Gadget</span>{' '}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Toko
              </span>
            </span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Store className="h-3 w-3 text-slate-400" />
            <span>Beranda Publik</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </Link>
        </header>

        <main className="relative z-10 min-h-[calc(100vh-3.5rem)] w-full pb-12 pt-4 sm:pt-6">
          {children}
        </main>
        <AdminFooter isChatPage={false} />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar - Shows menu based on actual role */}
      <Sidebar variant="light" forceRole={userRole} storeSlug={activeSlug} />

      {/* Main Content Area with Desktop Left Offset that adjusts dynamically */}
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        } ${isChatPage ? 'h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden' : ''}`}
      >
        {/* Top Control Bar (Desktop & Mobile) */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Tombol buka-tutup side tab redundan di belakang burger button dihilangkan */}
          </div>

          {/* Right Header Quick Links & Notifications */}
          <div className="flex items-center gap-2.5">
            <AdminNotificationBell />

            {userRole !== 'AFTER_SALES' && (
              <Link
                href={publicHref}
                target="_blank"
                rel="noopener noreferrer"
                title={
                  isStoreAdmin
                    ? 'Buka Tampilan Halaman Toko Cabang Publik'
                    : 'Buka Halaman Depan Web Publik'
                }
                className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Store className="h-3 w-3 text-slate-400" />
                <span>Lihat Toko Publik</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Area: Fluid & adaptable max width */}
        <main
          className={`relative z-10 w-full overflow-x-hidden ${
            isChatPage
              ? 'flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] min-h-0 flex-1 flex-col overflow-hidden p-0'
              : 'min-h-[calc(100vh-3.5rem)] pb-12 pt-4 sm:pt-6'
          }`}
        >
          <div
            className={`mx-auto w-full transition-all duration-300 ${
              isChatPage
                ? 'flex h-full min-h-0 flex-1 flex-col px-0'
                : 'max-w-[1600px] px-3 sm:px-6 lg:px-8 xl:px-10'
            }`}
          >
            {children}
          </div>
        </main>

        {!isChatPage && <AdminFooter isChatPage={isChatPage} />}
      </div>
    </div>
  )
}

export function AdminLayoutClient({
  children,
  userRole,
  storeSlug,
  isUserActive = true,
  hasStore = true,
}: {
  children: React.ReactNode
  userRole?: string
  storeSlug?: string | null
  isUserActive?: boolean
  hasStore?: boolean
}) {
  return (
    <SidebarProvider>
      <AdminNotificationsProvider>
        <AdminLayoutInner
          userRole={userRole}
          storeSlug={storeSlug}
          isUserActive={isUserActive}
          hasStore={hasStore}
        >
          {children}
        </AdminLayoutInner>
      </AdminNotificationsProvider>
    </SidebarProvider>
  )
}
