import { Target, Users, Award, Zap } from 'lucide-react'

const values = [
  {
    icon: Target,
    title: 'Fokus Pelanggan',
    description:
      'Kepuasan pelanggan adalah prioritas utama kami dalam setiap layanan',
  },
  {
    icon: Users,
    title: 'Profesionalisme',
    description:
      'Tim teknisi bersertifikat dan berpengalaman untuk hasil terbaik',
  },
  {
    icon: Award,
    title: 'Kualitas Terjamin',
    description: 'Sparepart original dan garansi resmi untuk setiap perbaikan',
  },
  {
    icon: Zap,
    title: 'Inovasi Berkelanjutan',
    description: 'Terus berinovasi menghadirkan solusi teknologi terdepan',
  },
]

export default function CompanyProfile() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-cyan-50/95"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
            Profil Perusahaan
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-gray-700 md:text-xl">
            Affiliate Gadget adalah platform digital enterprise-grade yang
            menghubungkan customer dengan layanan servis HP profesional di
            seluruh Indonesia. Kami menyediakan ekosistem lengkap mulai dari
            konsultasi, perbaikan, sparepart original, hingga sewa peralatan
            teknologi.
          </p>
          <p className="mb-12 text-lg leading-relaxed text-gray-700 md:text-xl">
            Dengan jaringan mitra terpercaya dan teknisi bersertifikat, kami
            berkomitmen memberikan solusi teknologi terbaik untuk kebutuhan
            bisnis dan personal Anda.
          </p>
        </div>

        {/* Values Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <div
              key={index}
              className="group rounded-2xl border border-white/50 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-3 text-white transition-transform duration-300 group-hover:scale-110">
                <value.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                {value.title}
              </h3>
              <p className="text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
