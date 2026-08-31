import { PrismaClient, UserRole, LiveStreamStatus, AdPlacement, DayOfWeek } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Seeding Multi-PT Affiliate Gadget data...')

  const passwordHash = await bcrypt.hash('admin123', 10)
  const customerPassword = await bcrypt.hash('customer123', 10)
  const salesPassword = await bcrypt.hash('sales123', 10)

  // 1. Create Super Admin (Owner)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'owner@affiliategadget.com' },
    update: {
      name: 'Mubdi Pandaki (Owner)',
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: 'owner@affiliategadget.com',
      name: 'Mubdi Pandaki (Owner)',
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
      phone: '081234567890',
      address: 'Kantor Pusat Affiliate Gadget, Jakarta Pusat',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
    },
  })

  console.log('✅ Super Admin created:', superAdmin.email)

  // 2. Create Multi-PT Stores
  const storesData = [
    {
      name: 'Affiliate Gadget Roxy Mas (Pusat)',
      slug: 'affiliate-gadget-roxy-mas',
      companyName: 'PT Gadget Jaya Sentosa',
      taxId: '01.234.567.8-011.000',
      tagline: 'Pusat Smartphone Resmi & Garansi Toko Terpercaya',
      description: 'Cabang flagship utama Affiliate Gadget di ITC Roxy Mas Lt. 2 No. 45-48. Menyediakan gadget garansi resmi & 30 hari ganti unit baru.',
      logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80',
      address: 'ITC Roxy Mas Lantai 2 No. 45-48, Jl. KH Hasyim Ashari',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10150',
      latitude: -6.1627,
      longitude: 106.8043,
      phone: '021-63859012',
      whatsapp: '081198765431',
      email: 'roxy@affiliategadget.com',
      isOwnerStore: true,
      commissionRate: 1.0,
      rating: 4.9,
      totalReview: 342,
      totalSales: 1250,
      banks: [
        { bankName: 'BCA', accountNumber: '5420998811', accountName: 'PT GADGET JAYA SENTOSA', isPrimary: true },
        { bankName: 'Mandiri', accountNumber: '1220009876543', accountName: 'PT GADGET JAYA SENTOSA', isPrimary: false },
      ],
    },
    {
      name: 'Affiliate Gadget Surabaya WTC',
      slug: 'affiliate-gadget-surabaya-wtc',
      companyName: 'PT Sinar Gadget Nusantara',
      taxId: '02.345.678.9-601.000',
      tagline: 'Spesialis Flagship Gadget & Servis LCD Cepat Jawa Timur',
      description: 'Cabang resmi Jawa Timur berlokasi di WTC Surabaya Lt. 3 Galeri Ponsel. Melayani jual beli gadget terlengkap dan servis kilat.',
      logo: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=1200&q=80',
      address: 'WTC E-Mall Lantai 3 Ruang 310, Jl. Pemuda No. 27-31',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60271',
      latitude: -7.2654,
      longitude: 112.7482,
      phone: '031-5319870',
      whatsapp: '081234889900',
      email: 'surabaya@sinargadget.co.id',
      isOwnerStore: false,
      commissionRate: 2.0,
      rating: 4.8,
      totalReview: 215,
      totalSales: 870,
      banks: [
        { bankName: 'BCA', accountNumber: '8870123490', accountName: 'PT SINAR GADGET NUSANTARA', isPrimary: true },
        { bankName: 'BRI', accountNumber: '009801002345501', accountName: 'PT SINAR GADGET NUSANTARA', isPrimary: false },
      ],
    },
    {
      name: 'Affiliate Gadget BEC Bandung',
      slug: 'affiliate-gadget-bec-bandung',
      companyName: 'PT Digital Niaga Prima',
      taxId: '03.456.789.0-421.000',
      tagline: 'Toko Gadget Milenial Terbesar di Kota Kembang',
      description: 'Berlokasi strategis di Bandung Electronic Center (BEC) Gedung Baru Lt. 1. Stok selalu update iPhone dan Android premium.',
      logo: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
      address: 'Bandung Electronic Center Lt. 1 Blok B-12, Jl. Purnawarman No. 13-15',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40117',
      latitude: -6.9077,
      longitude: 107.6098,
      phone: '022-4209911',
      whatsapp: '081399887722',
      email: 'bandung@digitalniaga.com',
      isOwnerStore: false,
      commissionRate: 2.5,
      rating: 4.9,
      totalReview: 180,
      totalSales: 640,
      banks: [
        { bankName: 'BCA', accountNumber: '2330987112', accountName: 'PT DIGITAL NIAGA PRIMA', isPrimary: true },
      ],
    },
  ]

  const createdStores: any[] = []

  for (const s of storesData) {
    const { banks, ...storeFields } = s
    const store = await prisma.store.upsert({
      where: { slug: s.slug },
      update: storeFields,
      create: storeFields,
    })

    // Upsert Bank Accounts
    await prisma.storeBankAccount.deleteMany({ where: { storeId: store.id } })
    for (const b of banks) {
      await prisma.storeBankAccount.create({
        data: {
          storeId: store.id,
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          accountName: b.accountName,
          isPrimary: b.isPrimary,
        },
      })
    }

    // Upsert Schedules
    await prisma.storeSchedule.deleteMany({ where: { storeId: store.id } })
    const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    for (const day of days) {
      await prisma.storeSchedule.create({
        data: {
          storeId: store.id,
          day: day,
          openTime: '10:00',
          closeTime: day === 'SUNDAY' ? '20:00' : '21:00',
          isClosed: false,
        },
      })
    }

    createdStores.push(store)
    console.log(`✅ Store & PT created: ${store.name} (${store.companyName})`)
  }

  // 3. Create Store Admin & Finance Users (1 Admin Tunggal per Toko)
  const staffUsers = [
    {
      email: 'admin.roxy@affiliategadget.com',
      name: 'Bambang S. (Admin Roxy Mas)',
      role: UserRole.STORE_ADMIN,
      storeId: createdStores[0].id,
      phone: '081198765431',
    },
    {
      email: 'finance.roxy@affiliategadget.com',
      name: 'Siti Aminah (Finance PT Gadget Jaya)',
      role: UserRole.FINANCE_ADMIN,
      storeId: createdStores[0].id,
      phone: '081198765432',
    },
    {
      email: 'admin.surabaya@affiliategadget.com',
      name: 'Kevin Santoso (Admin WTC Surabaya)',
      role: UserRole.STORE_ADMIN,
      storeId: createdStores[1].id,
      phone: '081234889900',
    },
    {
      email: 'customer@test.com',
      name: 'Budi Santoso (Customer)',
      role: UserRole.CUSTOMER,
      phone: '081288990011',
    },
  ]

  for (const u of staffUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        storeId: u.storeId || null,
        phone: u.phone,
      },
      create: {
        email: u.email,
        name: u.name,
        password: u.role === UserRole.CUSTOMER ? customerPassword : salesPassword,
        role: u.role,
        storeId: u.storeId || null,
        phone: u.phone,
        address: 'Jl. Merdeka No. 12',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
      },
    })
  }

  // 4. Create Gadgets & Product Inventory
  const gadgets = [
    {
      storeId: createdStores[0].id,
      name: 'iPhone 15 Pro 128GB / 256GB Garansi Resmi iBox / Toko 30 Hari',
      description: 'Kondisi 100% Baru Segel Resmi. Ditenagai Chip A17 Pro Titanium Bionic, Layar Super Retina XDR ProMotion 120Hz. Pembelian melalui web langsung mendapatkan Garansi 30 Hari Ganti Unit + Paket Bonus 3-in-1 (Charger 20W + Tempered Glass 9D + Case MagSafe).',
      category: 'Smartphone',
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      condition: 'BARU',
      price: 18999000,
      originalPrice: 20999000,
      stock: 15,
      weightGram: 600,
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
      ],
      specs: {
        processor: 'Apple A17 Pro (3nm)',
        screen: '6.1 inch OLED Super Retina XDR ProMotion 120Hz',
        ram: '8 GB',
        storage: '128 GB / 256 GB',
        camera: '48MP Utama + 12MP Ultra-wide + 12MP Telephoto 3x',
        battery: '3274 mAh Fast Charging 20W',
      },
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 10,
      variants: [
        { name: '128GB - Natural Titanium', ram: '8GB', storage: '128GB', color: 'Natural Titanium', price: 18999000, stock: 8 },
        { name: '256GB - Blue Titanium', ram: '8GB', storage: '256GB', color: 'Blue Titanium', price: 21499000, stock: 7 },
      ],
    },
    {
      storeId: createdStores[0].id,
      name: 'Samsung Galaxy S24 Ultra 5G 12GB/256GB AI Titanium',
      description: 'Flagship terbaik Samsung dengan Galaxy AI terintegrasi. Kamera 200MP Zoom 100x Space Zoom, Layar Dynamic AMOLED 2X 2600 nits, S-Pen bawaan. Garansi 30 Hari Web + Free Adapter Super Fast Charging 45W & Screen Shield.',
      category: 'Smartphone',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      condition: 'BARU',
      price: 19499000,
      originalPrice: 21999000,
      stock: 12,
      weightGram: 650,
      images: [
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
      ],
      specs: {
        processor: 'Snapdragon 8 Gen 3 for Galaxy',
        screen: '6.8 inch Dynamic LTPO AMOLED 2X 120Hz QHD+',
        ram: '12 GB',
        storage: '256 GB / 512 GB',
        camera: '200MP + 50MP Periscope + 10MP Telephoto + 12MP Ultra-wide',
        battery: '5000 mAh Fast Charging 45W',
      },
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: true,
      promotionPriority: 9,
      variants: [
        { name: '256GB - Titanium Gray', ram: '12GB', storage: '256GB', color: 'Titanium Gray', price: 19499000, stock: 6 },
        { name: '512GB - Titanium Black', ram: '12GB', storage: '512GB', color: 'Titanium Black', price: 21999000, stock: 6 },
      ],
    },
    {
      storeId: createdStores[1].id,
      name: 'Xiaomi 14 Ultra Leica Summilux Lens 16GB/512GB',
      description: 'Masterpiece Fotografi Ponsel berkolaborasi resmi dengan Leica. Sensor 1-inch Sony LYT-900 Variable Aperture. Bonus lengkap Leather Case, Charger 90W HyperCharge, dan Screen Guard.',
      category: 'Smartphone',
      brand: 'Xiaomi',
      model: 'Xiaomi 14 Ultra',
      condition: 'BARU',
      price: 16999000,
      originalPrice: 17999000,
      stock: 8,
      weightGram: 620,
      images: [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
      ],
      specs: {
        processor: 'Snapdragon 8 Gen 3',
        screen: '6.73 inch LTPO AMOLED 120Hz Dolby Vision',
        ram: '16 GB',
        storage: '512 GB',
        camera: 'Quad 50MP Leica Optical System',
        battery: '5000 mAh 90W Wired + 80W Wireless',
      },
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: true,
      isPromoted: false,
      variants: [
        { name: '512GB - White Leather', ram: '16GB', storage: '512GB', color: 'White Leather', price: 16999000, stock: 4 },
        { name: '512GB - Black Leather', ram: '16GB', storage: '512GB', color: 'Black Leather', price: 16999000, stock: 4 },
      ],
    },
    {
      storeId: createdStores[2].id,
      name: 'iPad Pro 11 M4 Ultra Thin OLED 256GB WiFi',
      description: 'iPad tertipis dan terkencang di dunia dengan Apple M4 chip & Layar Tandem OLED Ultra Retina XDR. Garansi Toko 30 Hari Ganti Baru.',
      category: 'Tablet',
      brand: 'Apple',
      model: 'iPad Pro 11 M4',
      condition: 'BARU',
      price: 17499000,
      originalPrice: 18999000,
      stock: 10,
      weightGram: 750,
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
      ],
      specs: {
        processor: 'Apple M4 (9-Core CPU / 10-Core GPU)',
        screen: '11 inch Tandem OLED Ultra Retina XDR 120Hz',
        ram: '8 GB',
        storage: '256 GB',
        camera: '12MP Wide + LiDAR Scanner',
        battery: 'Up to 10 hours web/video',
      },
      warrantyDays: 30,
      includesCharger: true,
      includesScreenProtector: true,
      includesCase: false,
      isPromoted: true,
      promotionPriority: 8,
      variants: [
        { name: '256GB - Space Black', ram: '8GB', storage: '256GB', color: 'Space Black', price: 17499000, stock: 5 },
        { name: '256GB - Silver', ram: '8GB', storage: '256GB', color: 'Silver', price: 17499000, stock: 5 },
      ],
    },
  ]

  for (const g of gadgets) {
    const { variants, ...gadgetField } = g
    const product = await prisma.product.create({
      data: gadgetField,
    })

    if (variants && variants.length > 0) {
      for (const v of variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            ...v,
          },
        })
      }
    }
    console.log(`✅ Product created: ${product.name}`)
  }

  // 5. Create Live Stream Sessions
  const liveStream = await prisma.liveStream.create({
    data: {
      storeId: createdStores[0].id,
      title: '🔴 LIVE SALE SPESIAL: Flash Sale iPhone 15 Pro & S24 Ultra Diskon s.d 2 Juta + Bonus Lengkap!',
      description: 'Siaran langsung unboxing & uji kamera iPhone 15 Pro Titanium vs Samsung S24 Ultra. Dapatkan voucher eksklusif live stream!',
      coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Sample embed URL
      status: LiveStreamStatus.LIVE,
      startedAt: new Date(),
      viewerCount: 1420,
      comments: {
        create: [
          { userName: 'Andi Pratama', message: 'Apakah bonus chargernya original fast charging min?', isPinned: false },
          { userName: 'Dewi Kartika', message: 'Klaim garansi 30 hari caranya gimana min kalau di luar kota?', isPinned: false },
          { userName: 'Affiliate Gadget Admin', message: '📌 Garansi 30 hari langsung ganti unit baru, ongkir asuransi full dicover!', isPinned: true },
        ],
      },
    },
  })
  console.log('✅ Live Stream Session created:', liveStream.title)

  // 6. Create Internal Ads
  const internalAdsData = [
    {
      storeId: createdStores[0].id,
      title: 'Pesta Gadget Multi-Toko: Beli Langsung Garansi 30 Hari + Bebas Biaya Layanan Shopee',
      subtitle: 'Dapatkan Paket Bonus Charger 20W + Case + Antigores Senilai Rp 450.000 Gratis Setiap Pembelian!',
      bannerUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80',
      targetUrl: '/gadget',
      placement: AdPlacement.HOMEPAGE_HERO,
      isUnlimitedOwnerAd: true,
      priority: 10,
    },
    {
      storeId: createdStores[1].id,
      title: 'Spesialis Servis LCD Kilat 2 Jam - Garansi 30 Hari',
      subtitle: 'Ganti Layar iPhone & Samsung Original OLED bergaransi resmi, siap kirim Gojek Instant',
      bannerUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1200&q=80',
      targetUrl: '/servis-lcd',
      placement: AdPlacement.PROMOTED_LIST,
      isUnlimitedOwnerAd: false,
      priority: 8,
    },
  ]

  for (const ad of internalAdsData) {
    await prisma.internalAd.create({
      data: ad,
    })
  }
  console.log('✅ Internal Ads created')

  // 7. Create LCD Service Estimates
  const lcdEstimatesData = [
    { brand: 'Apple', modelName: 'iPhone 15 Pro Max', qualityType: 'Original OLED Super Retina XDR', estimatedPrice: 3850000, durationHours: 2, warrantyDays: 30 },
    { brand: 'Apple', modelName: 'iPhone 14 Pro', qualityType: 'Original OLED ProMotion', estimatedPrice: 2950000, durationHours: 2, warrantyDays: 30 },
    { brand: 'Apple', modelName: 'iPhone 13', qualityType: 'Premium OLED High Copy', estimatedPrice: 1450000, durationHours: 1, warrantyDays: 30 },
    { brand: 'Apple', modelName: 'iPhone 11', qualityType: 'Incell OEM AAA+', estimatedPrice: 650000, durationHours: 1, warrantyDays: 30 },
    { brand: 'Samsung', modelName: 'Galaxy S24 Ultra', qualityType: 'Original Dynamic AMOLED 2X Service Center', estimatedPrice: 3750000, durationHours: 3, warrantyDays: 30 },
    { brand: 'Samsung', modelName: 'Galaxy S23', qualityType: 'Original OLED HDR10+', estimatedPrice: 2200000, durationHours: 2, warrantyDays: 30 },
    { brand: 'Xiaomi', modelName: 'Xiaomi 13T / 14', qualityType: 'Original AMOLED 144Hz CrystalRes', estimatedPrice: 1250000, durationHours: 2, warrantyDays: 30 },
    { brand: 'Oppo', modelName: 'Reno 11 Pro 5G', qualityType: 'Original Curved OLED 120Hz', estimatedPrice: 1650000, durationHours: 2, warrantyDays: 30 },
  ]

  for (const lcd of lcdEstimatesData) {
    await prisma.lcdEstimate.create({
      data: lcd,
    })
  }
  console.log('✅ LCD Service Estimates created')

  console.log('🎉 Seeding Multi-PT completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
