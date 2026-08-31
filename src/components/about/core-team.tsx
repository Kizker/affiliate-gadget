import { Linkedin, Mail } from 'lucide-react'

const teamMembers = [
  {
    name: 'Ahmad Rizki',
    position: 'Founder & CEO',
    photo:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    bio: 'Visioner di balik Affiliate Gadget dengan 10+ tahun pengalaman di industri teknologi',
    linkedin: '#',
    email: 'ahmad@affiliategadget.com',
  },
  {
    name: 'Siti Nurhaliza',
    position: 'Chief Technology Officer',
    photo:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    bio: 'Expert dalam pengembangan platform digital dan sistem enterprise',
    linkedin: '#',
    email: 'siti@affiliategadget.com',
  },
  {
    name: 'Budi Santoso',
    position: 'Head of Operations',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    bio: 'Mengelola operasional dan jaringan mitra di seluruh Indonesia',
    linkedin: '#',
    email: 'budi@affiliategadget.com',
  },
  {
    name: 'Diana Putri',
    position: 'Head of Customer Success',
    photo:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    bio: 'Memastikan kepuasan pelanggan dan kualitas layanan terbaik',
    linkedin: '#',
    email: 'diana@affiliategadget.com',
  },
]

export default function CoreTeam() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/40 py-20 md:py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Tim Inti Kami
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Dipimpin oleh profesional berpengalaman yang berdedikasi untuk
            kesuksesan Anda
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group rounded-2xl border border-white/50 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              {/* Photo */}
              <div className="mb-4 overflow-hidden rounded-xl">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* Info */}
              <h3 className="mb-1 text-xl font-bold text-gray-900">
                {member.name}
              </h3>
              <p className="mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-sm font-semibold text-transparent">
                {member.position}
              </p>
              <p className="mb-4 text-sm text-gray-600">{member.bio}</p>

              {/* Social Links */}
              <div className="flex gap-2">
                <a
                  href={member.linkedin}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white transition-transform duration-300 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href={`mailto:${member.email}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white transition-transform duration-300 hover:scale-110"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
