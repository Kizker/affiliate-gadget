import { PrismaClient, UserRole, DayOfWeek } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive realistic seed for Affiliate Gadget Platform...')

  // Clean existing specific test data to avoid duplicate conflict
  console.log('🧹 Cleaning existing records...')
  await prisma.productVariant.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.storeBankAccount.deleteMany({})
  await prisma.storeSchedule.deleteMany({})
  await prisma.store.deleteMany({})

  // Passwords
  const adminPassword = await bcrypt.hash('admin123', 12)
  const salesPassword = await bcrypt.hash('sales123', 12)
  const customerPassword = await bcrypt.hash('customer123', 12)
  const financePassword = await bcrypt.hash('finance123', 12)

  // 1. SUPER ADMIN & ADMIN (PLATFORM)
  console.log('👤 Creating Super Admin & Admin Platform accounts...')
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@affiliategadget.com' },
    update: {
      name: 'Super Admin',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      phone: '081289001122',
      isActive: true,
    },
    create: {
      email: 'superadmin@affiliategadget.com',
      name: 'Super Admin',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      phone: '081289001122',
      isActive: true,
    },
  })

  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@affiliategadget.com' },
    update: {
      name: 'Admin Operasional Platform',
      password: adminPassword,
      role: UserRole.ADMIN,
      phone: '081289003344',
      isActive: true,
    },
    create: {
      email: 'admin@affiliategadget.com',
      name: 'Admin Operasional Platform',
      password: adminPassword,
      role: UserRole.ADMIN,
      phone: '081289003344',
      isActive: true,
    },
  })

  // 2. TOKO FISIK & BADAN HUKUM PT (5 Real Stores Across Indonesia)
  console.log('🏬 Creating 5 Official Multi-PT Stores...')
  
  // Store 1: Jakarta Pusat - Roxy Mas (PT Gadget Jaya Sentosa)
  const storeRoxy = await prisma.store.create({
    data: {
      name: 'Affiliate Gadget - Roxy Mas Jakarta',
      slug: 'roxy-mas-jakarta',
      companyName: 'PT Gadget Jaya Sentosa',
      taxId: '01.428.910.4-015.000',
      tagline: 'Pusat Gadget & Flagship Store Jakarta Pusat',
      description: 'Cabang pusat penjualan smartphone second berkualitas resmi bergaransi 30 hari di ITC Roxy Mas. Melayani pembelian unit second like new, tukar tambah, dan servis kilat dengan teknisi tersertifikasi.',
      address: 'ITC Roxy Mas Lt. 2 No. 45-47, Jl. KH. Hasyim Ashari No. 125, Cideng, Gambir',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10150',
      phone: '021-63859988',
      whatsapp: '6281288997701',
      email: 'roxy@affiliategadget.com',
      logo: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80',
      isOwnerStore: true,
      commissionRate: 1.5,
      rating: 4.9,
      totalReview: 128,
      totalSales: 435,
      isActive: true,
      bankAccounts: {
        create: [
          {
            bankName: 'Bank Mandiri',
            accountNumber: '1180019283741',
            accountName: 'PT Gadget Jaya Sentosa',
            isPrimary: true,
          },
          {
            bankName: 'Bank Central Asia (BCA)',
            accountNumber: '5270918234',
            accountName: 'PT Gadget Jaya Sentosa',
            isPrimary: false,
          },
        ],
      },
      schedules: {
        create: [
          { day: DayOfWeek.MONDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.TUESDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.WEDNESDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.THURSDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.FRIDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.SATURDAY, openTime: '10:00', closeTime: '21:30' },
          { day: DayOfWeek.SUNDAY, openTime: '10:00', closeTime: '21:30' },
        ],
      },
    },
  })

  // Store 2: Surabaya - WTC Surabaya (PT Sinar Gadget Nusantara)
  const storeSurabaya = await prisma.store.create({
    data: {
      name: 'Affiliate Gadget - WTC Surabaya',
      slug: 'wtc-surabaya',
      companyName: 'PT Sinar Gadget Nusantara',
      taxId: '02.582.119.8-609.000',
      tagline: 'Pusat Smartphone Resmi Jawa Timur',
      description: 'Pusat belanja gadget terbesar di Surabaya. Seluruh unit dijamin 100% original, segel resmi, dengan proteksi garansi ganti unit 30 hari.',
      address: 'WTC Surabaya Galeria Lt. 3 No. 312-315, Jl. Pemuda No. 27-31, Embong Kaliasin, Genteng',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60271',
      phone: '031-5319800',
      whatsapp: '6281399887702',
      email: 'surabaya@affiliategadget.com',
      logo: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=80',
      isOwnerStore: false,
      commissionRate: 2.0,
      rating: 4.9,
      totalReview: 94,
      totalSales: 312,
      isActive: true,
      bankAccounts: {
        create: [
          {
            bankName: 'Bank Central Asia (BCA)',
            accountNumber: '0882319485',
            accountName: 'PT Sinar Gadget Nusantara',
            isPrimary: true,
          },
        ],
      },
      schedules: {
        create: [
          { day: DayOfWeek.MONDAY, openTime: '10:00', closeTime: '21:30' },
          { day: DayOfWeek.TUESDAY, openTime: '10:00', closeTime: '21:30' },
          { day: DayOfWeek.WEDNESDAY, openTime: '10:00', closeTime: '21:30' },
          { day: DayOfWeek.THURSDAY, openTime: '10:00', closeTime: '21:30' },
          { day: DayOfWeek.FRIDAY, openTime: '10:00', closeTime: '21:30' },
          { day: DayOfWeek.SATURDAY, openTime: '10:00', closeTime: '22:00' },
          { day: DayOfWeek.SUNDAY, openTime: '10:00', closeTime: '22:00' },
        ],
      },
    },
  })

  // Store 3: Bandung - BEC Bandung (PT Digital Niaga Prima)
  const storeBandung = await prisma.store.create({
    data: {
      name: 'Affiliate Gadget - BEC Bandung',
      slug: 'bec-bandung',
      companyName: 'PT Digital Niaga Prima',
      taxId: '03.194.882.1-428.000',
      tagline: 'Gadget & Gaming Phone Hub Bandung',
      description: 'Spesialis smartphone flagship dan gaming phone di kawasan Dago & Purnawarman Bandung. Dilengkapi unit demo dan teknisi siap bantu.',
      address: 'Bandung Electronic Center (BEC) Lt. 1 Blok B-08 & B-09, Jl. Purnawarman No. 13-15, Babakan Ciamis, Sumur Bandung',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40117',
      phone: '022-4209911',
      whatsapp: '6281122334455',
      email: 'bandung@affiliategadget.com',
      logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
      isOwnerStore: false,
      commissionRate: 2.0,
      rating: 4.8,
      totalReview: 82,
      totalSales: 268,
      isActive: true,
      bankAccounts: {
        create: [
          {
            bankName: 'Bank Mandiri',
            accountNumber: '1310088271629',
            accountName: 'PT Digital Niaga Prima',
            isPrimary: true,
          },
        ],
      },
      schedules: {
        create: [
          { day: DayOfWeek.MONDAY, openTime: '10:00', closeTime: '20:30' },
          { day: DayOfWeek.TUESDAY, openTime: '10:00', closeTime: '20:30' },
          { day: DayOfWeek.WEDNESDAY, openTime: '10:00', closeTime: '20:30' },
          { day: DayOfWeek.THURSDAY, openTime: '10:00', closeTime: '20:30' },
          { day: DayOfWeek.FRIDAY, openTime: '10:00', closeTime: '20:30' },
          { day: DayOfWeek.SATURDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.SUNDAY, openTime: '10:00', closeTime: '21:00' },
        ],
      },
    },
  })

  // Store 4: Medan - Plaza Medan Fair (PT Surya Makmur Gadget)
  const storeMedan = await prisma.store.create({
    data: {
      name: 'Affiliate Gadget - Plaza Medan Fair',
      slug: 'plaza-medan-fair',
      companyName: 'PT Surya Makmur Gadget',
      taxId: '04.812.339.7-112.000',
      tagline: 'Pusat Gadget Resmi Sumatera Utara',
      description: 'Toko gadget terpercaya di Medan dengan fasilitas konsultasi langsung, unboxing di tempat, dan bonus paket aksesoris lengkap 3-in-1.',
      address: 'Plaza Medan Fair Lt. 4 No. 42-44, Jl. Gatot Subroto No. 30, Sekip, Medan Petisah',
      city: 'Medan',
      province: 'Sumatera Utara',
      postalCode: '20113',
      phone: '061-4518822',
      whatsapp: '6281266554433',
      email: 'medan@affiliategadget.com',
      logo: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&q=80',
      isOwnerStore: false,
      commissionRate: 2.5,
      rating: 4.9,
      totalReview: 67,
      totalSales: 195,
      isActive: true,
      bankAccounts: {
        create: [
          {
            bankName: 'Bank Rakyat Indonesia (BRI)',
            accountNumber: '005301002938301',
            accountName: 'PT Surya Makmur Gadget',
            isPrimary: true,
          },
        ],
      },
      schedules: {
        create: [
          { day: DayOfWeek.MONDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.TUESDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.WEDNESDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.THURSDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.FRIDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.SATURDAY, openTime: '10:00', closeTime: '21:30' },
          { day: DayOfWeek.SUNDAY, openTime: '10:00', closeTime: '21:30' },
        ],
      },
    },
  })

  // Store 5: Yogyakarta - Jogja Tronik Mall (PT Mega Ponsel Nusantara)
  const storeJogja = await prisma.store.create({
    data: {
      name: 'Affiliate Gadget - Jogja Tronik Mall',
      slug: 'jogja-tronik-mall',
      companyName: 'PT Mega Ponsel Nusantara',
      taxId: '05.671.229.4-541.000',
      tagline: 'Pusat Gadget Mahasiswa & Profesional Jogja',
      description: 'Melayani civitas akademika & masyarakat Yogyakarta dengan harga terbaik, garansi tukar unit 30 hari, dan gratis softcase + tempered glass.',
      address: 'Jogja Tronik Mall Lt. UG No. 18-20, Jl. Brigjen Katamso No. 75-77, Prawirodirjan, Gondomanan',
      city: 'Yogyakarta',
      province: 'DI Yogyakarta',
      postalCode: '55121',
      phone: '0274-556677',
      whatsapp: '6281788990011',
      email: 'jogja@affiliategadget.com',
      logo: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
      isOwnerStore: false,
      commissionRate: 2.0,
      rating: 4.9,
      totalReview: 75,
      totalSales: 210,
      isActive: true,
      bankAccounts: {
        create: [
          {
            bankName: 'Bank Central Asia (BCA)',
            accountNumber: '1690882711',
            accountName: 'PT Mega Ponsel Nusantara',
            isPrimary: true,
          },
        ],
      },
      schedules: {
        create: [
          { day: DayOfWeek.MONDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.TUESDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.WEDNESDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.THURSDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.FRIDAY, openTime: '10:00', closeTime: '21:00' },
          { day: DayOfWeek.SATURDAY, openTime: '10:00', closeTime: '21:30' },
          { day: DayOfWeek.SUNDAY, openTime: '10:00', closeTime: '21:30' },
        ],
      },
    },
  })

  // 3. STORE ADMIN ACCOUNTS (1 Admin Tunggal per Cabang Toko PT)
  console.log('👨‍💼 Creating Single Store Admin accounts (1 Admin per Toko)...')
  
  // 3.1 Admin Cabang Roxy Mas Pusat (Jakarta)
  await prisma.user.upsert({
    where: { email: 'admin.roxy@affiliategadget.com' },
    update: {
      name: 'Bambang S. (Admin Roxy Mas)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeRoxy.id,
      phone: '081288997700',
    },
    create: {
      email: 'admin.roxy@affiliategadget.com',
      name: 'Bambang S. (Admin Roxy Mas)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeRoxy.id,
      phone: '081288997700',
    },
  })

  // 3.2 Admin Cabang WTC Surabaya
  await prisma.user.upsert({
    where: { email: 'admin.surabaya@affiliategadget.com' },
    update: {
      name: 'Kevin Santoso (Admin WTC Surabaya)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeSurabaya.id,
      phone: '081399887702',
    },
    create: {
      email: 'admin.surabaya@affiliategadget.com',
      name: 'Kevin Santoso (Admin WTC Surabaya)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeSurabaya.id,
      phone: '081399887702',
    },
  })

  // 3.3 Admin Cabang BEC Bandung
  await prisma.user.upsert({
    where: { email: 'admin.bandung@affiliategadget.com' },
    update: {
      name: 'Reza Pratama (Admin BEC Bandung)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeBandung.id,
      phone: '081122334455',
    },
    create: {
      email: 'admin.bandung@affiliategadget.com',
      name: 'Reza Pratama (Admin BEC Bandung)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeBandung.id,
      phone: '081122334455',
    },
  })

  // 3.4 Admin Cabang Plaza Medan Fair
  await prisma.user.upsert({
    where: { email: 'admin.medan@affiliategadget.com' },
    update: {
      name: 'Rian Siregar (Admin Medan Fair)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeMedan.id,
      phone: '081266554433',
    },
    create: {
      email: 'admin.medan@affiliategadget.com',
      name: 'Rian Siregar (Admin Medan Fair)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeMedan.id,
      phone: '081266554433',
    },
  })

  // 3.5 Admin Cabang Jogjatronik Mall
  await prisma.user.upsert({
    where: { email: 'admin.jogja@affiliategadget.com' },
    update: {
      name: 'Anisa Putri (Admin Jogjatronik)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeJogja.id,
      phone: '081788990011',
    },
    create: {
      email: 'admin.jogja@affiliategadget.com',
      name: 'Anisa Putri (Admin Jogjatronik)',
      password: adminPassword,
      role: UserRole.STORE_ADMIN,
      storeId: storeJogja.id,
      phone: '081788990011',
    },
  })

  // 4. CUSTOMER / BUYER ACCOUNTS
  console.log('🛍 Creating Realistic Customer accounts...')
  const customers = [
    {
      email: 'customer@test.com',
      name: 'Rian Pratama',
      phone: '081289901122',
      address: 'Jl. Senopati No. 42, Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
    },
    {
      email: 'siti.aminah@gmail.com',
      name: 'Siti Aminah',
      phone: '081377889900',
      address: 'Jl. Dharmahusada Indah Timur No. 15',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60115',
    },
    {
      email: 'dimas.setiawan@gmail.com',
      name: 'Dimas Setiawan',
      phone: '081233445566',
      address: 'Jl. Ir. H. Juanda No. 128, Dago',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40135',
    },
    {
      email: 'maya.kartika@gmail.com',
      name: 'Maya Kartika',
      phone: '081266778899',
      address: 'Jl. S. Parman No. 56, Petisah Tengah',
      city: 'Medan',
      province: 'Sumatera Utara',
      postalCode: '20112',
    },
    {
      email: 'fajar.nugroho@gmail.com',
      name: 'Fajar Nugroho',
      phone: '081800112233',
      address: 'Jl. Kaliurang KM 5.2 No. 24, Caturtunggal',
      city: 'Yogyakarta',
      province: 'DI Yogyakarta',
      postalCode: '55281',
    },
  ]

  for (const c of customers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {
        name: c.name,
        password: customerPassword,
        role: UserRole.CUSTOMER,
        phone: c.phone,
        address: c.address,
        city: c.city,
        province: c.province,
        postalCode: c.postalCode,
        isActive: true,
      },
      create: {
        email: c.email,
        name: c.name,
        password: customerPassword,
        role: UserRole.CUSTOMER,
        phone: c.phone,
        address: c.address,
        city: c.city,
        province: c.province,
        postalCode: c.postalCode,
        isActive: true,
      },
    })
  }

  // 5. REALISTIC SMARTPHONE PRODUCTS & VARIANTS
  console.log('📱 Creating 12 Realistic Smartphone Products & Variants...')

  // Product 1: iPhone 15 Pro Max
  await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro Max 256GB Titanium',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 22999000,
      originalPrice: 24999000,
      stock: 15,
      weightGram: 550,
      storeId: storeRoxy.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 10,
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
      ],
      description: 'Apple iPhone 15 Pro Max dengan material Titanium kelas kedirgantaraan, chip revolusioner Apple A17 Pro (3nm), kamera utama 48MP dengan 5x Optical Telephoto Zoom, dan port USB-C berkecepatan 10Gbps.',
      specs: {
        Chipset: 'Apple A17 Pro (3nm)',
        Layar: '6.7 inch Super Retina XDR OLED, 120Hz ProMotion, 2000 nits',
        Kamera: '48MP Utama + 12MP Ultra-wide + 12MP 5x Telephoto',
        Baterai: '4.422 mAh Fast Charging 20W & MagSafe Wireless',
        Material: 'Titanium Frame Grade 5 & Ceramic Shield',
        Port: 'USB Type-C 3.0 (hingga 10 Gbps)',
      },
      variants: {
        create: [
          { name: '256GB - Natural Titanium', ram: '8GB', storage: '256GB', color: 'Natural Titanium', price: 22999000, stock: 6, sku: 'IP15PM-256-NT' },
          { name: '256GB - Blue Titanium', ram: '8GB', storage: '256GB', color: 'Blue Titanium', price: 22999000, stock: 4, sku: 'IP15PM-256-BT' },
          { name: '512GB - Black Titanium', ram: '8GB', storage: '512GB', color: 'Black Titanium', price: 26999000, stock: 3, sku: 'IP15PM-512-BL' },
          { name: '1TB - White Titanium', ram: '8GB', storage: '1TB', color: 'White Titanium', price: 30999000, stock: 2, sku: 'IP15PM-1TB-WT' },
        ],
      },
    },
  })

  // Product 2: iPhone 15 Pro
  await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro 128GB Titanium',
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 18999000,
      originalPrice: 20999000,
      stock: 13,
      weightGram: 500,
      storeId: storeRoxy.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 9,
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      ],
      description: 'Apple iPhone 15 Pro dalam bodi ringkas 6.1 inci dengan performa dahsyat chipset A17 Pro untuk pengalaman gaming level konsol dan Action Button serbaguna.',
      specs: {
        Chipset: 'Apple A17 Pro (3nm)',
        Layar: '6.1 inch Super Retina XDR OLED, 120Hz ProMotion',
        Kamera: '48MP Utama + 12MP Ultra-wide + 12MP 3x Telephoto',
        Baterai: '3.274 mAh Fast Charging & MagSafe',
        Material: 'Titanium Frame Grade 5',
      },
      variants: {
        create: [
          { name: '128GB - Natural Titanium', ram: '8GB', storage: '128GB', color: 'Natural Titanium', price: 18999000, stock: 8, sku: 'IP15P-128-NT' },
          { name: '256GB - Black Titanium', ram: '8GB', storage: '256GB', color: 'Black Titanium', price: 21499000, stock: 5, sku: 'IP15P-256-BL' },
        ],
      },
    },
  })

  // Product 3: iPhone 14
  await prisma.product.create({
    data: {
      name: 'iPhone 14 128GB Midnight Blue',
      brand: 'Apple',
      model: 'iPhone 14',
      category: 'Smartphone',
      condition: 'SECOND_MULUS',
      price: 12499000,
      originalPrice: 13999000,
      stock: 21,
      weightGram: 480,
      storeId: storeSurabaya.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: false,
      promotionPriority: 5,
      images: [
        'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&q=80',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
      ],
      description: 'iPhone 14 hadir dengan sistem kamera ganda canggih, Photonic Engine untuk foto minim cahaya yang memukau, dan daya tahan baterai sepanjang hari.',
      specs: {
        Chipset: 'Apple A15 Bionic (5-core GPU)',
        Layar: '6.1 inch Super Retina XDR OLED',
        Kamera: '12MP Utama + 12MP Ultra-wide Photonic Engine',
        Baterai: '3.279 mAh Fast Charging',
        Proteksi: 'Ceramic Shield & IP68 Water Resistant',
      },
      variants: {
        create: [
          { name: '128GB - Midnight', ram: '6GB', storage: '128GB', color: 'Midnight', price: 12499000, stock: 10, sku: 'IP14-128-MN' },
          { name: '128GB - Starlight', ram: '6GB', storage: '128GB', color: 'Starlight', price: 12499000, stock: 7, sku: 'IP14-128-ST' },
          { name: '256GB - Blue', ram: '6GB', storage: '256GB', color: 'Blue', price: 14999000, stock: 4, sku: 'IP14-256-BL' },
        ],
      },
    },
  })

  // Product 4: Samsung Galaxy S24 Ultra 5G
  await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S24 Ultra 5G 512GB',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 21999000,
      originalPrice: 23999000,
      stock: 15,
      weightGram: 560,
      storeId: storeSurabaya.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 10,
      images: [
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
      ],
      description: 'Samsung Galaxy S24 Ultra dibekali kecerdasan Galaxy AI, kamera 200MP Quad Telephoto dengan ProVisual Engine, frame Titanium, dan layar datar Gorilla Armor bebas pantulan silau.',
      specs: {
        Chipset: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
        Layar: '6.8 inch Dynamic AMOLED 2X, 120Hz LTPO, 2600 nits',
        Kamera: '200MP Utama + 50MP 5x Periscope + 10MP 3x Tele + 12MP UW',
        Baterai: '5.000 mAh 45W Fast Charging & Wireless',
        Fitur: 'Integrated S-Pen, Galaxy AI Live Translate & Circle to Search',
      },
      variants: {
        create: [
          { name: '12GB / 256GB - Titanium Gray', ram: '12GB', storage: '256GB', color: 'Titanium Gray', price: 21999000, stock: 7, sku: 'S24U-256-GR' },
          { name: '12GB / 512GB - Titanium Black', ram: '12GB', storage: '512GB', color: 'Titanium Black', price: 23999000, stock: 5, sku: 'S24U-512-BL' },
          { name: '12GB / 512GB - Titanium Violet', ram: '12GB', storage: '512GB', color: 'Titanium Violet', price: 23999000, stock: 3, sku: 'S24U-512-VT' },
        ],
      },
    },
  })

  // Product 5: Samsung Galaxy Z Fold 6
  await prisma.product.create({
    data: {
      name: 'Samsung Galaxy Z Fold 6 5G 256GB',
      brand: 'Samsung',
      model: 'Galaxy Z Fold 6',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 26499000,
      originalPrice: 28499000,
      stock: 7,
      weightGram: 580,
      storeId: storeRoxy.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 8,
      images: [
        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&q=80',
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
      ],
      description: 'Ponsel lipat flagship paling tipis dan tangguh dengan layar utama 7.6 inci imersif, multitasking 3 aplikasi sekaligus, serta dukungan Galaxy AI komprehensif.',
      specs: {
        Chipset: 'Snapdragon 8 Gen 3 for Galaxy',
        LayarUtama: '7.6 inch Foldable Dynamic AMOLED 2X 120Hz',
        LayarCover: '6.3 inch Dynamic AMOLED 2X 120Hz',
        Kamera: '50MP Utama OIS + 10MP 3x Tele + 12MP Ultra-wide',
        Baterai: '4.400 mAh 25W Fast Charging',
      },
      variants: {
        create: [
          { name: '12GB / 256GB - Silver Shadow', ram: '12GB', storage: '256GB', color: 'Silver Shadow', price: 26499000, stock: 4, sku: 'ZF6-256-SS' },
          { name: '12GB / 512GB - Navy', ram: '12GB', storage: '512GB', color: 'Navy', price: 28499000, stock: 3, sku: 'ZF6-512-NV' },
        ],
      },
    },
  })

  // Product 6: Samsung Galaxy A55 5G
  await prisma.product.create({
    data: {
      name: 'Samsung Galaxy A55 5G 8GB/256GB',
      brand: 'Samsung',
      model: 'Galaxy A55 5G',
      category: 'Smartphone',
      condition: 'GRADE_A',
      price: 5999000,
      originalPrice: 6499000,
      stock: 27,
      weightGram: 450,
      storeId: storeJogja.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: false,
      promotionPriority: 4,
      images: [
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
      ],
      description: 'Juara kelas menengah Samsung dengan bingkai metal premium, perlindungan Gorilla Glass Victus+, ketahanan air IP67, dan kamera 50MP OIS jernih.',
      specs: {
        Chipset: 'Exynos 1480 with AMD Xclipse 530 GPU',
        Layar: '6.6 inch Super AMOLED 120Hz HDR10+ 1000 nits',
        Kamera: '50MP OIS Utama + 12MP Ultra-wide + 5MP Macro',
        Baterai: '5.000 mAh 25W Fast Charging',
        Proteksi: 'IP67 Dust & Water Resistant',
      },
      variants: {
        create: [
          { name: '8GB / 256GB - Awesome Iceblue', ram: '8GB', storage: '256GB', color: 'Awesome Iceblue', price: 5999000, stock: 15, sku: 'A55-256-IB' },
          { name: '8GB / 256GB - Awesome Navy', ram: '8GB', storage: '256GB', color: 'Awesome Navy', price: 5999000, stock: 12, sku: 'A55-256-NV' },
        ],
      },
    },
  })

  // Product 7: ASUS ROG Phone 8 Pro
  await prisma.product.create({
    data: {
      name: 'ASUS ROG Phone 8 Pro 16GB/512GB',
      brand: 'ASUS',
      model: 'ROG Phone 8 Pro',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 15499000,
      originalPrice: 16999000,
      stock: 9,
      weightGram: 590,
      storeId: storeBandung.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 7,
      images: [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      ],
      description: 'Monster gaming generasi terbaru dengan layar super halus 165Hz AMOLED, AniMe Vision Mini-LED belakang yang dapat dikustomisasi, dan sistem pendingin GameCool 8.',
      specs: {
        Chipset: 'Snapdragon 8 Gen 3 (4nm)',
        Layar: '6.78 inch Samsung Flexible AMOLED, 165Hz, 2500 nits',
        Kamera: '50MP Sony IMX890 Gimbal OIS + 32MP 3x Telephoto',
        Baterai: '5.500 mAh HyperCharge 65W & Wireless 15W',
        Fitur: 'AirTrigger Ultrasonic Buttons & AniMe Vision Display',
      },
      variants: {
        create: [
          { name: '16GB / 512GB - Phantom Black', ram: '16GB', storage: '512GB', color: 'Phantom Black', price: 15499000, stock: 6, sku: 'ROG8P-512-BK' },
          { name: '24GB / 1TB - Phantom Edition', ram: '24GB', storage: '1TB', color: 'Phantom Black', price: 19999000, stock: 3, sku: 'ROG8P-1TB-BK' },
        ],
      },
    },
  })

  // Product 8: Xiaomi 14 (Leica Summilux)
  await prisma.product.create({
    data: {
      name: 'Xiaomi 14 12GB/512GB Leica Summilux',
      brand: 'Xiaomi',
      model: 'Xiaomi 14',
      category: 'Smartphone',
      condition: 'SECOND_MULUS',
      price: 11999000,
      originalPrice: 12999000,
      stock: 17,
      weightGram: 490,
      storeId: storeBandung.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 6,
      images: [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
      ],
      description: 'Kamera optik legendaris Leica Summilux dengan bukaan lensa lebar f/1.6, sensor Light Hunter 900, dan layar LTPO OLED ultra tajam 3000 nits.',
      specs: {
        Chipset: 'Snapdragon 8 Gen 3 (4nm)',
        Layar: '6.36 inch CrystalRes LTPO AMOLED 120Hz 3000 nits',
        Kamera: '50MP Leica 23mm + 50MP Leica 75mm Floating Tele + 50MP UW',
        Baterai: '4.610 mAh 90W HyperCharge (100% dalam 31 menit)',
      },
      variants: {
        create: [
          { name: '12GB / 256GB - Black', ram: '12GB', storage: '256GB', color: 'Black', price: 11999000, stock: 8, sku: 'MI14-256-BK' },
          { name: '12GB / 512GB - Jade Green', ram: '12GB', storage: '512GB', color: 'Jade Green', price: 12999000, stock: 5, sku: 'MI14-512-JG' },
          { name: '12GB / 512GB - White', ram: '12GB', storage: '512GB', color: 'White', price: 12999000, stock: 4, sku: 'MI14-512-WH' },
        ],
      },
    },
  })

  // Product 9: POCO F6 Pro 5G
  await prisma.product.create({
    data: {
      name: 'POCO F6 Pro 5G 12GB/512GB',
      brand: 'Xiaomi',
      model: 'POCO F6 Pro',
      category: 'Smartphone',
      condition: 'GRADE_A',
      price: 8499000,
      originalPrice: 8999000,
      stock: 16,
      weightGram: 500,
      storeId: storeJogja.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: false,
      promotionPriority: 5,
      images: [
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      ],
      description: 'Flagship killer bertenaga Snapdragon 8 Gen 2 dengan layar resolusi WQHD+ 120Hz Flow AMOLED 4000 nits dan pengisian daya ultra kilat 120W HyperCharge.',
      specs: {
        Chipset: 'Snapdragon 8 Gen 2 (4nm)',
        Layar: '6.67 inch WQHD+ Flow AMOLED 120Hz 4000 nits peak',
        Kamera: '50MP Light Fusion 800 OIS + 8MP Ultra-wide + 2MP Macro',
        Baterai: '5.000 mAh 120W HyperCharge (100% dalam 19 menit)',
      },
      variants: {
        create: [
          { name: '12GB / 512GB - Black', ram: '12GB', storage: '512GB', color: 'Black', price: 8499000, stock: 10, sku: 'F6P-512-BK' },
          { name: '16GB / 1TB - White', ram: '16GB', storage: '1TB', color: 'White', price: 9499000, stock: 6, sku: 'F6P-1TB-WH' },
        ],
      },
    },
  })

  // Product 10: Vivo X100 Pro 5G (ZEISS APO)
  await prisma.product.create({
    data: {
      name: 'Vivo X100 Pro 5G 16GB/512GB ZEISS',
      brand: 'Vivo',
      model: 'Vivo X100 Pro',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 16999000,
      originalPrice: 17999000,
      stock: 9,
      weightGram: 560,
      storeId: storeMedan.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 7,
      images: [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
        'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&q=80',
      ],
      description: 'Master fotografi mobile dengan lensa ZEISS APO Telephoto, sensor Sony IMX989 1-inch raksasa, chip pencitraan khusus Vivo V3, dan prosesor kencang Dimensity 9300.',
      specs: {
        Chipset: 'MediaTek Dimensity 9300 (4nm)',
        Layar: '6.78 inch LTPO AMOLED 120Hz 3000 nits HDR10+',
        Kamera: '50MP 1-inch Sony IMX989 OIS + 50MP ZEISS APO Floating Tele + 50MP UW',
        Baterai: '5.400 mAh 100W FlashCharge & 50W Wireless',
        Fitur: 'ZEISS T* Coating & V3 Imaging Chip',
      },
      variants: {
        create: [
          { name: '16GB / 512GB - Asteroid Black', ram: '16GB', storage: '512GB', color: 'Asteroid Black', price: 16999000, stock: 5, sku: 'X100P-512-BK' },
          { name: '16GB / 512GB - Sunset Orange', ram: '16GB', storage: '512GB', color: 'Sunset Orange', price: 16999000, stock: 4, sku: 'X100P-512-OR' },
        ],
      },
    },
  })

  // Product 11: Vivo V30 Pro 5G
  await prisma.product.create({
    data: {
      name: 'Vivo V30 Pro 5G 12GB/512GB ZEISS',
      brand: 'Vivo',
      model: 'Vivo V30 Pro',
      category: 'Smartphone',
      condition: 'SECOND_MULUS',
      price: 8999000,
      originalPrice: 9499000,
      stock: 14,
      weightGram: 470,
      storeId: storeMedan.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: false,
      promotionPriority: 4,
      images: [
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      ],
      description: 'Ponsel potret kelas atas dengan optik ZEISS triple kamera 50MP, lampu studio Aura Light pintar, bodi ultra tipis 7.45mm, dan baterai besar 5000mAh.',
      specs: {
        Chipset: 'MediaTek Dimensity 8200 (4nm)',
        Layar: '6.78 inch 1.5K 3D Curved AMOLED 120Hz 2800 nits',
        Kamera: '50MP Sony IMX920 OIS + 50MP ZEISS Tele + 50MP Ultra-wide',
        Baterai: '5.000 mAh 80W FlashCharge',
      },
      variants: {
        create: [
          { name: '12GB / 512GB - Equatorial Green', ram: '12GB', storage: '512GB', color: 'Equatorial Green', price: 8999000, stock: 8, sku: 'V30P-512-EG' },
          { name: '12GB / 512GB - Volcanic Black', ram: '12GB', storage: '512GB', color: 'Volcanic Black', price: 8999000, stock: 6, sku: 'V30P-512-VB' },
        ],
      },
    },
  })

  // Product 12: Oppo Find N3 Flip 5G
  await prisma.product.create({
    data: {
      name: 'Oppo Find N3 Flip 5G 12GB/256GB',
      brand: 'Oppo',
      model: 'Find N3 Flip',
      category: 'Smartphone',
      condition: 'LIKE_NEW',
      price: 14999000,
      originalPrice: 15999000,
      stock: 8,
      weightGram: 530,
      storeId: storeSurabaya.id,
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 6,
      images: [
        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
      ],
      description: 'Ponsel lipat vertikal intuitif dengan layar cover multifungsi 3.26 inci, sistem kamera Hasselblad 3 lensa pertama pada flip phone, dan engsel Flexion Hinge tanpa celah.',
      specs: {
        Chipset: 'MediaTek Dimensity 9200',
        LayarUtama: '6.8 inch Foldable LTPO AMOLED 120Hz HDR10+',
        LayarCover: '3.26 inch Vertical Cover AMOLED',
        Kamera: '50MP Hasselblad OIS + 32MP 2x Telephoto + 48MP Ultra-wide',
        Baterai: '4.300 mAh 44W SUPERVOOC',
      },
      variants: {
        create: [
          { name: '12GB / 256GB - Cream Gold', ram: '12GB', storage: '256GB', color: 'Cream Gold', price: 14999000, stock: 4, sku: 'N3F-256-CG' },
          { name: '12GB / 256GB - Sleek Black', ram: '12GB', storage: '256GB', color: 'Sleek Black', price: 14999000, stock: 4, sku: 'N3F-256-SB' },
        ],
      },
    },
  })

  console.log('🎉 Seed completed successfully with realistic Multi-PT Stores, Products, and Accounts!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
