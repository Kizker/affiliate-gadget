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

const CUSTOMER_PROFILES = [
  {
    name: 'Rian Pratama',
    email: 'rian.pratama.review@example.com',
    image:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
  },
  {
    name: 'Siti Rahmawati',
    email: 'siti.rahmawati.review@example.com',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  },
  {
    name: 'Budi Santoso',
    email: 'budi.santoso.review@example.com',
    image:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
  },
  {
    name: 'Dewi Lestari',
    email: 'dewi.lestari.review@example.com',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
  },
  {
    name: 'Andi Wijaya',
    email: 'andi.wijaya.review@example.com',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
  },
  {
    name: 'Anisa Putri',
    email: 'anisa.putri.review@example.com',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  },
  {
    name: 'Hendra Gunawan',
    email: 'hendra.gunawan.review@example.com',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
  },
  {
    name: 'Dina Mariana',
    email: 'dina.mariana.review@example.com',
    image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
  },
  {
    name: 'Reza Firmansyah',
    email: 'reza.firmansyah.review@example.com',
    image:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&q=80',
  },
  {
    name: 'Fitri Handayani',
    email: 'fitri.handayani.review@example.com',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
  },
  {
    name: 'Kevin Sanjaya',
    email: 'kevin.sanjaya.review@example.com',
    image:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&q=80',
  },
  {
    name: 'Tri Wahyuni',
    email: 'tri.wahyuni.review@example.com',
    image:
      'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&q=80',
  },
  {
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi.review@example.com',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
  },
  {
    name: 'Mega Utami',
    email: 'mega.utami.review@example.com',
    image:
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&q=80',
  },
  {
    name: 'Fajar Nugraha',
    email: 'fajar.nugraha.review@example.com',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
  },
  {
    name: 'Intan Permata',
    email: 'intan.permata.review@example.com',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&q=80',
  },
  {
    name: 'Bambang Irawan',
    email: 'bambang.irawan.review@example.com',
    image:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&q=80',
  },
  {
    name: 'Maya Anggraini',
    email: 'maya.anggraini.review@example.com',
    image:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&q=80',
  },
  {
    name: 'Doni Pratama',
    email: 'doni.pratama.review@example.com',
    image:
      'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150&q=80',
  },
  {
    name: 'Rina Kusuma',
    email: 'rina.kusuma.review@example.com',
    image:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&q=80',
  },
]

const REVIEW_COMMENTS = [
  {
    rating: 5,
    comment:
      'Servis ganti LCD iPhone 13 Pro selesai dalam 45 menit! Layar True Tone dan 120Hz ProMotion tetap aktif normal. Hasil pemasangan rapi rapat, bergaransi 30 hari ganti baru.',
  },
  {
    rating: 5,
    comment:
      'Baterai Samsung S22 Ultra saya yang kembung diganti baterai original baru. Ketahanan baterai kembali awet seharian, teknisinya ramah banget dan menjelaskan tips perawatan baterai.',
  },
  {
    rating: 5,
    comment:
      'Teknisi sangat profesional dan transparan. HP dibongkar langsung di depan saya dan dijelaskan kerusakannya di bagian IC charging. Tidak ada biaya siluman!',
  },
  {
    rating: 5,
    comment:
      'Layar Xiaomi 12T pecah parah akibat jatuh, estimasi harga sesuai di aplikasi tanpa biaya tambahan. Hasil pemasangan presisi dan rapat tanpa lem bleberan.',
  },
  {
    rating: 4,
    comment:
      'Servis Face ID mati kena cipratan air, teknisi berhasil perbaiki micro soldering-nya. Pengerjaan butuh waktu sekitar 1,5 jam karena antrean, tapi hasilnya sangat memuaskan.',
  },
  {
    rating: 5,
    comment:
      'Sangat puas dengan garansi 30 harinya! Sempat ada kendala touch sedikit di sudut layar, langsung dicek dan diganti unit layar baru tanpa ribet plus free tempered glass.',
  },
  {
    rating: 5,
    comment:
      'Pembersihan speaker dan ganti port USB Type-C yang longgar cuma 30 menit. Suara jernih lagi dan fast charging jalan lancar.',
  },
  {
    rating: 5,
    comment:
      'Tempatnya bersih, ber-AC, dan ada ruang tunggu nyaman sambil bisa lihat proses pengerjaan teknisi lewat kaca workshop. Pelayanan bintang lima!',
  },
  {
    rating: 5,
    comment:
      'Ganti kaca kamera belakang iPhone 14 Pro Max mulus seperti baru keluar pabrik. Teknisi teliti banget bersihin debu mikro di bagian sensor kameranya.',
  },
  {
    rating: 4,
    comment:
      'iPad Pro M1 bengkok dan LCD blank berhasil diluruskan dan diselamatkan tanpa perlu ganti housing baru. Hemat jutaan rupiah. Recommended workshop!',
  },
  {
    rating: 5,
    comment:
      'Pelayanan ramah, teknisinya komunikatif diajak konsultasi via WhatsApp sebelum saya datang ke toko. Lokasi di Google Maps juga pas titiknya.',
  },
  {
    rating: 5,
    comment:
      'Servis speaker telinga iPhone 11 yang kresek-kresek langsung jernih kembali. Pengerjaan cepat bisa ditunggu sambil ngopi.',
  },
  {
    rating: 5,
    comment:
      'Fast response, harga bersahabat dan kualitas part original. Sangat direkomendasikan untuk warga sekitar yang cari bengkel gadget terpercaya.',
  },
  {
    rating: 5,
    comment:
      'Ganti LCD Poco F4 GT beres 1 jam. Layar AMOLED 120Hz smooth dan touch responsif untuk main game berat. Terima kasih banyak!',
  },
  {
    rating: 5,
    comment:
      'Backdoor kaca Galaxy Note 20 Ultra diganti menggunakan mesin laser modern. Hasilnya sangat presisi dan tanpa lecet sama sekali pada frame aluminium.',
  },
  {
    rating: 5,
    comment:
      'Pemasangan tempered glass gratis dan pembersihan lubang speaker setelah ganti LCD. Pelayanannya benar-benar memanjakan pelanggan.',
  },
  {
    rating: 4,
    comment:
      'Kamera depan buram kemasukan debu dibersihkan tuntas sampai jernih seperti baru. Teknisi jujur dan tidak ada paksaan ganti part.',
  },
  {
    rating: 5,
    comment:
      'Tombol volume dan power yang macet diperbaiki fleksibelnya, klik-nya empuk kembali seperti sedia kala. Cepat cuma 25 menit.',
  },
  {
    rating: 5,
    comment:
      'Layar Google Pixel yang langka suku cadangnya berhasil didapat dan dipasang rapi di sini. Rekomendasi servis gadget terlengkap!',
  },
  {
    rating: 5,
    comment:
      'Pengerjaan kilat sesuai janji 2 jam di meja teknisi. Garansi digital tersimpan rapi di sistem sehingga tidak takut struk hilang.',
  },
]

async function seedAllMitrasReviews() {
  console.log(
    '🚀 Seeding comprehensive reviews & synchronizing stats for ALL Mitras...'
  )

  // 1. Ensure Customer Users exist
  const userMap: any[] = []
  for (const p of CUSTOMER_PROFILES) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name, image: p.image },
      create: {
        name: p.name,
        email: p.email,
        image: p.image,
        role: 'CUSTOMER',
        isActive: true,
      },
    })
    userMap.push(user)
  }
  console.log(`✅ Ensured ${userMap.length} review customer users.`)

  // 2. Fetch all Mitras
  const mitras = await prisma.mitra.findMany({
    where: { isActive: true },
    select: {
      id: true,
      businessName: true,
      phone: true,
      totalReview: true,
      rating: true,
      _count: {
        select: { reviews: true },
      },
    },
  })

  console.log(`📦 Found ${mitras.length} active mitras in database.`)

  for (const mitra of mitras) {
    console.log(
      `\n🏢 Processing Mitra: ${mitra.businessName} (Phone: ${mitra.phone})`
    )

    // Determine target review count:
    // If mitra had a totalReview in the database (e.g. 63), generate that exact number
    // Otherwise generate between 15 to 25 reviews
    let targetCount = mitra.totalReview > 0 ? mitra.totalReview : 15
    // Cap to a sensible realistic batch if excessive, but if 63 (like the user saw), generate 63!
    if (targetCount < 10) targetCount = 15

    const existingCount = mitra._count.reviews
    if (existingCount >= targetCount) {
      console.log(
        `  ℹ️ Already has ${existingCount} reviews in DB (Target: ${targetCount}). Skipping insertion.`
      )
      continue
    }

    const reviewsToCreate = targetCount - existingCount
    console.log(
      `  ➕ Generating ${reviewsToCreate} realistic reviews (total target: ${targetCount})...`
    )

    for (let i = 0; i < reviewsToCreate; i++) {
      const user = userMap[(existingCount + i) % userMap.length]
      const commentTemplate =
        REVIEW_COMMENTS[(existingCount + i) % REVIEW_COMMENTS.length]

      const daysAgo = Math.floor(Math.random() * 55) + 1
      const reviewDate = new Date()
      reviewDate.setDate(reviewDate.getDate() - daysAgo)
      reviewDate.setMinutes(
        reviewDate.getMinutes() - Math.floor(Math.random() * 600)
      )

      await prisma.review.create({
        data: {
          userId: user.id,
          mitraId: mitra.id,
          type: ReviewType.MITRA,
          rating: commentTemplate.rating,
          comment: commentTemplate.comment,
          helpfulCount: Math.floor(Math.random() * 8) + 1,
          createdAt: reviewDate,
          updatedAt: reviewDate,
        },
      })
    }

    // 3. Recalculate average rating & total reviews
    const allMitraReviews = await prisma.review.findMany({
      where: { mitraId: mitra.id },
      select: { rating: true },
    })

    const finalTotal = allMitraReviews.length
    const finalRating =
      finalTotal > 0
        ? parseFloat(
            (
              allMitraReviews.reduce((sum, r) => sum + r.rating, 0) / finalTotal
            ).toFixed(1)
          )
        : 5.0

    await prisma.mitra.update({
      where: { id: mitra.id },
      data: {
        totalReview: finalTotal,
        rating: finalRating,
      },
    })

    // 4. Ensure workshop gallery photos (8/8)
    const galleryCount = await prisma.mitraImage.count({
      where: { mitraId: mitra.id, isBanner: false },
    })

    if (galleryCount < 8) {
      for (const url of WORKSHOP_GALLERY_IMAGES) {
        await prisma.mitraImage.create({
          data: {
            mitraId: mitra.id,
            url,
            isBanner: false,
          },
        })
      }
    }

    console.log(
      `  ✅ Updated: ${finalRating} stars (${finalTotal} reviews in DB). Gallery: 8 photos.`
    )
  }

  console.log('\n🎉 ALL MITRAS REVIEWS SUCCESSFULLY SEEDED AND SYNCHRONIZED!')
}

seedAllMitrasReviews()
  .catch((err) => {
    console.error('❌ Error during seeding all mitras reviews:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
