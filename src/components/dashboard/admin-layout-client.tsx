'use client'

import React from 'react'
import { SidebarProvider, useSidebar } from '@/context/sidebar-context'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Toaster } from 'sonner'
import {
  PanelLeft,
  ExternalLink,
  Store,
} from 'lucide-react'


import Link from 'next/link'
import { usePathname } from 'next/navigation'

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleCollapse, toggleMobile, isMobileOpen } = useSidebar()
  const pathname = usePathname()
  const isChatPage = pathname === '/dashboard/admin/chat'

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar - Shows menu based on actual role */}
      <Sidebar variant="light" />

      {/* Main Content Area with Desktop Left Offset that adjusts dynamically */}
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        } ${isChatPage ? 'h-screen max-h-screen overflow-hidden' : ''}`}
      >
        {/* Top Control Bar (Desktop & Mobile) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger */}
            <button
              onClick={toggleMobile}
              aria-label={isMobileOpen ? 'Tutup Menu' : 'Buka Menu'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 lg:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>


          {/* Right Header Quick Links */}
          <div className="flex items-center gap-2">

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Store className="h-3 w-3 text-slate-400" />
              <span>Lihat Toko Publik</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </Link>
          </div>
        </header>

        {/* Main Content Area: Fluid & adaptable max width */}
        <main
          className={`relative z-10 w-full overflow-x-hidden ${
            isChatPage
              ? 'flex-1 min-h-0 flex flex-col p-2 sm:p-3 overflow-hidden'
              : 'min-h-[calc(100vh-3.5rem)] pb-12 pt-4 sm:pt-6'
          }`}
        >
          <div
            className={`mx-auto w-full max-w-[1600px] transition-all duration-300 ${
              isChatPage ? 'h-full flex flex-col px-0 min-h-0' : 'px-3 sm:px-6 lg:px-8 xl:px-10'
            }`}
          >
            {children}
          </div>
        </main>

        <footer
          className={`border-t border-slate-200/60 text-center text-[11px] font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500 shrink-0 ${
            isChatPage ? 'py-2.5' : 'py-4'
          }`}
        >
          <p>© 2026 Affiliate Gadget • Platform Toko Resmi Indonesia</p>
        </footer>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              padding: '12px 16px',
              fontSize: '14px',
            },
            classNames: {
              success: 'bg-green-500 text-white border-green-500',
              error: 'bg-red-500 text-white border-red-500',
            },
          }}
        />
      </div>
    </div>
  )
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  )
}
