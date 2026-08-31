export default function BlogHero() {
  return (
    <section className="relative min-h-[50vh] overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-300 blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[50vh] items-center">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
            Blog & Artikel
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-white/90 md:text-2xl">
            Tips, trik, dan panduan seputar servis HP, sparepart, dan teknologi
            terkini dari para ahli Affiliate Gadget
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}
