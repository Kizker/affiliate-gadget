import { PrismaClient, ReviewType } from '@prisma/client'

const prisma = new PrismaClient()

const WORKSHOP_GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1517055729441-db3aab9e73b4?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80',
]

const CUSTOMER_REVIEWS_DATA = [
  {
    name: 'Rian Pratama',
    email: 'rian.pratama.review@example.com',
    rating: 5,
    comment:
      'Servis ganti LCD iPhone 13 Pro selesai dalam 45 menit! Layar True Tone dan 120Hz ProMotion tetap aktif normal. Hasil pemasangan rapi rapat, bergaransi 30 hari ganti baru.',
    daysAgo: 1,
  },
  {
    name: 'Siti Rahmawati',
    email: 'siti.rahmawati.review@example.com',
    rating: 5,
    comment:
      'Baterai Samsung S22 Ultra saya yang kembung diganti baterai original baru. Ketahanan baterai kembali awet seharian, teknisinya ramah banget dan menjelaskan tips perawatan baterai.',
    daysAgo: 2,
  },
  {
    name: 'Budi Santoso',
    email: 'budi.santoso.review@example.com',
    rating: 5,
    comment:
      'Teknisi sangat profesional dan transparan. HP dibongkar langsung di depan saya dan dijelaskan kerusakannya di bagian IC charging. Tidak ada biaya siluman!',
    daysAgo: 3,
  },
  {
    name: 'Dewi Lestari',
    email: 'dewi.lestari.review@example.com',
    rating: 5,
    comment:
      'Layar Xiaomi 12T pecah parah akibat jatuh, estimasi harga sesuai di aplikasi tanpa biaya tambahan. Hasil pemasangan presisi dan rapat tanpa lem bleberan.',
    daysAgo: 5,
  },
  {
    name: 'Andi Wijaya',
    email: 'andi.wijaya.review@example.com',
    rating: 4,
    comment:
      'Servis Face ID mati kena cipratan air, teknisi berhasil perbaiki micro soldering-nya. Pengerjaan butuh waktu sekitar 1,5 jam karena antrean, tapi hasilnya sangat memuaskan.',
    daysAgo: 7,
  },
  {
    name: 'Anisa Putri',
    email: 'anisa.putri.review@example.com',
    rating: 5,
    comment:
      'Sangat puas dengan garansi 30 harinya! Sempat ada kendala touch sedikit di sudut layar, langsung dicek dan diganti unit layar baru tanpa ribet plus free tempered glass.',
    daysAgo: 9,
  },
  {
    name: 'Hendra Gunawan',
    email: 'hendra.gunawan.review@example.com',
    rating: 5,
    comment:
      'Pembersihan speaker dan ganti port USB Type-C yang longgar cuma 30 menit. Suara jernih lagi dan fast charging jalan lancar.',
    daysAgo: 12,
  },
  {
    name: 'Dina Mariana',
    email: 'dina.mariana.review@example.com',
    rating: 5,
    comment:
      'Tempatnya bersih, ber-AC, dan ada ruang tunggu nyaman sambil bisa lihat proses pengerjaan teknisi lewat kaca workshop. Pelayanan bintang lima!',
    daysAgo: 14,
  },
  {
    name: 'Reza Firmansyah',
    email: 'reza.firmansyah.review@example.com',
    rating: 5,
    comment:
      'Ganti kaca kamera belakang iPhone 14 Pro Max mulus seperti baru keluar pabrik. Teknisi teliti banget bersihin debu mikro di bagian sensor kameranya.',
    daysAgo: 16,
  },
  {
    name: 'Fitri Handayani',
    email: 'fitri.handayani.review@example.com',
    rating: 4,
    comment:
      'iPad Pro M1 bengkok dan LCD blank berhasil diluruskan dan diselamatkan tanpa perlu ganti housing baru. Hemat jutaan rupiah. Recommended workshop!',
    daysAgo: 19,
  },
  {
    name: 'Kevin Sanjaya',
    email: 'kevin.sanjaya.review@example.com',
    rating: 5,
    comment:
      'Pelayanan ramah, teknisinya komunikatif diajak konsultasi via WhatsApp sebelum saya datang ke toko. Lokasi di Google Maps juga pas titiknya.',
    daysAgo: 21,
  },
  {
    name: 'Tri Wahyuni',
    email: 'tri.wahyuni.review@example.com',
    rating: 5,
    comment:
      'Servis speaker telinga iPhone 11 yang kresek-kresek langsung jernih kembali. Pengerjaan cepat bisa ditunggu sambil ngopi.',
    daysAgo: 24,
  },
  {
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi.review@example.com',
    rating: 5,
    comment:
      'Fast response, harga bersahabat dan kualitas part original. Sangat direkomendasikan untuk warga sekitar yang cari bengkel gadget terpercaya.',
    daysAgo: 27,
  },
  {
    name: 'Mega Utami',
    email: 'mega.utami.review@example.com',
    rating: 5,
    comment:
      'Ganti LCD Poco F4 GT beres 1 jam. Layar AMOLED 120Hz smooth dan touch responsif untuk main game berat. Terima kasih banyak!',
    daysAgo: 30,
  },
]

async function seedMitraData() {
  console.log('🚀 Seeding reviews and gallery photos for Mitra...')

  // Find target mitra "Mitra Express Fauzan Hitam" or first approved mitra
  let targetMitra = await prisma.mitra.findFirst({
    where: {
      businessName: {
        contains: 'Fauzan',
        mode: 'insensitive',
      },
    },
  })

  if (!targetMitra) {
    targetMitra = await prisma.mitra.findFirst()
  }

  if (!targetMitra) {
    console.error('❌ No mitra found in database!')
    return
  }

  console.log(
    `🎯 Target Mitra: ${targetMitra.businessName} (ID: ${targetMitra.id})`
  )

  // 1. MAXIMIZE WORKSHOP GALLERY TO 8 PHOTOS
  console.log('📸 Updating workshop gallery to 8 high-resolution photos...')
  // Delete old gallery images for this mitra
  await prisma.mitraImage.deleteMany({
    where: {
      mitraId: targetMitra.id,
      isBanner: false,
    },
  })

  // Insert all 8 photos
  for (const url of WORKSHOP_GALLERY_IMAGES) {
    await prisma.mitraImage.create({
      data: {
        mitraId: targetMitra.id,
        url,
        isBanner: false,
      },
    })
  }
  console.log(
    `✅ Inserted ${WORKSHOP_GALLERY_IMAGES.length}/8 workshop gallery photos!`
  )

  // 2. INJECT REALISTIC CUSTOMER REVIEWS
  console.log('💬 Injecting customer reviews...')
  // Clean existing reviews for this mitra to have fresh realistic set
  await prisma.review.deleteMany({
    where: {
      mitraId: targetMitra.id,
    },
  })

  let totalRatingSum = 0

  for (const item of CUSTOMER_REVIEWS_DATA) {
    // Find or create customer user
    let user = await prisma.user.findUnique({
      where: { email: item.email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: item.email,
          name: item.name,
          role: 'CUSTOMER',
        },
      })
    }

    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() - item.daysAgo)

    await prisma.review.create({
      data: {
        userId: user.id,
        mitraId: targetMitra.id,
        type: ReviewType.MITRA,
        rating: item.rating,
        comment: item.comment,
        helpfulCount: Math.floor(Math.random() * 8) + 1,
        createdAt: reviewDate,
        updatedAt: reviewDate,
      },
    })

    totalRatingSum += item.rating
  }

  const reviewCount = CUSTOMER_REVIEWS_DATA.length
  const avgRating = totalRatingSum / reviewCount

  // 3. UPDATE MITRA AGGREGATE STATS
  await prisma.mitra.update({
    where: { id: targetMitra.id },
    data: {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReview: reviewCount,
      totalViews: 1923,
      totalInquiries: 112,
    },
  })

  console.log(`\n🎉 SUCCESS!`)
  console.log(`- Mitra: ${targetMitra.businessName}`)
  console.log(`- Galeri Foto: 8/8 foto terpasang`)
  console.log(`- Total Ulasan: ${reviewCount} ulasan`)
  console.log(`- Rating Rata-rata: ${avgRating.toFixed(1)} / 5.0`)
  console.log(`- Total Views: 1923`)
  console.log(`- Total Inquiries: 112`)
}

seedMitraData()
  .catch((err) => {
    console.error('❌ Error during seeding:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
