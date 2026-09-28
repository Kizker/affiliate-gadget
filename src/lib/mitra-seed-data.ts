import prisma from '@/lib/db'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const DEFAULT_MITRAS = [
  {
    email: 'icolor.roxy@affiliategadget.com',
    name: 'Bambang Sudirjo (iColor Roxy)',
    businessName: 'iColor Service & Repair Jakarta (Roxy Mas)',
    tagline: 'Pusat Servis LCD & Komponen Gadget Profesional Roxy Mas',
    description:
      'Spesialis pergantian layar OLED/Retina kilat 2 jam, reparasi motherboard mikroskopis, dan penggantian baterai original dengan garansi pengerjaan hingga 90 hari.',
    banner: '/images/service/service-roxy.jpg',
    address:
      'ITC Roxy Mas Lantai 2 Blok A No. 12, Jl. KH. Hasyim Ashari, Gambir',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    phone: '081289001144',
    whatsapp: '6281289001144',
    website: 'https://affiliategadget.com',
    latitude: -6.1666,
    longitude: 106.8043,
    rating: 4.9,
    totalReview: 74,
    features: [
      'Ganti LCD Kilat 2 Jam',
      'Pengecekan Fisik Gratis',
      'Teknisi Bersertifikat Level-3',
      'Suku Cadang Grade A/Original',
      'Garansi Servis Hingga 90 Hari',
    ],
    weekdayHours: 'Senin - Sabtu: 09:00 - 21:00 WIB',
    weekendHours: 'Minggu: 10:00 - 20:00 WIB',
    services: [
      {
        name: 'Ganti LCD OLED Flagship (iPhone & Galaxy)',
        description:
          'Pemasangan layar OLED presisi dengan seal anti-air dan TrueTone aktif',
        price: 'Rp 650.000 - Rp 2.800.000',
        icon: '📱',
      },
      {
        name: 'Ganti Baterai Original Health 100%',
        description:
          'Sel baterai kualitas premium bebas pop-up baterai dan kalibrasi tuntas',
        price: 'Rp 250.000 - Rp 750.000',
        icon: '🔋',
      },
      {
        name: 'Reparasi Mesin / IC Power / Mati Total',
        description:
          'Perbaikan sirkuit motherboard dengan mikroskop profesional',
        price: 'Rp 350.000 - Rp 1.500.000',
        icon: '⚡',
      },
      {
        name: 'Servis Face ID & TrueTone Recovery',
        description: 'Pemulihan sensor dot projector dan earpiece fleksibel',
        price: 'Rp 300.000 - Rp 650.000',
        icon: '🔍',
      },
      {
        name: 'Pembersihan Korosi Water Damage',
        description:
          'Ultrasonic cleaning menyeluruh untuk unit terpapar cairan',
        price: 'Rp 200.000 - Rp 450.000',
        icon: '💧',
      },
    ],
    images: ['/images/service/service-roxy.jpg'],
  },
  {
    email: 'bec.repair@affiliategadget.com',
    name: 'Reza Fauzan (BEC Repair)',
    businessName: 'Bandung Gadget Repair Clinic (BEC)',
    tagline: 'Klinik Reparasi Gadget & Laptop Terpercaya Kota Bandung',
    description:
      'Solusi komprehensif servis ponsel dan tablet berbagai merek di Istana BEC Bandung. Dilengkapi laboratorium terbuka agar proses perbaikan dapat disaksikan langsung.',
    banner: '/images/service/service-bec.jpg',
    address: 'Istana BEC Lantai LG Blok W-08, Jl. Purnawarman No. 13-15',
    city: 'Bandung',
    province: 'Jawa Barat',
    phone: '081289001155',
    whatsapp: '6281289001155',
    website: 'https://affiliategadget.com',
    latitude: -6.9083,
    longitude: 107.6097,
    rating: 4.8,
    totalReview: 58,
    features: [
      'Lab Kaca Transparan',
      'Free Diagnostic & Consultation',
      'Teknisi Khusus Apple & Android',
      'Garansi Toko Resmi',
      'Bisa Diantar Gojek / Grab',
    ],
    weekdayHours: 'Senin - Sabtu: 10:00 - 21:00 WIB',
    weekendHours: 'Minggu: 10:00 - 20:00 WIB',
    services: [
      {
        name: 'Ganti LCD / Touchscreen Android & iOS',
        description:
          'Pengerjaan cepat dengan jaminan respon sentuhan 100% mulus',
        price: 'Rp 350.000 - Rp 2.200.000',
        icon: '📱',
      },
      {
        name: 'Ganti Baterai Fast Charging',
        description: 'Suku cadang baterai kapasitas murni bersertifikasi CE',
        price: 'Rp 180.000 - Rp 600.000',
        icon: '🔋',
      },
      {
        name: 'Perbaikan Port Charger & Mic',
        description:
          'Penggantian modul charging port tipe USB-C atau Lightning',
        price: 'Rp 150.000 - Rp 350.000',
        icon: '🔌',
      },
    ],
    images: ['/images/service/service-bec.jpg'],
  },
  {
    email: 'wtc.surabaya@affiliategadget.com',
    name: 'Kevin Pratama (WTC Care)',
    businessName: 'Surabaya Phone Care Center (WTC)',
    tagline: 'Pusat Rujukan Servis Smartphone Jawa Timur',
    description:
      'Layanan servis gadget terlengkap di WTC Surabaya. Melayani servis instan 2 jam, pergantian backdoor kaca laser, dan penggantian sparepart bergaransi resmi.',
    banner: '/images/service/service-wtc.jpg',
    address: 'WTC Surabaya Mall Lantai 3 No. 312, Jl. Pemuda No. 27-31',
    city: 'Surabaya',
    province: 'Jawa Timur',
    phone: '081289001166',
    whatsapp: '6281289001166',
    website: 'https://affiliategadget.com',
    latitude: -7.2655,
    longitude: 112.7483,
    rating: 4.9,
    totalReview: 62,
    features: [
      'Mesin Laser Backdoor Modern',
      'Teknisi Hardware Ahli',
      'Garansi Resmi 30-90 Hari',
      'Layanan Antar-Jemput',
      'Sparepart Original OEM',
    ],
    weekdayHours: 'Senin - Minggu: 10:00 - 21:00 WIB',
    weekendHours: 'Sabtu - Minggu: 10:00 - 21:00 WIB',
    services: [
      {
        name: 'Ganti Kaca LCD Depan (Glass Replacement)',
        description:
          'Metode laminasi OCA vacuum autoclave tanpa ganti modul display asli',
        price: 'Rp 300.000 - Rp 950.000',
        icon: '🛠️',
      },
      {
        name: 'Ganti Layar Super AMOLED / OLED',
        description: 'Unit display original dengan kerapatan warna akurat',
        price: 'Rp 550.000 - Rp 2.600.000',
        icon: '📱',
      },
      {
        name: 'Ganti Baterai Tahan Lama',
        description:
          'Penggantian baterai berkualitas dengan efisiensi daya maksimal',
        price: 'Rp 200.000 - Rp 700.000',
        icon: '🔋',
      },
    ],
    images: ['/images/service/service-wtc.jpg'],
  },
  {
    email: 'jogjatronik.service@affiliategadget.com',
    name: 'Anisa Larasati (Phone Master Jogja)',
    businessName: 'Phone Master Yogyakarta (Jogjatronik)',
    tagline: 'Servis Gadget Mahasiswa & Profesional Cepat & Terjangkau',
    description:
      'Solusi reparasi gadget ramah kantong dengan standar kerja profesional di Jogjatronik Mall. Pengecekan gratis dan suku cadang bergaransi.',
    banner: '/images/service/service-jogja.jpg',
    address: 'Jogjatronik Mall Lantai 1 No. 18, Jl. Brigjen Katamso No. 75',
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    phone: '081289001177',
    whatsapp: '6281289001177',
    website: 'https://affiliategadget.com',
    latitude: -7.8032,
    longitude: 110.3688,
    rating: 4.8,
    totalReview: 45,
    features: [
      'Harga Mahasiswa Terjangkau',
      'Diagnosa Mesin Gratis',
      'Pengerjaan Kilat Transparan',
      'Garansi Nota Digital',
      'Lokasi Strategis',
    ],
    weekdayHours: 'Senin - Sabtu: 10:00 - 20:30 WIB',
    weekendHours: 'Minggu: 11:00 - 19:00 WIB',
    services: [
      {
        name: 'Ganti Layar LCD & Touchscreen',
        description:
          'Paket servis hemat bergaransi untuk berbagai tipe smartphone',
        price: 'Rp 250.000 - Rp 1.500.000',
        icon: '📱',
      },
      {
        name: 'Ganti Baterai Original',
        description: 'Baterai kualitas premium dengan ketahanan optimal',
        price: 'Rp 150.000 - Rp 500.000',
        icon: '🔋',
      },
    ],
    images: ['/images/service/service-jogja.jpg'],
  },
  {
    email: 'smartfix.medan@affiliategadget.com',
    name: 'Rian Siregar (SmartFix Medan)',
    businessName: 'SmartFix Medan (Plaza Medan Fair)',
    tagline: 'Pusat Reparasi Gadget Handal & Bergaransi Kota Medan',
    description:
      'Pusat reparasi smartphone andalan warga Medan di Plaza Medan Fair. Dilengkapi alat canggih dan teknisi spesialis ganti kaca & perbaikan sinyal.',
    banner: '/images/service/service-medan.jpg',
    address: 'Plaza Medan Fair Lantai 4 No. 42, Jl. Gatot Subroto No. 30',
    city: 'Medan',
    province: 'Sumatera Utara',
    phone: '081289001188',
    whatsapp: '6281289001188',
    website: 'https://affiliategadget.com',
    latitude: 3.5932,
    longitude: 98.6657,
    rating: 4.7,
    totalReview: 39,
    features: [
      'Konsultasi Kerusakan Gratis',
      'Teknisi Hardware Berpengalaman',
      'Garansi Resmi Part',
      'Suku Cadang Berkualitas',
      'Siap COD / Kirim Instan',
    ],
    weekdayHours: 'Senin - Minggu: 10:00 - 21:00 WIB',
    weekendHours: 'Sabtu - Minggu: 10:00 - 21:00 WIB',
    services: [
      {
        name: 'Ganti Layar LCD Original / OLED',
        description:
          'Pemasangan rapi dan presisi dengan garansi ganti baru jika cacat',
        price: 'Rp 350.000 - Rp 2.400.000',
        icon: '📱',
      },
      {
        name: 'Ganti Baterai & Perbaikan Fleksibel',
        description: 'Penggantian baterai berdaya tahan tinggi',
        price: 'Rp 180.000 - Rp 650.000',
        icon: '🔋',
      },
    ],
    images: ['/images/service/service-medan.jpg'],
  },
]

export async function seedMitras() {
  const passwordHash = await bcrypt.hash('mitra123', 10)
  const results = []

  for (const m of DEFAULT_MITRAS) {
    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        name: m.name,
        phone: m.phone,
        role: UserRole.MITRA,
        mitraStatus: 'APPROVED',
        isActive: true,
      },
      create: {
        email: m.email,
        name: m.name,
        password: passwordHash,
        phone: m.phone,
        role: UserRole.MITRA,
        mitraStatus: 'APPROVED',
        isActive: true,
        emailVerified: new Date(),
      },
    })

    // 2. Upsert Mitra
    const mitra = await prisma.mitra.upsert({
      where: { userId: user.id },
      update: {
        businessName: m.businessName,
        tagline: m.tagline,
        description: m.description,
        banner: m.banner,
        address: m.address,
        city: m.city,
        province: m.province,
        phone: m.phone,
        whatsapp: m.whatsapp,
        website: m.website,
        latitude: m.latitude,
        longitude: m.longitude,
        rating: m.rating,
        totalReview: m.totalReview,
        features: m.features,
        weekdayHours: m.weekdayHours,
        weekendHours: m.weekendHours,
        isApproved: true,
        isActive: true,
      },
      create: {
        userId: user.id,
        businessName: m.businessName,
        tagline: m.tagline,
        description: m.description,
        banner: m.banner,
        address: m.address,
        city: m.city,
        province: m.province,
        phone: m.phone,
        whatsapp: m.whatsapp,
        website: m.website,
        latitude: m.latitude,
        longitude: m.longitude,
        rating: m.rating,
        totalReview: m.totalReview,
        features: m.features,
        weekdayHours: m.weekdayHours,
        weekendHours: m.weekendHours,
        isApproved: true,
        isActive: true,
      },
    })

    // 3. Clear & recreate services
    await prisma.mitraService.deleteMany({ where: { mitraId: mitra.id } })
    await prisma.mitraService.createMany({
      data: m.services.map((s) => ({
        mitraId: mitra.id,
        name: s.name,
        description: s.description,
        price: s.price,
        icon: s.icon,
      })),
    })

    // 4. Clear & recreate images
    await prisma.mitraImage.deleteMany({ where: { mitraId: mitra.id } })
    await prisma.mitraImage.createMany({
      data: m.images.map((img) => ({
        mitraId: mitra.id,
        url: img,
        isBanner: true,
      })),
    })

    results.push(mitra.businessName)
  }

  return results
}

/**
 * Ensures that at least 1 approved & active mitra exists in the database.
 * If none exists, automatically seeds default official mitras so public pages never show empty.
 */
export async function ensureMitrasExist() {
  const approvedCount = await prisma.mitra.count({
    where: { isApproved: true, isActive: true },
  })

  if (approvedCount === 0) {
    const totalCount = await prisma.mitra.count()
    if (totalCount === 0) {
      await seedMitras()
    } else {
      // Approve any existing mitras if they were pending
      await prisma.mitra.updateMany({
        data: { isApproved: true, isActive: true },
      })
    }
  }
}
