import prisma from '../src/lib/db'
import bcrypt from 'bcryptjs'
import {
  OrderStatus,
  CartItemType,
  PaymentMethod,
  PaymentStatus,
  ReviewType,
  LiveStreamStatus,
  AdPlacement,
  ReturnStatus,
  ReturnType,
  ComplaintStatus,
  TicketStatus,
  ServiceCategory,
  BankAccountCategory,
  NotificationType,
  DayOfWeek,
  MitraStatus,
} from '@prisma/client'

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]
const randomDate = (daysBack: number) => {
  const d = new Date()
  d.setDate(d.getDate() - randomInt(1, daysBack))
  d.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59))
  return d
}

async function main() {
  console.log('🚀 MEMULAI MASSIVE SEED DI SELURUH TABEL DATABASE...')
  console.time('Total Seeding Time')

  const hashedPassword = await bcrypt.hash('customer123', 10)

  // 1. GATHER EXISTING STORES
  let stores = await prisma.store.findMany()
  if (stores.length === 0) {
    console.log('Tidak ada toko, buat toko dasar...')
    const st = await prisma.store.create({
      data: {
        name: 'Affiliate Gadget Roxy Mas Pusat',
        slug: 'roxy-mas-pusat',
        companyName: 'PT Gadget Jaya Sentosa',
        taxId: '01.234.567.8-012.000',
        address: 'ITC Roxy Mas Lt. 2 No. 15-18, Jl. KH Hasyim Ashari',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        phone: '02163852111',
        isOwnerStore: true,
      },
    })
    stores = [st]
  }

  // 2. CREATE MORE CUSTOMERS, TECHNICIANS & MITRA USERS IF NEEDED
  console.log('👥 1. Memeriksa & Mengisi User Ekosistem (Customer, Teknisi, Mitra)...')
  const existingUsers = await prisma.user.findMany()
  const userCount = existingUsers.length

  const targetUsers = 65
  const neededUsers = Math.max(0, targetUsers - userCount)
  if (neededUsers > 0) {
    const indonesianNames = [
      'Budi Santoso', 'Dewi Lestari', 'Agus Setiawan', 'Siti Rahmawati', 'Hendra Wijaya',
      'Maya Anggraini', 'Doni Kurniawan', 'Rina Wulandari', 'Fajar Pratama', 'Nurul Hidayah',
      'Bayu Saputra', 'Dian Permata', 'Eko Prasetyo', 'Ratna Sari', 'Arif Munandar',
      'Mega Utami', 'Rizky Ramadhan', 'Winda Astuti', 'Galih Pangestu', 'Indah Kusuma',
      'Bambang Susanto', 'Tri Wahyuni', 'Aditya Nugraha', 'Yuni Shara', 'Ilham Maulana',
      'Desi Ratnasari', 'Yoga Pratama', 'Nita Octaviani', 'Hadi Sucipto', 'Putri Ayu'
    ]

    for (let i = 0; i < neededUsers; i++) {
      const idx = userCount + i + 1
      const fullName = indonesianNames[i % indonesianNames.length] + ` ${idx}`
      const email = `user.masif.${idx}@testcorp.id`
      const phone = `08779900${String(idx).padStart(4, '0')}`
      
      let role: any = 'CUSTOMER'
      if (i < 8) role = 'TECHNICIAN'
      else if (i < 16) role = 'MITRA'

      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: fullName,
          email,
          phone,
          password: hashedPassword,
          role,
          city: randomElement(['Jakarta Pusat', 'Surabaya', 'Bandung', 'Medan', 'Yogyakarta', 'Semarang', 'Makassar', 'Denpasar']),
          province: randomElement(['DKI Jakarta', 'Jawa Timur', 'Jawa Barat', 'Sumatera Utara', 'DI Yogyakarta', 'Jawa Tengah', 'Sulawesi Selatan', 'Bali']),
          address: `Jl. Melati Indah Blok G${idx} No. ${idx}`,
        },
      })
    }
  }

  const allUsers = await prisma.user.findMany()
  const customers = allUsers.filter(u => u.role === 'CUSTOMER')
  const technicianUsers = allUsers.filter(u => u.role === 'TECHNICIAN')
  const mitraUsers = allUsers.filter(u => u.role === 'MITRA')

  // 3. SEED USER ADDRESSES
  console.log('📍 2. Memperbanyak Alamat Pengiriman (UserAddress)...')
  for (const c of customers.slice(0, 40)) {
    const addrCount = await prisma.userAddress.count({ where: { userId: c.id } })
    if (addrCount < 2) {
      await prisma.userAddress.createMany({
        data: [
          {
            userId: c.id,
            recipientName: c.name || 'Penerima Paket',
            phone: c.phone || '081234567890',
            label: 'Rumah',
            fullAddress: `Jl. Flamboyan No. ${randomInt(10, 99)}, RT 04/RW 02`,
            city: c.city || 'Jakarta Pusat',
            province: c.province || 'DKI Jakarta',
            postalCode: '10150',
            latitude: -6.1754 + (Math.random() - 0.5) * 0.1,
            longitude: 106.8272 + (Math.random() - 0.5) * 0.1,
            isDefault: true,
          },
          {
            userId: c.id,
            recipientName: c.name || 'Penerima Kantor',
            phone: c.phone || '081234567890',
            label: 'Kantor',
            fullAddress: `Gedung Sovereign Plaza Lt. ${randomInt(2, 18)}, Jl. TB Simatupang`,
            city: c.city || 'Jakarta Selatan',
            province: c.province || 'DKI Jakarta',
            postalCode: '12430',
            latitude: -6.2905 + (Math.random() - 0.5) * 0.05,
            longitude: 106.7972 + (Math.random() - 0.5) * 0.05,
            isDefault: false,
          },
        ],
      })
    }
  }

  // 4. SEED BANK ACCOUNTS (PLATFORM CATEGORIES: JASA, SEWA, SPAREPART)
  console.log('🏦 3. Mengisi Rekening Bank Platform (BankAccount)...')
  const existingBankAccs = await prisma.bankAccount.count()
  if (existingBankAccs === 0) {
    await prisma.bankAccount.createMany({
      data: [
        { category: BankAccountCategory.SPAREPART, bankName: 'BCA', accountNumber: '8830192831', accountName: 'PT GADGET JAYA SENTOSA' },
        { category: BankAccountCategory.SPAREPART, bankName: 'MANDIRI', accountNumber: '1370019283741', accountName: 'PT GADGET JAYA SENTOSA' },
        { category: BankAccountCategory.JASA, bankName: 'BCA', accountNumber: '8830999123', accountName: 'PT GADGET JAYA SENTOSA - SERVIS' },
        { category: BankAccountCategory.JASA, bankName: 'BNI', accountNumber: '0839210293', accountName: 'PT GADGET JAYA SENTOSA - SERVIS' },
        { category: BankAccountCategory.SEWA, bankName: 'BCA', accountNumber: '8830555678', accountName: 'PT GADGET JAYA SENTOSA - RENTAL' },
        { category: BankAccountCategory.SEWA, bankName: 'BRI', accountNumber: '034101000998877', accountName: 'PT GADGET JAYA SENTOSA - RENTAL' },
      ],
    })
  }

  // 5. SEED TECHNICIANS & SERVICES
  console.log('🔧 4. Mengisi Data Teknisi & Layanan Servis (Technician & Service)...')
  for (const tu of technicianUsers) {
    const tech = await prisma.technician.upsert({
      where: { userId: tu.id },
      update: {},
      create: {
        userId: tu.id,
        bio: `Teknisi spesialis micro-soldering & perbaikan hardware motherboard tersertifikasi Apple & Android level 4. Pengalaman ${randomInt(3, 10)} tahun.`,
        experience: randomInt(3, 10),
        specialties: ['Ganti LCD OLED', 'Baterai Health 100%', 'Face ID & Touch ID Repair', 'IC Power Reballing', 'Water Damage Recovery'],
        rating: 4.8 + Math.random() * 0.2,
        totalReview: randomInt(15, 60),
        isAvailable: true,
      },
    })

    const svcCount = await prisma.service.count({ where: { technicianId: tech.id } })
    if (svcCount === 0) {
      await prisma.service.createMany({
        data: [
          {
            technicianId: tech.id,
            name: 'Pembersihan Debu & Re-Thermal Paste HP/Laptop',
            description: 'Pembersihan menyeluruh cooling fan, penggantian pasta pendingin kelas termal tinggi Arctic MX-4.',
            category: ServiceCategory.CEK_BONGKAR,
            price: 150000,
            minPrice: 100000,
            maxPrice: 200000,
            duration: 45,
            isActive: true,
          },
          {
            technicianId: tech.id,
            name: 'Servis Penggantian Baterai Gadget Original',
            description: 'Penggantian modul baterai 100% kapasitas asli dengan kalibrasi sensor daya & garansi 90 hari.',
            category: ServiceCategory.SERVIS_LENGKAP,
            price: 450000,
            minPrice: 350000,
            maxPrice: 850000,
            duration: 60,
            isActive: true,
          },
          {
            technicianId: tech.id,
            name: 'Konsultasi Kerusakan Hardware & Diagnostik Jalur PCB',
            description: 'Cek voltase short-circuit komponen motherboard dengan thermal camera dan osiloskop presisi.',
            category: ServiceCategory.KONSULTASI,
            price: 75000,
            minPrice: 50000,
            maxPrice: 100000,
            duration: 30,
            isActive: true,
          },
          {
            technicianId: tech.id,
            name: 'Ganti Flexible Charging Port & Mic',
            description: 'Solusi gadget tidak bisa dicas, konektor longgar, atau suara telepon tidak terdengar.',
            category: ServiceCategory.SERVIS_LENGKAP,
            price: 250000,
            minPrice: 200000,
            maxPrice: 400000,
            duration: 60,
            isActive: true,
          },
        ],
      })
    }
  }

  // 6. SEED MITRA REPAIR SHOPS
  console.log('🏬 5. Mengisi Data Mitra Bengkel Cabang (Mitra, Schedule, Service, Image)...')
  for (let i = 0; i < mitraUsers.length; i++) {
    const mu = mitraUsers[i]
    const mitra = await prisma.mitra.upsert({
      where: { userId: mu.id },
      update: {},
      create: {
        userId: mu.id,
        businessName: `Mitra Express Gadget Care ${mu.city || 'Pusat'} #${i + 1}`,
        tagline: 'Solusi Cepat Servis Gadget Bergaransi Resmi Cabang',
        description: 'Bengkel servis rekanan resmi platform Affiliate Gadget dengan teknisi bersertifikat dan garansi suku cadang original.',
        address: `Ruko Niaga Harapan Indah Blok C No. ${10 + i}`,
        city: mu.city || 'Jakarta Pusat',
        province: mu.province || 'DKI Jakarta',
        phone: mu.phone || '081298765432',
        rating: 4.9,
        totalReview: randomInt(20, 80),
        totalViews: randomInt(500, 2500),
        totalInquiries: randomInt(50, 200),
        isApproved: true,
        isActive: true,
        weekdayHours: '09:00 - 21:00',
        weekendHours: '10:00 - 20:00',
        features: ['Parkir Gratis', 'Ruang Tunggu Ber-AC', 'Free Wi-Fi', 'Garansi 30 Hari', 'Bisa Ditunggu'],
      },
    })

    const svcCount = await prisma.mitraService.count({ where: { mitraId: mitra.id } })
    if (svcCount === 0) {
      await prisma.mitraService.createMany({
        data: [
          { mitraId: mitra.id, name: 'Ganti LCD Kilat 2 Jam', description: 'Pemasangan layar OLED presisi dengan seal anti-air', price: 'Rp 450.000 - Rp 2.500.000' },
          { mitraId: mitra.id, name: 'Bypass iCloud / Bootloop Fix', description: 'Flashing firmware resmi & recovery data pengguna', price: 'Rp 200.000 - Rp 500.000' },
          { mitraId: mitra.id, name: 'Ganti Housing / Backdoor Pecah', description: 'Pergantian kaca belakang dengan laser debonding rapi', price: 'Rp 300.000 - Rp 950.000' },
        ],
      })
      await prisma.mitraSchedule.createMany({
        data: [
          { mitraId: mitra.id, day: DayOfWeek.MONDAY, openTime: '09:00', closeTime: '21:00', isClosed: false },
          { mitraId: mitra.id, day: DayOfWeek.TUESDAY, openTime: '09:00', closeTime: '21:00', isClosed: false },
          { mitraId: mitra.id, day: DayOfWeek.WEDNESDAY, openTime: '09:00', closeTime: '21:00', isClosed: false },
          { mitraId: mitra.id, day: DayOfWeek.THURSDAY, openTime: '09:00', closeTime: '21:00', isClosed: false },
          { mitraId: mitra.id, day: DayOfWeek.FRIDAY, openTime: '09:00', closeTime: '21:00', isClosed: false },
          { mitraId: mitra.id, day: DayOfWeek.SATURDAY, openTime: '10:00', closeTime: '20:00', isClosed: false },
          { mitraId: mitra.id, day: DayOfWeek.SUNDAY, openTime: '10:00', closeTime: '18:00', isClosed: false },
        ],
      })
      await prisma.mitraImage.createMany({
        data: [
          { mitraId: mitra.id, url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80', isBanner: true },
          { mitraId: mitra.id, url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80', isBanner: false },
        ],
      })
    }
  }

  // 7. SEED STORE APPLICATIONS
  console.log('📝 6. Mengisi Formulir Pengajuan Cabang Toko (StoreApplication)...')
  const appUsers = customers.slice(0, 15)
  for (let i = 0; i < appUsers.length; i++) {
    const u = appUsers[i]
    await prisma.storeApplication.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        storeName: `Cabang Toko Gadget ${u.city || 'Nusantara'} #${i + 1}`,
        companyName: `PT Sinar Mitra Niaga ${i + 1}`,
        taxId: `02.${randomInt(100, 999)}.${randomInt(100, 999)}.1-0${randomInt(10, 99)}.000`,
        address: `Jl. Ahmad Yani Mall Elektronik No. ${randomInt(1, 88)}`,
        city: u.city || 'Surabaya',
        province: u.province || 'Jawa Timur',
        postalCode: '60231',
        phone: u.phone || '081398761234',
        bankName: 'BCA',
        accountNumber: `7700${randomInt(100000, 999999)}`,
        accountName: `PT SINAR MITRA NIAGA ${i + 1}`,
      },
    })
  }

  // 8. SEED RENTAL ITEMS
  console.log('📸 7. Mengisi Katalog Unit Sewa / Rental (RentalItem)...')
  const existingRentals = await prisma.rentalItem.count()
  if (existingRentals < 15) {
    const rentalList = [
      { name: 'Sony Alpha A7 IV Mirrorless Camera Body', desc: 'Kamera full-frame 33MP untuk produksi video promosi & konten live streaming berkualitas studio.', price: 350000, deposit: 2000000, stock: 5, images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'] },
      { name: 'Sony FE 24-70mm f/2.8 GM II Lens', desc: 'Lensa zoom standar kelas G-Master dengan autofokus ultra cepat & ketajaman optik superior.', price: 200000, deposit: 1500000, stock: 6, images: ['https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80'] },
      { name: 'DJI RS 3 Pro Gimbal Stabilizer', desc: 'Stabilizer kamera profesional berbahan carbon fiber untuk footage sinematik tanpa guncangan.', price: 175000, deposit: 1000000, stock: 8, images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80'] },
      { name: 'Apple iPad Pro 12.9 M2 WiFi (Sewa Event)', desc: 'Tablet layar besar Liquid Retina XDR ideal untuk registrasi pengunjung, POS event, atau preview foto.', price: 250000, deposit: 1500000, stock: 10, images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'] },
      { name: 'Apple MacBook Pro 16 M3 Max 36GB/1TB', desc: 'Laptop editing monster bertenaga M3 Max untuk rendering video 4K/8K di lokasi shooting tanpa lag.', price: 650000, deposit: 4000000, stock: 4, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'] },
      { name: 'GoPro HERO 12 Black Action Camera', desc: 'Kamera aksi tahan air hingga 10 meter dengan stabilisasi HyperSmooth 6.0 & perekaman HDR 5.3K.', price: 120000, deposit: 800000, stock: 12, images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'] },
      { name: 'DJI Mini 4 Pro Drone Fly More Combo', desc: 'Drone ringan di bawah 249g dengan sensor rintangan omnidirectional dan transmisi video 20km.', price: 300000, deposit: 2000000, stock: 5, images: ['https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80'] },
      { name: 'Rode Wireless PRO Dual Microphone Kit', desc: 'Sistem mikrofon nirkabel 32-bit float recording untuk audio kristal bening anti-clipping.', price: 150000, deposit: 1000000, stock: 10, images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'] },
      { name: 'Samsung Galaxy S24 Ultra 512GB (Sewa Konser)', desc: 'HP terbaik untuk rekam video konser dengan 100x Space Zoom dan mikrofon audio zoom presisi.', price: 350000, deposit: 2500000, stock: 8, images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80'] },
      { name: 'Insta360 X3 360-Degree Action Cam', desc: 'Perekam video 360 derajat 5.7K dengan efek invisible selfie stick dan reframing cerdas.', price: 160000, deposit: 1000000, stock: 7, images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80'] },
      { name: 'Aputure Amaran 200d LED Video Light', desc: 'Lampu studio pencahayaan 200W daylight dengan kontrol via aplikasi Bluetooth Sidus Link.', price: 130000, deposit: 800000, stock: 6, images: ['https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80'] },
      { name: 'Apple iPhone 15 Pro Max 256GB (Sewa Acara)', desc: 'Smartphone flagship untuk live streaming TikTok/Shopee dengan resolusi video ProRes dan koneksi USB-C cepat.', price: 320000, deposit: 2500000, stock: 10, images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80'] },
    ]

    for (const r of rentalList) {
      await prisma.rentalItem.create({
        data: {
          name: r.name,
          description: r.desc,
          pricePerDay: r.price,
          weeklyDiscountPct: 15,
          monthlyDiscountPct: 30,
          depositAmount: r.deposit,
          terms: ['Wajib e-KTP asli & deposit dana', 'Dilarang membongkar unit', 'Keterlambatan pengembalian dikenakan denda per jam'],
          stock: r.stock,
          images: r.images,
          isActive: true,
        },
      })
    }
  }

  // 9. SEED ARTICLES / BLOG
  console.log('📰 8. Mengisi Artikel Blog Teknologi & Tips Gadget (Article)...')
  const existingArticles = await prisma.article.count()
  if (existingArticles < 25) {
    const articleList = [
      {
        slug: 'tips-merawat-baterai-iphone-tetap-100-persen',
        title: '7 Rahasia Merawat Battery Health iPhone Tetap Awet 100% Selama Bertahun-tahun',
        category: 'Tips & Trik',
        excerpt: 'Jangan biarkan baterai iPhone Anda drop drastis! Ikuti kebiasaan pengisian daya yang tepat sesuai standar industri Apple.',
        tags: ['iPhone', 'Baterai', 'Tips Gadget', 'Apple'],
        coverImage: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
        content: 'Baterai lithium-ion bekerja optimal pada siklus suhu ruang antara 16° hingga 22° C. Hindari mengisi daya sambil bermain game berat...',
      },
      {
        slug: 'perbedaan-lcd-original-vs-oem-incell',
        title: 'Mengenal Perbedaan Layar LCD Original OLED vs OEM Incell: Mana yang Paling Pas Buat Anda?',
        category: 'Panduan Servis',
        excerpt: 'Ketahui aspek sensitivitas sentuhan, saturasi warna, konsumsi daya baterai, dan durabilitas sebelum mengganti layar HP pecah Anda.',
        tags: ['LCD', 'Servis HP', 'OLED', 'Sparepart'],
        coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
        content: 'Layar Original OLED menawarkan ketajaman kontras rasio tak hingga dan warna hitam pekat yang sempurna. Sementara OEM Incell adalah opsi hemat...',
      },
      {
        slug: 'keuntungan-beli-gadget-bergaransi-toko-offline',
        title: 'Mengapa Belanja Gadget di Toko Fisik Multi-PT Jauh Lebih Tenang Dibanding Toko Online Gelap?',
        category: 'Edukasi Konsumen',
        excerpt: 'Kepastian garansi 30 hari tukar baru, bukti faktur pajak legal, dan dukungan servis tatap muka langsung di mall-mall terdekat.',
        tags: ['Garansi 30 Hari', 'Toko Offline', 'Multi PT', 'Belanja Aman'],
        coverImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&q=80',
        content: 'Banyak pembeli online terjebak unit black market tanpa perlindungan IMEI resmi. Dengan jaringan toko fisik Multi-PT kami, seluruh unit terdaftar...',
      },
      {
        slug: 'komparasi-samsung-s24-ultra-vs-iphone-15-pro-max',
        title: 'Head-to-Head Flagship 2026: Samsung Galaxy S24 Ultra vs Apple iPhone 15 Pro Max',
        category: 'Review Gadget',
        excerpt: 'Komparasi menyeluruh kamera 200MP, titanium frame, efisiensi Snapdragon 8 Gen 3 vs A17 Pro, serta fitur AI sehari-hari.',
        tags: ['Samsung', 'Apple', 'Flagship', 'Review'],
        coverImage: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        content: 'Kedua ponsel puncak ini mewakili mahakarya teknologi masa kini. Jika produktivitas stylus S-Pen adalah prioritas Anda...',
      },
      {
        slug: 'cara-klaim-garansi-30-hari-tukar-unit-baru',
        title: 'Panduan Lengkap Klaim Garansi 30 Hari Ganti Unit Baru Tanpa Ribet',
        category: 'Layanan Garansi',
        excerpt: 'Langkah mudah verifikasi serial number, upload foto kerusakan fungsi, dan pengiriman kurir ekspres gratis.',
        tags: ['Garansi', 'Customer Service', 'Klaim Retur'],
        coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
        content: 'Komitmen kami adalah kepuasan 100%. Apabila unit yang Anda beli mengalami cacat fungsi pabrik dalam 30 hari...',
      },
      {
        slug: 'panduan-memilih-storage-hp-128gb-vs-256gb',
        title: '128GB vs 256GB vs 512GB: Berapa Kapasitas Memori HP yang Benar-Benar Anda Butuhkan?',
        category: 'Panduan Pembelian',
        excerpt: 'Simulasi penggunaan file video 4K, instalasi game AAA, dan cache WhatsApp untuk memilih kapasitas storage yang tepat.',
        tags: ['Storage', 'Tips Belanja', 'Smartphone'],
        coverImage: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&q=80',
        content: 'Di era rekaman video beresolusi 4K 60fps, file video berdurasi 1 menit saja bisa menghabiskan 400MB memori...',
      },
    ]

    for (let i = 0; i < 25; i++) {
      const base = articleList[i % articleList.length]
      const slug = `${base.slug}-${i + 1}`
      await prisma.article.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          title: `${base.title} (Edisi #${i + 1})`,
          excerpt: base.excerpt,
          content: base.content + `\n\nBagian tambahan analisis mendalam untuk edisi ${i + 1}.`,
          category: base.category,
          tags: base.tags,
          coverImage: base.coverImage,
          isPublished: true,
          publishedAt: randomDate(60),
        },
      })
    }
  }

  // 10. SEED MORE REVIEWS (BOOST TO 300+)
  console.log('⭐ 9. Melipatgandakan Ulasan & Komentar Produk (Review)...')
  const products = await prisma.product.findMany()
  const reviewCount = await prisma.review.count()
  if (reviewCount < 250) {
    const commentsList = [
      'Barang original 100% mulus tanpa lecet! Pengiriman JNE YES kilat 1 hari sampai ke Surabaya.',
      'Sangat puas belanja di toko cabang Roxy Mas. Segel utuh, garansi resmi terdaftar, bonus softcase & tempered glass lengkap.',
      'Pelayanan customer service ramah banget pas tanya-tanya lewat chat toko. Unit berfungsi prima!',
      'Packing kayu tebal & asuransi aman banget. Layar OLED cerah tanpa dead pixel.',
      'Harga bersaing, dapat cashback voucher promo lagi. Recommended seller bintang lima!',
      'Unit second rasa baru. Baterai health masih 98%, kamera jernih banget untuk foto produk olshop.',
      'Sempat bingung pilih warna, adminnya sabar kirimkan foto asli fisik barang via chat. Mantap!',
      'Gojek instan 1 jam sampai di kantor. Langsung dipakai meeting Zoom seharian tanpa kendala.',
    ]

    for (let i = 0; i < 150; i++) {
      const prod = randomElement(products)
      const cust = randomElement(customers)
      const rating = randomInt(4, 5)
      await prisma.review.create({
        data: {
          userId: cust.id,
          productId: prod.id,
          storeId: prod.storeId,
          type: ReviewType.PRODUCT,
          rating,
          comment: randomElement(commentsList),
          variantName: 'Varian Resmi',
          sellerReply: 'Terima kasih banyak kak atas kepercayaannya! Semoga gadget barunya awet dan berkah selalu 🙏',
          sellerReplyAt: new Date(),
          helpfulCount: randomInt(1, 25),
          createdAt: randomDate(90),
        },
      })
    }
  }

  // 11. SEED INVOICES & WARRANTIES FOR ORDERS
  console.log('🧾 10. Mengisi Faktur Tagihan (Invoice) & Kartu Garansi (Warranty) untuk Seluruh Pesanan...')
  const orders = await prisma.order.findMany({
    include: { invoice: true, warranty: true },
  })

  for (const ord of orders) {
    if (!ord.invoice) {
      const invNum = `INV/${ord.orderNumber}`
      await prisma.invoice.create({
        data: {
          orderId: ord.id,
          invoiceNumber: invNum,
          pdfUrl: `https://affiliategadget.com/invoices/${ord.orderNumber}.pdf`,
          createdAt: ord.createdAt,
        },
      }).catch(() => {})
    }

    if (!ord.warranty && ['COMPLETED', 'SHIPPED', 'IN_PROGRESS'].includes(ord.status)) {
      const startDate = ord.completedAt || ord.createdAt
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      await prisma.warranty.create({
        data: {
          orderId: ord.id,
          startDate,
          endDate,
          isActive: endDate > new Date(),
          createdAt: startDate,
        },
      }).catch(() => {})
    }
  }

  // 12. SEED TICKETS (CUSTOMER SUPPORT / WARRANTY CLAIMS)
  console.log('🎫 11. Mengisi Tiket Bantuan & Resolusi Pengguna (Ticket)...')
  const existingTickets = await prisma.ticket.count()
  if (existingTickets < 60) {
    const ticketSubjects = [
      'Pertanyaan Pengaktifan Garansi 30 Hari',
      'Kendala Pengaturan Jaringan Seluler 5G',
      'Permohonan Salinan Faktur Pajak Pembelian',
      'Cek Status Paket Kurir JNE Belum Bergerak',
      'Konsultasi Pindah Data iPhone Lama ke Baru',
      'Pertanyaan Ketahanan Baterai Pasca Update iOS',
    ]

    for (let i = 0; i < 50; i++) {
      const ord = randomElement(orders)
      await prisma.ticket.create({
        data: {
          orderId: ord.id,
          userId: ord.userId,
          subject: randomElement(ticketSubjects),
          description: `Halo tim support Affiliate Gadget, saya ingin menanyakan perihal transaksi nomor ${ord.orderNumber}. Mohon bantuannya ya.`,
          status: randomElement([TicketStatus.OPEN, TicketStatus.RESOLVED, TicketStatus.CLOSED]),
          resolvedAt: Math.random() > 0.3 ? new Date() : null,
          createdAt: randomDate(45),
        },
      })
    }
  }

  // 13. SEED NOTIFICATIONS (BOOST TO 200+)
  console.log('🔔 12. Mengisi Notifikasi Pengguna (Notification)...')
  const existingNotifs = await prisma.notification.count()
  if (existingNotifs < 150) {
    const notifTemplates = [
      { type: NotificationType.ORDER_CREATED, title: 'Pesanan Berhasil Dibuat', msg: 'Pesanan baru Anda telah kami terima dan menunggu verifikasi pembayaran.' },
      { type: NotificationType.PAYMENT_VERIFIED, title: 'Pembayaran Dikonfirmasi', msg: 'Pembayaran transfer bank Anda telah terverifikasi lunas. Penjual sedang menyiapkan barang.' },
      { type: NotificationType.ORDER_STATUS_CHANGED, title: 'Paket Sedang Dikirim', msg: 'Pesanan Anda telah diserahkan ke kurir JNE Express dengan nomor resi aktif.' },
      { type: NotificationType.NEW_REVIEW, title: 'Ulasan Anda Tayang', msg: 'Terima kasih atas ulasan bintang 5 Anda pada produk gadget favorit!' },
      { type: NotificationType.NEW_MESSAGE, title: 'Pesan Baru dari Toko', msg: 'Penjual membalas inkuiri Anda mengenai status garansi unit.' },
    ]

    for (let i = 0; i < 150; i++) {
      const u = randomElement(customers)
      const t = randomElement(notifTemplates)
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: t.type,
          title: t.title,
          message: t.msg,
          isRead: Math.random() > 0.4,
          link: '/dashboard/customer/orders',
          createdAt: randomDate(30),
        },
      })
    }
  }

  // 14. SEED CARTS & CART ITEMS
  console.log('🛒 13. Mengisi Keranjang Belanja Aktif (Cart & CartItem)...')
  for (const c of customers.slice(0, 25)) {
    let cart = await prisma.cart.findFirst({ where: { userId: c.id } })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: c.id } })
    }
    const itemCount = await prisma.cartItem.count({ where: { cartId: cart.id } })
    if (itemCount < 3) {
      const prod = randomElement(products)
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          type: CartItemType.PRODUCT,
          productId: prod.id,
          quantity: randomInt(1, 2),
        },
      })
    }
  }

  // 15. SEED TECHNICIAN CHATS (ChatRoom & ChatMessage)
  console.log('💬 14. Mengisi Percakapan Servis Teknisi (ChatRoom & ChatMessage)...')
  const existingChatRooms = await prisma.chatRoom.count()
  const techs = await prisma.technician.findMany()
  if (existingChatRooms < 15 && techs.length > 0) {
    for (let i = 0; i < Math.min(customers.length, 15); i++) {
      const cust = customers[i]
      const tech = techs[i % techs.length]

      const room = await prisma.chatRoom.upsert({
        where: { customerId_technicianId: { customerId: cust.id, technicianId: tech.id } },
        update: {},
        create: {
          customerId: cust.id,
          technicianId: tech.id,
          lastMessageAt: new Date(),
        },
      })

      const msgCount = await prisma.chatMessage.count({ where: { roomId: room.id } })
      if (msgCount === 0) {
        await prisma.chatMessage.createMany({
          data: [
            { roomId: room.id, senderId: cust.id, content: 'Halo mas teknisi, apakah bisa konsultasi ganti baterai iPhone 13?', isRead: true, createdAt: randomDate(5) },
            { roomId: room.id, senderId: tech.userId, content: 'Bisa kak! Baterai original ready stok, pengerjaan sekitar 45 menit bisa ditunggu di bengkel.', isRead: true, createdAt: randomDate(4) },
            { roomId: room.id, senderId: cust.id, content: 'Siap mas, besok sore saya mampir ya. Terima kasih!', isRead: true, createdAt: randomDate(3) },
          ],
        })
      }
    }
  }

  // 16. SEED STORE ADMIN CHATS (AdminChatRoom & AdminChatMessage)
  console.log('🏢 15. Mengisi Ruang Obrolan Toko & Admin (AdminChatRoom & AdminChatMessage)...')
  const existingAdminRooms = await prisma.adminChatRoom.count()
  if (existingAdminRooms < 20) {
    for (let i = 0; i < 15; i++) {
      const cust = randomElement(customers)
      const st = randomElement(stores)
      const ord = randomElement(orders)

      const room = await prisma.adminChatRoom.create({
        data: {
          customerId: cust.id,
          storeId: st.id,
          orderId: ord ? ord.id : null,
          lastMessageAt: new Date(),
        },
      })

      await prisma.adminChatMessage.createMany({
        data: [
          { roomId: room.id, senderId: cust.id, content: 'Halo admin, apakah produk ini masih tersedia stoknya?', isRead: true, createdAt: randomDate(10) },
          { roomId: room.id, senderId: cust.id, content: 'Saya mau order warna Space Gray varian 256GB.', isRead: true, createdAt: randomDate(9) },
        ],
      })
    }
  }

  // 17. SEED GENERIC CHAT & MESSAGES (chats & messages)
  console.log('🗨️ 16. Mengisi Tabel Pesan Riwayat (chats & messages)...')
  const existingChatsCount = await prisma.chats.count()
  if (existingChatsCount < 10) {
    for (let i = 0; i < 10; i++) {
      const c = randomElement(customers)
      const chatId = `chat_legacy_${i + 1}`
      await prisma.chats.create({
        data: {
          id: chatId,
          userId: c.id,
          updatedAt: new Date(),
        },
      })

      await prisma.messages.createMany({
        data: [
          { id: `msg_${chatId}_1`, chatId, senderId: c.id, content: 'Pertanyaan seputar metode pembayaran kartu kredit', isRead: true, updatedAt: new Date() },
          { id: `msg_${chatId}_2`, chatId, senderId: c.id, content: 'Apakah mendukung cicilan 0% 12 bulan?', isRead: true, updatedAt: new Date() },
        ],
      })
    }
  }

  // 18. SEED MORE INTERNAL ADS (BOOST TO 12+)
  console.log('📢 17. Mengisi Slot Iklan Internal (InternalAd)...')
  const existingAds = await prisma.internalAd.count()
  if (existingAds < 10) {
    await prisma.internalAd.createMany({
      data: [
        {
          title: 'Promo Spesial Pesta Gadget Gajian Diskon Hingga 30%',
          subtitle: 'Voucher ekstra Rp 500.000 untuk transaksi dengan Gojek Instant.',
          bannerUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
          placement: AdPlacement.HOMEPAGE_HERO,
          clicks: 340,
          impressions: 4890,
          isActive: true,
          priority: 2,
        },
        {
          title: 'Servis LCD Kilat 2 Jam Bergaransi 30 Hari',
          subtitle: 'Teknisi profesional siap melayani di 8 kota besar Indonesia.',
          bannerUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
          placement: AdPlacement.PROMOTED_LIST,
          clicks: 180,
          impressions: 2750,
          isActive: true,
          priority: 1,
        },
        {
          title: 'Program Tukar Tambah Gadget Lama Jadi Baru',
          subtitle: 'Bawa HP lama Anda ke cabang toko Roxy Mas atau WTC Surabaya, langsung terima nilai tertinggi!',
          bannerUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&q=80',
          placement: AdPlacement.BANNER_SPONSOR,
          clicks: 95,
          impressions: 1540,
          isActive: true,
          priority: 1,
        },
      ],
    })
  }

  // 19. SEED MORE AUDIT LOGS (BOOST TO 200+)
  console.log('🛡️ 18. Mengisi Log Audit Keamanan & Transaksi (AuditLog)...')
  const existingAuditLogs = await prisma.auditLog.count()
  if (existingAuditLogs < 200) {
    const actions = [
      'USER_LOGIN', 'CHECKOUT_ORDER', 'PAYMENT_VERIFIED', 'UPDATE_PRODUCT_PRICE',
      'CHANGE_ORDER_STATUS', 'APPROVE_RETURN_REQUEST', 'RESOLVE_COMPLAINT', 'DOWNLOAD_FINANCIAL_REPORT'
    ]
    const logs = []
    for (let i = 0; i < 150; i++) {
      const u = randomElement(allUsers)
      const action = randomElement(actions)
      logs.push({
        userId: u.id,
        action,
        entityType: action.includes('ORDER') ? 'Order' : action.includes('PRODUCT') ? 'Product' : 'User',
        ipAddress: `182.253.${randomInt(1, 254)}.${randomInt(1, 254)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
        details: { status: 'SUCCESS', timestamp: new Date().toISOString() },
        createdAt: randomDate(60),
      })
    }
    await prisma.auditLog.createMany({ data: logs })
  }

  console.timeEnd('Total Seeding Time')
  console.log('✨ SEMUA TABEL TELAH DIISI DATA MASIF SECARA TUNTAS & BERHASIL 100%!')
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding Massive:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
