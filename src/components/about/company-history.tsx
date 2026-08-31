const milestones = [
  {
    year: '2020',
    title: 'Berdirinya Affiliate Gadget',
    description:
      'Affiliate Gadget didirikan dengan visi menjadi platform servis HP terpercaya di Indonesia. Dimulai dengan 3 teknisi profesional di Jakarta.',
  },
  {
    year: '2021',
    title: 'Ekspansi Layanan',
    description:
      'Meluncurkan layanan sewa alat dan penjualan sparepart original. Membuka toko di 5 kota besar Indonesia.',
  },
  {
    year: '2022',
    title: 'Platform Digital',
    description:
      'Launching platform digital Affiliate Gadget dengan sistem booking online, live chat, dan tracking order real-time.',
  },
  {
    year: '2023',
    title: 'Jaringan Mitra',
    description:
      'Membangun direktori mitra dengan 100+ bengkel terpercaya di seluruh Indonesia. Total teknisi mencapai 50+ profesional.',
  },
  {
    year: '2024',
    title: 'Enterprise Solution',
    description:
      'Meluncurkan solusi enterprise untuk bisnis dan korporasi. Melayani 10,000+ customer dengan tingkat kepuasan 4.8/5.',
  },
  {
    year: '2025',
    title: 'Inovasi Berkelanjutan',
    description:
      'Terus berinovasi dengan AI-powered diagnostics dan ekspansi ke 50+ kota di Indonesia.',
  },
]

export default function CompanyHistory() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-cyan-50/95"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Perjalanan Kami
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Dari startup kecil hingga menjadi platform teknologi terpercaya
          </p>
        </div>

        {/* Timeline */}
        <div className="mx-auto max-w-4xl">
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="group relative flex gap-6 md:gap-8">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <span className="text-sm font-bold">{milestone.year}</span>
                  </div>
                  {index !== milestones.length - 1 && (
                    <div className="mt-2 h-full w-0.5 bg-gradient-to-b from-blue-600 to-cyan-600"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="rounded-2xl border border-white/50 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl md:p-8">
                    <h3 className="mb-2 text-xl font-bold text-gray-900 md:text-2xl">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
