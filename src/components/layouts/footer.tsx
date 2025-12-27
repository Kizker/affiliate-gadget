import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

interface FooterProps {
  variant?: 'dark' | 'light'
}

export function Footer({ variant = 'dark' }: FooterProps) {
  const isLight = variant === 'light'

  return (
    <footer
      className={`border-t px-4 py-12 sm:px-6 sm:py-16 lg:px-8 ${
        isLight ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Desktop: 4 columns, Mobile: custom layout */}
        <div className="mb-8">
          {/* Mobile Layout */}
          <div className="grid grid-cols-1 gap-8 lg:hidden">
            {/* HaloTekno Section - Full Width */}
            <div className="text-center">
              <h3
                className={`bg-gradient-to-r text-2xl font-bold ${
                  isLight
                    ? 'from-cyan-600 to-blue-600'
                    : 'from-cyan-400 to-blue-500'
                } mb-4 bg-clip-text text-transparent`}
              >
                HaloTekno
              </h3>
              <p
                className={`mb-6 text-sm ${
                  isLight ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                Platform servis HP terpercaya dengan layanan profesional dan
                teknisi bersertifikat
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href="#"
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      : 'bg-gray-800 hover:bg-cyan-500'
                  }`}
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      : 'bg-gray-800 hover:bg-cyan-500'
                  }`}
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      : 'bg-gray-800 hover:bg-cyan-500'
                  }`}
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Layanan, Perusahaan & Kontak - 3 Columns */}
            <div className="grid grid-cols-3 gap-4">
              {/* Layanan Section */}
              <div>
                <h4
                  className={`mb-3 text-sm font-bold ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  Layanan
                </h4>
                <ul
                  className={`space-y-1.5 text-xs ${
                    isLight ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  <li>
                    <Link
                      href="/teknisi"
                      className={`transition-colors ${
                        isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                      }`}
                    >
                      Servis HP
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/sparepart"
                      className={`transition-colors ${
                        isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                      }`}
                    >
                      Sparepart
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/sewa-alat"
                      className={`transition-colors ${
                        isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                      }`}
                    >
                      Sewa Alat
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/rekomendasi"
                      className={`transition-colors ${
                        isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                      }`}
                    >
                      Direktori Mitra
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Perusahaan Section */}
              <div>
                <h4
                  className={`mb-3 text-sm font-bold ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  Perusahaan
                </h4>
                <ul
                  className={`space-y-1.5 text-xs ${
                    isLight ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  <li>
                    <Link
                      href="/about"
                      className={`transition-colors ${
                        isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                      }`}
                    >
                      Tentang Kami
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className={`transition-colors ${
                        isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                      }`}
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors ${
                        isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                      }`}
                    >
                      Karir
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className={`transition-colors ${
                        isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                      }`}
                    >
                      Hubungi Kami
                    </a>
                  </li>
                </ul>
              </div>

              {/* Kontak Section */}
              <div>
                <h4
                  className={`mb-3 text-sm font-bold ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  Kontak
                </h4>
                <ul
                  className={`space-y-2 text-xs ${
                    isLight ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  <li className="flex items-start gap-1.5">
                    <Phone
                      className={`mt-0.5 h-3 w-3 flex-shrink-0 ${
                        isLight ? 'text-blue-600' : 'text-cyan-400'
                      }`}
                    />
                    <span className="break-words">+62 812-3456-7890</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Mail
                      className={`mt-0.5 h-3 w-3 flex-shrink-0 ${
                        isLight ? 'text-blue-600' : 'text-cyan-400'
                      }`}
                    />
                    <span className="break-words">info@halotekno.id</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <MapPin
                      className={`mt-0.5 h-3 w-3 flex-shrink-0 ${
                        isLight ? 'text-blue-600' : 'text-cyan-400'
                      }`}
                    />
                    <span className="break-words">Jakarta, Indonesia</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop Layout - 4 columns */}
          <div className="hidden grid-cols-4 gap-8 lg:grid">
            {/* HaloTekno Section */}
            <div>
              <h3
                className={`bg-gradient-to-r text-2xl font-bold ${
                  isLight
                    ? 'from-cyan-600 to-blue-600'
                    : 'from-cyan-400 to-blue-500'
                } mb-4 bg-clip-text text-transparent`}
              >
                HaloTekno
              </h3>
              <p
                className={`mb-6 text-sm ${
                  isLight ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                Platform servis HP terpercaya dengan layanan profesional dan
                teknisi bersertifikat
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      : 'bg-gray-800 hover:bg-cyan-500'
                  }`}
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      : 'bg-gray-800 hover:bg-cyan-500'
                  }`}
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                    isLight
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      : 'bg-gray-800 hover:bg-cyan-500'
                  }`}
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Layanan Section */}
            <div>
              <h4
                className={`mb-4 text-lg font-bold ${
                  isLight ? 'text-gray-900' : 'text-white'
                }`}
              >
                Layanan
              </h4>
              <ul
                className={`space-y-2 text-sm ${
                  isLight ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                <li>
                  <Link
                    href="/teknisi"
                    className={`transition-colors ${
                      isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                    }`}
                  >
                    Servis HP
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sparepart"
                    className={`transition-colors ${
                      isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                    }`}
                  >
                    Sparepart
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sewa-alat"
                    className={`transition-colors ${
                      isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                    }`}
                  >
                    Sewa Alat
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rekomendasi"
                    className={`transition-colors ${
                      isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                    }`}
                  >
                    Direktori Mitra
                  </Link>
                </li>
              </ul>
            </div>

            {/* Perusahaan Section */}
            <div>
              <h4
                className={`mb-4 text-lg font-bold ${
                  isLight ? 'text-gray-900' : 'text-white'
                }`}
              >
                Perusahaan
              </h4>
              <ul
                className={`space-y-2 text-sm ${
                  isLight ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                <li>
                  <Link
                    href="/about"
                    className={`transition-colors ${
                      isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                    }`}
                  >
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className={`transition-colors ${
                      isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                    }`}
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className={`transition-colors ${
                      isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                    }`}
                  >
                    Karir
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`transition-colors ${
                      isLight ? 'hover:text-blue-600' : 'hover:text-cyan-400'
                    }`}
                  >
                    Hubungi Kami
                  </a>
                </li>
              </ul>
            </div>

            {/* Kontak Section */}
            <div>
              <h4
                className={`mb-4 text-lg font-bold ${
                  isLight ? 'text-gray-900' : 'text-white'
                }`}
              >
                Kontak
              </h4>
              <ul
                className={`space-y-3 text-sm ${
                  isLight ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                <li className="flex items-center gap-2">
                  <Phone
                    className={`h-4 w-4 flex-shrink-0 ${
                      isLight ? 'text-blue-600' : 'text-cyan-400'
                    }`}
                  />
                  <span>+62 812-3456-7890</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail
                    className={`h-4 w-4 flex-shrink-0 ${
                      isLight ? 'text-blue-600' : 'text-cyan-400'
                    }`}
                  />
                  <span>info@halotekno.id</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin
                    className={`mt-1 h-4 w-4 flex-shrink-0 ${
                      isLight ? 'text-blue-600' : 'text-cyan-400'
                    }`}
                  />
                  <span>Jakarta, Indonesia</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          className={`border-t pt-8 text-center text-sm ${
            isLight
              ? 'border-gray-200 text-gray-600'
              : 'border-gray-800 text-gray-400'
          }`}
        >
          <p>&copy; 2025 HaloTekno. All rights reserved.</p>
          <p className="mt-2">Built by Satu Harmony Agency</p>
        </div>
      </div>
    </footer>
  )
}
