export default function AboutHero() {
  return (
    <section className="relative min-h-[60vh] overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/95 via-blue-500/90 to-cyan-500/95"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[60vh] items-center">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
            Tentang Affiliate Gadget
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-white/90 md:text-2xl">
            Platform digital terpercaya untuk solusi servis HP, sparepart
            original, dan ekosistem teknologi lengkap di Indonesia
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}
