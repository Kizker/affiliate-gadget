'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'

interface FooterProps {
  variant?: 'light' | 'dark'
}

export function Footer({ variant = 'light' }: FooterProps) {
  return (
    <footer className="border-t border-slate-200/80 bg-white text-slate-600 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400 text-xs">
      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Main Footer Links: Justified Left & Right */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 lg:gap-16">
          
          {/* Left Anchor: Brand Info */}
          <div className="space-y-3.5 max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Affiliate Gadget Logo"
                className="h-8 w-8 rounded-xl object-contain shadow-2xs"
              />
              <span className="text-base font-black text-slate-950 dark:text-white tracking-tight">
                Affiliate<span className="text-orange-500">Gadget</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Platform marketplace gadget second / bekas berkualitas terpercaya di Indonesia. Menyediakan smartphone second original bergaransi toko 30 hari tukar unit dengan paket bonus lengkap 3-in-1.
            </p>
            <div className="flex items-center gap-2 text-slate-500">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-[11px] font-medium">Jaringan Toko Resmi di Indonesia</span>
            </div>
          </div>

          {/* Right Anchor: Nav Columns */}
          <div className="flex flex-wrap sm:flex-nowrap gap-12 sm:gap-20 md:gap-28 lg:gap-32">
            {/* Quick Links */}
            <div>
              <h5 className="font-bold text-slate-950 dark:text-white mb-3">Menu Utama</h5>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                <li><Link href="/" className="hover:text-orange-500 transition-colors">Beranda</Link></li>
                <li><Link href="/gadget" className="hover:text-orange-500 transition-colors">Katalog Produk</Link></li>
                <li><Link href="/toko" className="hover:text-orange-500 transition-colors">Jaringan Toko</Link></li>
                <li><Link href="/hubungi-kami" className="hover:text-orange-500 transition-colors">Pusat Bantuan</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h5 className="font-bold text-slate-950 dark:text-white mb-3">Merek Populer</h5>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400">
                <li><Link href="/gadget?brand=Apple" className="hover:text-orange-500 transition-colors">Apple iPhone</Link></li>
                <li><Link href="/gadget?brand=Samsung" className="hover:text-orange-500 transition-colors">Samsung Galaxy</Link></li>
                <li><Link href="/gadget?brand=Xiaomi" className="hover:text-orange-500 transition-colors">Xiaomi Series</Link></li>
                <li><Link href="/gadget?brand=ASUS" className="hover:text-orange-500 transition-colors">ASUS ROG Phone</Link></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Affiliate Gadget. All rights reserved. Platform Marketplace Gadget Terpercaya Indonesia.</p>
          <div className="flex items-center gap-4">
            <Link href="/garansi" className="hover:text-slate-600 dark:hover:text-slate-300">Ketentuan Garansi</Link>
            <Link href="/hubungi-kami" className="hover:text-slate-600 dark:hover:text-slate-300">Kontak Toko</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
