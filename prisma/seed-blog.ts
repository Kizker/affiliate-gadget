import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting MASSIVE blog seed with 50+ articles...\n')

  const articlesData = [
    // Tips & Tricks Category
    {
      title: 'Cara Merawat LCD iPhone Agar Awet dan Tidak Mudah Rusak',
      slug: 'cara-merawat-lcd-iphone',
      category: 'Tips & Tricks',
      excerpt:
        'Panduan lengkap merawat LCD iPhone agar tetap awet dan terhindar dari kerusakan',
      tags: ['iPhone', 'LCD', 'Maintenance'],
      coverImage:
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
    },
    {
      title: '10 Tanda Baterai HP Harus Diganti Segera',
      slug: '10-tanda-baterai-hp-harus-diganti',
      category: 'Tips & Tricks',
      excerpt:
        'Kenali tanda-tanda baterai smartphone yang sudah waktunya diganti',
      tags: ['Baterai', 'Smartphone', 'Maintenance'],
      coverImage:
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=600&fit=crop',
    },
    {
      title: 'Panduan Memilih Charger yang Aman untuk Smartphone Anda',
      slug: 'panduan-memilih-charger-aman',
      category: 'Tips & Tricks',
      excerpt:
        'Tips memilih charger yang aman dan tidak merusak baterai smartphone',
      tags: ['Charger', 'Safety', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop',
    },
    {
      title: 'Cara Membersihkan Port Charging yang Kotor dengan Aman',
      slug: 'cara-membersihkan-port-charging',
      category: 'Tips & Tricks',
      excerpt:
        'Langkah-langkah membersihkan port charging tanpa merusak komponen',
      tags: ['Maintenance', 'Cleaning', 'DIY'],
      coverImage:
        'https://images.unsplash.com/photo-1618577608401-46f4a957f1fe?w=800&h=600&fit=crop',
    },
    {
      title: 'Mengapa HP Cepat Panas? Ini Penyebab dan Solusinya',
      slug: 'mengapa-hp-cepat-panas',
      category: 'Tips & Tricks',
      excerpt: 'Penyebab smartphone cepat panas dan cara mengatasinya',
      tags: ['Troubleshooting', 'Overheating', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    },

    // Tutorial Category
    {
      title: 'Tutorial Ganti LCD iPhone 13 Pro Sendiri di Rumah',
      slug: 'tutorial-ganti-lcd-iphone-13-pro',
      category: 'Tutorial',
      excerpt: 'Panduan step-by-step mengganti LCD iPhone 13 Pro dengan aman',
      tags: ['iPhone', 'LCD', 'DIY', 'Tutorial'],
      coverImage:
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=600&fit=crop',
    },
    {
      title: 'Cara Mengatasi HP Bootloop Tanpa Kehilangan Data',
      slug: 'cara-mengatasi-hp-bootloop',
      category: 'Tutorial',
      excerpt: 'Solusi mengatasi smartphone bootloop dengan aman',
      tags: ['Troubleshooting', 'Software', 'Tutorial'],
      coverImage:
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=600&fit=crop',
    },
    {
      title: 'Panduan Lengkap Flash Ulang Android untuk Pemula',
      slug: 'panduan-flash-ulang-android',
      category: 'Tutorial',
      excerpt: 'Tutorial lengkap flash ulang smartphone Android dari awal',
      tags: ['Android', 'Software', 'Tutorial'],
      coverImage:
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=600&fit=crop',
    },
    {
      title: 'Cara Backup Data HP Sebelum Service',
      slug: 'cara-backup-data-hp-sebelum-service',
      category: 'Tutorial',
      excerpt:
        'Langkah-langkah backup data smartphone sebelum dibawa ke service center',
      tags: ['Backup', 'Data', 'Tutorial'],
      coverImage:
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop',
    },
    {
      title: 'Tutorial Root Android Terbaru 2024',
      slug: 'tutorial-root-android-2024',
      category: 'Tutorial',
      excerpt: 'Panduan root Android terbaru dengan metode paling aman',
      tags: ['Android', 'Root', 'Advanced'],
      coverImage:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop',
    },

    // Review Category
    {
      title: 'Review LCD Aftermarket vs Original: Mana yang Lebih Baik?',
      slug: 'review-lcd-aftermarket-vs-original',
      category: 'Review',
      excerpt:
        'Perbandingan lengkap LCD aftermarket dan original dari segi kualitas dan harga',
      tags: ['LCD', 'Review', 'Comparison'],
      coverImage:
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=600&fit=crop',
    },
    {
      title: 'Review 5 Charger Fast Charging Terbaik 2024',
      slug: 'review-charger-fast-charging-terbaik',
      category: 'Review',
      excerpt:
        'Review dan perbandingan charger fast charging terbaik tahun ini',
      tags: ['Charger', 'Review', 'Gadget'],
      coverImage:
        'https://images.unsplash.com/photo-1600490722773-35753aea6332?w=800&h=600&fit=crop',
    },
    {
      title: 'Baterai OEM vs Original: Worth It atau Tidak?',
      slug: 'baterai-oem-vs-original',
      category: 'Review',
      excerpt: 'Analisis mendalam perbedaan baterai OEM dan original',
      tags: ['Baterai', 'Review', 'Comparison'],
      coverImage:
        'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&h=600&fit=crop',
    },
    {
      title: 'Review Tempered Glass Terbaik untuk iPhone 15 Pro Max',
      slug: 'review-tempered-glass-iphone-15',
      category: 'Review',
      excerpt:
        'Perbandingan tempered glass terbaik untuk melindungi layar iPhone 15 Pro Max',
      tags: ['iPhone', 'Accessories', 'Review'],
      coverImage:
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
    },
    {
      title: 'Case HP Terbaik 2024: Stylish dan Protective',
      slug: 'case-hp-terbaik-2024',
      category: 'Review',
      excerpt: 'Rekomendasi case smartphone yang stylish sekaligus protective',
      tags: ['Accessories', 'Review', 'Case'],
      coverImage:
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&h=600&fit=crop',
    },

    // News Category
    {
      title: 'iPhone 16 Akan Hadir dengan Layar OLED Lebih Terang',
      slug: 'iphone-16-layar-oled-lebih-terang',
      category: 'News',
      excerpt:
        'Apple dikabarkan akan menggunakan teknologi OLED terbaru untuk iPhone 16',
      tags: ['iPhone', 'News', 'Apple'],
      coverImage:
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
    },
    {
      title: 'Samsung Galaxy S24 Ultra: Spesifikasi dan Harga Resmi',
      slug: 'samsung-galaxy-s24-ultra-spesifikasi',
      category: 'News',
      excerpt:
        'Samsung resmi meluncurkan Galaxy S24 Ultra dengan chipset terbaru',
      tags: ['Samsung', 'News', 'Flagship'],
      coverImage:
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=600&fit=crop',
    },
    {
      title: 'Xiaomi 14 Pro Resmi Masuk Indonesia, Ini Harganya',
      slug: 'xiaomi-14-pro-resmi-indonesia',
      category: 'News',
      excerpt:
        'Xiaomi 14 Pro resmi diluncurkan di Indonesia dengan harga kompetitif',
      tags: ['Xiaomi', 'News', 'Launch'],
      coverImage:
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=600&fit=crop',
    },
    {
      title: 'Google Pixel 9 Pro: Kamera AI Terbaik di Kelasnya',
      slug: 'google-pixel-9-pro-kamera-ai',
      category: 'News',
      excerpt:
        'Google Pixel 9 Pro hadir dengan fitur kamera AI yang revolusioner',
      tags: ['Google', 'News', 'Camera'],
      coverImage:
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=600&fit=crop',
    },
    {
      title: 'Oppo Find X7 Ultra: Flagship dengan Charging 240W',
      slug: 'oppo-find-x7-ultra-charging-240w',
      category: 'News',
      excerpt: 'Oppo memperkenalkan teknologi charging super cepat 240W',
      tags: ['Oppo', 'News', 'Charging'],
      coverImage:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    },

    // Troubleshooting Category
    {
      title: 'HP Tidak Bisa Charging? Ini 7 Penyebab dan Solusinya',
      slug: 'hp-tidak-bisa-charging-solusi',
      category: 'Troubleshooting',
      excerpt:
        'Panduan lengkap mengatasi masalah smartphone yang tidak bisa charging',
      tags: ['Troubleshooting', 'Charging', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1618577608401-46f4a957f1fe?w=800&h=600&fit=crop',
    },
    {
      title: 'Layar HP Bergaris? Ini Penyebab dan Cara Mengatasinya',
      slug: 'layar-hp-bergaris-solusi',
      category: 'Troubleshooting',
      excerpt:
        'Solusi mengatasi layar smartphone yang bergaris atau bermasalah',
      tags: ['LCD', 'Troubleshooting', 'Display'],
      coverImage:
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=600&fit=crop',
    },
    {
      title: 'Cara Mengatasi HP Lemot dan Hang',
      slug: 'cara-mengatasi-hp-lemot',
      category: 'Troubleshooting',
      excerpt: 'Tips ampuh mengatasi smartphone yang lemot dan sering hang',
      tags: ['Performance', 'Troubleshooting', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=600&fit=crop',
    },
    {
      title: 'Speaker HP Tidak Bunyi? Coba 5 Cara Ini',
      slug: 'speaker-hp-tidak-bunyi',
      category: 'Troubleshooting',
      excerpt:
        'Solusi mengatasi speaker smartphone yang tidak mengeluarkan suara',
      tags: ['Audio', 'Troubleshooting', 'Speaker'],
      coverImage:
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=600&fit=crop',
    },
    {
      title: 'Kamera HP Blur? Ini Penyebab dan Cara Memperbaikinya',
      slug: 'kamera-hp-blur-solusi',
      category: 'Troubleshooting',
      excerpt: 'Panduan mengatasi kamera smartphone yang blur atau tidak fokus',
      tags: ['Camera', 'Troubleshooting', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=600&fit=crop',
    },

    // Maintenance Category
    {
      title: 'Cara Merawat Baterai HP Agar Awet Hingga 3 Tahun',
      slug: 'cara-merawat-baterai-hp-awet',
      category: 'Maintenance',
      excerpt: 'Tips merawat baterai smartphone agar tahan lama dan awet',
      tags: ['Baterai', 'Maintenance', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=600&fit=crop',
    },
    {
      title: 'Panduan Membersihkan HP yang Benar dan Aman',
      slug: 'panduan-membersihkan-hp',
      category: 'Maintenance',
      excerpt:
        'Cara membersihkan smartphone dengan benar tanpa merusak komponen',
      tags: ['Cleaning', 'Maintenance', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop',
    },
    {
      title: 'Tips Merawat Layar HP Agar Tidak Cepat Rusak',
      slug: 'tips-merawat-layar-hp',
      category: 'Maintenance',
      excerpt:
        'Cara merawat layar smartphone agar tetap mulus dan tidak mudah rusak',
      tags: ['LCD', 'Maintenance', 'Screen'],
      coverImage:
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=600&fit=crop',
    },
    {
      title: 'Cara Merawat HP Agar Tidak Cepat Panas',
      slug: 'cara-merawat-hp-tidak-panas',
      category: 'Maintenance',
      excerpt: 'Tips mencegah smartphone cepat panas saat digunakan',
      tags: ['Maintenance', 'Overheating', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    },
    {
      title: 'Perawatan HP Pasca Service yang Harus Dilakukan',
      slug: 'perawatan-hp-pasca-service',
      category: 'Maintenance',
      excerpt:
        'Hal-hal yang perlu diperhatikan setelah smartphone selesai di-service',
      tags: ['Maintenance', 'Service', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop',
    },

    // Comparison Category
    {
      title: 'iPhone 15 Pro vs Samsung S24 Ultra: Mana yang Lebih Worth It?',
      slug: 'iphone-15-pro-vs-samsung-s24-ultra',
      category: 'Comparison',
      excerpt: 'Perbandingan lengkap dua flagship terbaik tahun ini',
      tags: ['iPhone', 'Samsung', 'Comparison'],
      coverImage:
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
    },
    {
      title: 'Xiaomi vs Oppo: Brand Mana yang Lebih Baik?',
      slug: 'xiaomi-vs-oppo-brand-comparison',
      category: 'Comparison',
      excerpt:
        'Analisis mendalam perbandingan Xiaomi dan Oppo dari berbagai aspek',
      tags: ['Xiaomi', 'Oppo', 'Comparison'],
      coverImage:
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=600&fit=crop',
    },
    {
      title: 'Android vs iOS: Mana yang Lebih Cocok untuk Anda?',
      slug: 'android-vs-ios-comparison',
      category: 'Comparison',
      excerpt:
        'Perbandingan sistem operasi Android dan iOS untuk membantu Anda memilih',
      tags: ['Android', 'iOS', 'Comparison'],
      coverImage:
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=600&fit=crop',
    },
    {
      title: 'AMOLED vs IPS LCD: Perbedaan dan Kelebihan Masing-Masing',
      slug: 'amoled-vs-ips-lcd',
      category: 'Comparison',
      excerpt: 'Perbedaan teknologi layar AMOLED dan IPS LCD',
      tags: ['Display', 'Technology', 'Comparison'],
      coverImage:
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=600&fit=crop',
    },
    {
      title: 'Wireless Charging vs Fast Charging: Mana yang Lebih Efisien?',
      slug: 'wireless-vs-fast-charging',
      category: 'Comparison',
      excerpt: 'Perbandingan teknologi wireless charging dan fast charging',
      tags: ['Charging', 'Technology', 'Comparison'],
      coverImage:
        'https://images.unsplash.com/photo-1622921491193-345c2a32f39a?w=800&h=600&fit=crop',
    },

    // Guide Category
    {
      title: 'Panduan Lengkap Memilih HP Sesuai Budget dan Kebutuhan',
      slug: 'panduan-memilih-hp-sesuai-budget',
      category: 'Guide',
      excerpt:
        'Cara memilih smartphone yang tepat sesuai budget dan kebutuhan Anda',
      tags: ['Guide', 'Buying', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    },
    {
      title: 'Cara Cek HP Bekas Sebelum Membeli',
      slug: 'cara-cek-hp-bekas',
      category: 'Guide',
      excerpt:
        'Panduan lengkap mengecek kondisi smartphone bekas sebelum membeli',
      tags: ['Guide', 'Second', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=600&fit=crop',
    },
    {
      title: 'Panduan Memilih Service Center HP yang Terpercaya',
      slug: 'panduan-memilih-service-center',
      category: 'Guide',
      excerpt:
        'Tips memilih tempat service smartphone yang terpercaya dan berkualitas',
      tags: ['Guide', 'Service', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop',
    },
    {
      title: 'Cara Mengecek Garansi HP Anda Masih Aktif atau Tidak',
      slug: 'cara-cek-garansi-hp',
      category: 'Guide',
      excerpt: 'Panduan mengecek status garansi smartphone dari berbagai brand',
      tags: ['Guide', 'Warranty', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop',
    },
    {
      title: 'Panduan Klaim Garansi HP yang Rusak',
      slug: 'panduan-klaim-garansi-hp',
      category: 'Guide',
      excerpt: 'Langkah-langkah klaim garansi smartphone yang benar',
      tags: ['Guide', 'Warranty', 'Service'],
      coverImage:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop',
    },

    // Technology Category
    {
      title: 'Apa Itu Teknologi LTPO Display? Ini Penjelasan Lengkapnya',
      slug: 'apa-itu-ltpo-display',
      category: 'Technology',
      excerpt:
        'Penjelasan lengkap tentang teknologi LTPO display pada smartphone',
      tags: ['Technology', 'Display', 'Innovation'],
      coverImage:
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=600&fit=crop',
    },
    {
      title: 'Mengenal Teknologi Fast Charging: Dari QC hingga Super VOOC',
      slug: 'mengenal-teknologi-fast-charging',
      category: 'Technology',
      excerpt: 'Panduan lengkap berbagai teknologi fast charging di smartphone',
      tags: ['Technology', 'Charging', 'Innovation'],
      coverImage:
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop',
    },
    {
      title: 'Apa Itu Refresh Rate 120Hz dan Manfaatnya?',
      slug: 'apa-itu-refresh-rate-120hz',
      category: 'Technology',
      excerpt:
        'Penjelasan tentang refresh rate tinggi dan manfaatnya untuk pengguna',
      tags: ['Technology', 'Display', 'Performance'],
      coverImage:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
    },
    {
      title: 'Teknologi AI di Kamera Smartphone: Bagaimana Cara Kerjanya?',
      slug: 'teknologi-ai-kamera-smartphone',
      category: 'Technology',
      excerpt:
        'Cara kerja teknologi AI dalam meningkatkan kualitas foto smartphone',
      tags: ['Technology', 'Camera', 'AI'],
      coverImage:
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=600&fit=crop',
    },
    {
      title: 'Mengenal Chipset Snapdragon 8 Gen 3: Performa dan Fitur',
      slug: 'mengenal-snapdragon-8-gen-3',
      category: 'Technology',
      excerpt: 'Review lengkap chipset flagship terbaru dari Qualcomm',
      tags: ['Technology', 'Chipset', 'Performance'],
      coverImage:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop',
    },

    // Security Category
    {
      title: 'Cara Melindungi HP dari Virus dan Malware',
      slug: 'cara-melindungi-hp-dari-virus',
      category: 'Security',
      excerpt:
        'Tips keamanan untuk melindungi smartphone dari ancaman virus dan malware',
      tags: ['Security', 'Privacy', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop',
    },
    {
      title: 'Pentingnya Enkripsi Data di Smartphone Anda',
      slug: 'pentingnya-enkripsi-data-smartphone',
      category: 'Security',
      excerpt: 'Mengapa enkripsi data penting dan cara mengaktifkannya',
      tags: ['Security', 'Privacy', 'Data'],
      coverImage:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop',
    },
    {
      title: 'Cara Mengamankan HP dari Pencurian Data',
      slug: 'cara-mengamankan-hp-dari-pencurian',
      category: 'Security',
      excerpt: 'Langkah-langkah mengamankan data pribadi di smartphone',
      tags: ['Security', 'Privacy', 'Protection'],
      coverImage:
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop',
    },
    {
      title: 'Bahaya Public WiFi dan Cara Mengatasinya',
      slug: 'bahaya-public-wifi',
      category: 'Security',
      excerpt: 'Risiko menggunakan WiFi publik dan cara melindungi diri',
      tags: ['Security', 'WiFi', 'Privacy'],
      coverImage:
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop',
    },
    {
      title: 'Tips Membuat Password yang Kuat untuk HP Anda',
      slug: 'tips-membuat-password-kuat',
      category: 'Security',
      excerpt: 'Panduan membuat password yang aman dan sulit ditebak',
      tags: ['Security', 'Password', 'Tips'],
      coverImage:
        'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&h=600&fit=crop',
    },
  ]

  console.log('📝 Creating articles...')
  let successCount = 0
  let errorCount = 0

  for (const article of articlesData) {
    try {
      await prisma.article.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          excerpt: article.excerpt,
          category: article.category,
          tags: article.tags,
          coverImage: article.coverImage,
          isPublished: true,
          publishedAt: new Date(),
        },
        create: {
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: `<h2>Pendahuluan</h2><p>${article.excerpt}</p><h2>Pembahasan</h2><p>Artikel ini membahas tentang ${article.title.toLowerCase()} secara lengkap dan detail. Kami akan mengupas tuntas semua aspek penting yang perlu Anda ketahui.</p><h2>Kesimpulan</h2><p>Demikian pembahasan lengkap mengenai ${article.title.toLowerCase()}. Semoga informasi ini bermanfaat untuk Anda.</p>`,
          category: article.category,
          tags: article.tags,
          coverImage: article.coverImage,
          isPublished: true,
          publishedAt: new Date(),
        },
      })
      successCount++
      console.log(`  ✅ ${article.title}`)
    } catch (error) {
      errorCount++
      console.error(`  ❌ Error creating ${article.title}:`, error)
    }
  }

  console.log('\n🎉 Blog seed completed!')
  console.log('📊 Summary:')
  console.log(`   - Total articles: ${articlesData.length}`)
  console.log(`   - Successfully created: ${successCount}`)
  console.log(`   - Errors: ${errorCount}`)
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
