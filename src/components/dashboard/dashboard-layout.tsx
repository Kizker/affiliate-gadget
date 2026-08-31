'use client'

import React from 'react'
import { SidebarProvider, useSidebar } from '@/context/sidebar-context'
import { Sidebar } from './sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  variant?: 'dark' | 'light'
}

function DashboardLayoutInner({
  children,
  variant = 'dark',
}: DashboardLayoutProps) {
  const { isCollapsed } = useSidebar()
  const isLight = variant === 'light'

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight ? 'bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100' : 'bg-slate-950 text-white'
      }`}
    >
      <Sidebar variant={variant} />
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}

      >
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px] transition-all duration-300">{children}</div>
        </main>
      </div>
    </div>
  )
}

export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner {...props} />
    </SidebarProvider>
  )
}

