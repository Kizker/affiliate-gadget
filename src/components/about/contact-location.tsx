import {
  MapPin,
  Phone,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from 'lucide-react'

export default function ContactLocation() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1920&q=80)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-cyan-50/95"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Hubungi Kami
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Kami siap membantu Anda dengan solusi teknologi terbaik
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Information */}
          <div className="space-y-6">
            {/* Address */}
            <div className="rounded-2xl border border-white/50 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl md:p-8">
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-3 text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Alamat Kantor
              </h3>
              <p className="text-gray-600">
                Jl. Sudirman No. 123, Gedung Tech Hub Lt. 15
                <br />
                Jakarta Selatan, DKI Jakarta 12190
                <br />
                Indonesia
              </p>
            </div>

            {/* Phone */}
            <div className="rounded-2xl border border-white/50 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl md:p-8">
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-3 text-white">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Contact</h3>
              <p className="text-gray-600">
                Customer Service: +62 21 1234 5678
                <br />
                WhatsApp: +62 812 3456 7890
                <br />
                Email: info@affiliategadget.com
              </p>
            </div>

            {/* Business Hours */}
            <div className="rounded-2xl border border-white/50 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl md:p-8">
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-3 text-white">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Jam Operasional
              </h3>
              <p className="text-gray-600">
                Senin - Jumat: 09:00 - 18:00 WIB
                <br />
                Sabtu: 09:00 - 15:00 WIB
                <br />
                Minggu & Libur: Tutup
              </p>
            </div>
          </div>

          {/* Map & Social Media */}
          <div className="space-y-6">
            {/* Map Placeholder */}
            <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/80 backdrop-blur-sm">
              <div className="aspect-video w-full bg-gradient-to-br from-blue-100 to-cyan-100">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.2087834648!2d106.8229328!3d-6.2293867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e945e34b9d%3A0x5371bf0fdad786a2!2sJl.%20Jenderal%20Sudirman%2C%20Jakarta!5e0!3m2!1sen!2sid!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full"
                ></iframe>
              </div>
            </div>

            {/* Social Media */}
            <div className="rounded-2xl border border-white/50 bg-white/80 p-6 backdrop-blur-sm md:p-8">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Ikuti Kami
              </h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white transition-transform duration-300 hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white transition-transform duration-300 hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white transition-transform duration-300 hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white transition-transform duration-300 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white backdrop-blur-sm md:p-8">
              <h3 className="mb-2 text-xl font-bold">Butuh Bantuan Segera?</h3>
              <p className="mb-4 text-white/90">
                Tim customer service kami siap membantu Anda
              </p>
              <a
                href="https://wa.me/6281234567890"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-transform duration-300 hover:scale-105"
              >
                <Phone className="h-5 w-5" />
                Hubungi Sekarang
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
