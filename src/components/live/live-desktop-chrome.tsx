'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Client-only dynamic imports with ssr: false so desktop navbar & footer do not bloat mobile live bundle or block LCP/FCP
const Navbar = dynamic(
  () => import('@/components/layouts/navbar').then((m) => m.Navbar),
  { ssr: false }
)

const Footer = dynamic(
  () => import('@/components/layouts/footer').then((m) => m.Footer),
  { ssr: false }
)

export function LiveDesktopNavbar() {
  return (
    <div className="hidden md:block">
      <Navbar variant="light" />
    </div>
  )
}

export function LiveDesktopFooter() {
  return (
    <div className="hidden md:block">
      <Footer />
    </div>
  )
}
