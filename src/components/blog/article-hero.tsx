import { Calendar, Clock } from 'lucide-react'
import type { Article } from '@/lib/articles'

interface ArticleHeroProps {
  article: Article
}

export default function ArticleHero({ article }: ArticleHeroProps) {
  return (
    <section className="relative min-h-[60vh] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${article.featuredImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-slate-900/95"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[60vh] items-center">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              {article.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="mb-6 flex flex-wrap items-center gap-6 text-white/90">
            {/* Author */}
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="h-12 w-12 rounded-full border-2 border-white/50 object-cover"
              />
              <div>
                <p className="font-semibold">{article.author.name}</p>
                <p className="text-sm text-white/70">{article.author.role}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>
                {new Date(article.publishDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Read Time */}
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{article.readTime} menit baca</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}
