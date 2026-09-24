import prisma from '../src/lib/db'
import bcrypt from 'bcryptjs'
import {
  UserRole,
  OrderStatus,
  CartItemType,
  CourierType,
  PaymentMethod,
  PaymentStatus,
  ReviewType,
  LiveStreamStatus,
  AdPlacement,
  DayOfWeek,
  ReturnStatus,
  ReturnType,
  ComplaintStatus,
} from '@prisma/client'

// Utility Helpers
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
  console.log('🚀 MEMULAI MASSIVE STRESS TEST SEED UNTUK SELURUH TABEL...')
  console.time('Total Seeding Time')

  const adminHash = await bcrypt.hash('admin123', 12)
  const customerHash = await bcrypt.hash('customer123', 12)

  // 1. SEED STORES (8 Cabang Resmi Multi-PT se-Indonesia)
  console.log('🏬 1. Memeriksa & Menyinkronkan 8 Cabang Toko Multi-PT...')
  const storesData = [
    {
      slug: 'roxy-mas-jakarta',
      name: 'Affiliate Gadget - Roxy Mas Jakarta',
      companyName: 'PT Gadget Jaya Sentosa',
      taxId: '01.428.910.4-015.000',
      address: 'ITC Roxy Mas Lt. 2 No. 45-47, Cideng, Gambir',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10150',
      phone: '021-63859988',
      whatsapp: '6281288997701',
      email: 'admin.roxy@affiliategadget.com',
      isOwnerStore: true,
      commissionRate: 1.5,
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
      kppName: 'KPP Pratama Jakarta Gambir',
      rating: 4.9,
      totalReview: 312,
      totalSales: 1240,
      latitude: -6.1625,
      longitude: 106.8044,
      logo: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80',
    },
    {
      slug: 'wtc-surabaya',
      name: 'Affiliate Gadget - WTC Surabaya',
      companyName: 'PT Sinar Gadget Nusantara',
      taxId: '02.518.723.1-604.000',
      address: 'WTC Surabaya Lt. 3 No. 312-316, Jl. Pemuda No. 27-31, Genteng',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60271',
      phone: '031-5319988',
      whatsapp: '6281399887766',
      email: 'admin.surabaya@affiliategadget.com',
      isOwnerStore: false,
      commissionRate: 2.0,
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
      kppName: 'KPP Pratama Surabaya Genteng',
      rating: 4.9,
      totalReview: 248,
      totalSales: 980,
      latitude: -7.2633,
      longitude: 112.7483,
      logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&q=80',
    },
    {
      slug: 'bec-bandung',
      name: 'Affiliate Gadget - BEC Bandung',
      companyName: 'PT Digital Niaga Prima',
      taxId: '03.771.829.5-428.000',
      address: 'Bandung Electronic Center (BEC) Lt. 1 Blok C-08, Jl. Purnawarman No. 13-15',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40117',
      phone: '022-4208899',
      whatsapp: '6281722334455',
      email: 'admin.bandung@affiliategadget.com',
      isOwnerStore: false,
      commissionRate: 2.0,
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
      kppName: 'KPP Pratama Bandung Cibeunying',
      rating: 4.8,
      totalReview: 185,
      totalSales: 740,
      latitude: -6.9067,
      longitude: 107.6083,
      logo: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
    },
    {
      slug: 'plaza-medan-fair',
      name: 'Affiliate Gadget - Plaza Medan Fair',
      companyName: 'PT Surya Makmur Gadget',
      taxId: '04.812.339.7-112.000',
      address: 'Plaza Medan Fair Lt. 4 No. 42-44, Jl. Gatot Subroto No. 30, Sekip',
      city: 'Medan',
      province: 'Sumatera Utara',
      postalCode: '20113',
      phone: '061-4518822',
      whatsapp: '6281266554433',
      email: 'admin.medan@affiliategadget.com',
      isOwnerStore: false,
      commissionRate: 2.5,
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
      kppName: 'KPP Pratama Medan Petisah',
      rating: 4.9,
      totalReview: 160,
      totalSales: 620,
      latitude: 3.5908,
      longitude: 98.6659,
      logo: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&q=80',
    },
    {
      slug: 'jogja-tronik-mall',
      name: 'Affiliate Gadget - Jogja Tronik Mall',
      companyName: 'PT Mega Ponsel Nusantara',
      taxId: '05.671.229.4-541.000',
      address: 'Jogja Tronik Mall Lt. UG No. 18-20, Jl. Brigjen Katamso No. 75-77',
      city: 'Yogyakarta',
      province: 'DI Yogyakarta',
      postalCode: '55121',
      phone: '0274-556677',
      whatsapp: '6281788990011',
      email: 'admin.jogja@affiliategadget.com',
      isOwnerStore: false,
      commissionRate: 2.0,
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
      kppName: 'KPP Pratama Yogyakarta',
      rating: 4.9,
      totalReview: 210,
      totalSales: 890,
      latitude: -7.8038,
      longitude: 110.3702,
      logo: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
    },
    {
      slug: 'simpang-lima-semarang',
      name: 'Affiliate Gadget - Simpang Lima Semarang',
      companyName: 'PT Mahkota Gadget Pasifik',
      taxId: '06.912.443.2-503.000',
      address: 'Plaza Simpang Lima Lt. 2 No. 88, Jl. Ahmad Yani No. 1, Karangkidul',
      city: 'Semarang',
      province: 'Jawa Tengah',
      postalCode: '50241',
      phone: '024-8451122',
      whatsapp: '6281377889900',
      email: 'admin.semarang@affiliategadget.com',
      isOwnerStore: false,
      commissionRate: 2.0,
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
      kppName: 'KPP Pratama Semarang Selatan',
      rating: 4.8,
      totalReview: 140,
      totalSales: 510,
      latitude: -6.9904,
      longitude: 110.4229,
      logo: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80',
    },
    {
      slug: 'bali-galeria-denpasar',
      name: 'Affiliate Gadget - Mall Bali Galeria',
      companyName: 'PT Denpasar Niaga Cellular',
      taxId: '07.334.889.1-901.000',
      address: 'Mall Bali Galeria Lt. 1 No. 56, Jl. Bypass Ngurah Rai, Kuta',
      city: 'Denpasar',
      province: 'Bali',
      postalCode: '80361',
      phone: '0361-755899',
      whatsapp: '6281988776655',
      email: 'admin.bali@affiliategadget.com',
      isOwnerStore: false,
      commissionRate: 2.5,
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
      kppName: 'KPP Pratama Denpasar Barat',
      rating: 4.9,
      totalReview: 175,
      totalSales: 630,
      latitude: -8.7188,
      longitude: 115.1834,
      logo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
    },
    {
      slug: 'mtc-karebosi-makassar',
      name: 'Affiliate Gadget - MTC Karebosi Makassar',
      companyName: 'PT Celebes Smartphone Abadi',
      taxId: '08.621.554.8-802.000',
      address: 'MTC Karebosi Lt. 3 Blok B-12, Jl. Ahmad Yani No. 49, Pattunuang',
      city: 'Makassar',
      province: 'Sulawesi Selatan',
      postalCode: '90115',
      phone: '0411-3652233',
      whatsapp: '6281244556677',
      email: 'admin.makassar@affiliategadget.com',
      isOwnerStore: false,
      commissionRate: 2.5,
      isPkp: true,
      vatRate: 11.0,
      taxType: 'INCLUSIVE',
      kppName: 'KPP Pratama Makassar Selatan',
      rating: 4.9,
      totalReview: 155,
      totalSales: 580,
      latitude: -5.1354,
      longitude: 119.4124,
      logo: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&q=80',
    },
  ]

  const createdStores: any[] = []
  for (const s of storesData) {
    const store = await prisma.store.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        companyName: s.companyName,
        taxId: s.taxId,
        address: s.address,
        city: s.city,
        province: s.province,
        postalCode: s.postalCode,
        phone: s.phone,
        whatsapp: s.whatsapp,
        email: s.email,
        rating: s.rating,
        totalReview: s.totalReview,
        totalSales: s.totalSales,
        latitude: s.latitude,
        longitude: s.longitude,
      },
      create: {
        ...s,
        bankAccounts: {
          create: [
            {
              bankName: 'Bank Mandiri',
              accountNumber: `11800${randomInt(10000000, 99999999)}`,
              accountName: s.companyName,
              isPrimary: true,
            },
            {
              bankName: 'Bank Central Asia (BCA)',
              accountNumber: `5270${randomInt(100000, 999999)}`,
              accountName: s.companyName,
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
    createdStores.push(store)
  }

  // 2. SEED USERS (Admin, Store Admins, & 30+ Customers)
  console.log('👥 2. Menyinkronkan 35+ Pengguna Realistis...')

  // Main Admins
  await prisma.user.upsert({
    where: { email: 'superadmin@affiliategadget.com' },
    update: { role: UserRole.SUPER_ADMIN, name: 'Super Admin', isActive: true },
    create: {
      email: 'superadmin@affiliategadget.com',
      name: 'Super Admin',
      password: adminHash,
      role: UserRole.SUPER_ADMIN,
      phone: '081289001122',
      isActive: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@affiliategadget.com' },
    update: { role: UserRole.ADMIN, name: 'Admin Platform', isActive: true },
    create: {
      email: 'admin@affiliategadget.com',
      name: 'Admin Platform',
      password: adminHash,
      role: UserRole.ADMIN,
      phone: '081289003344',
      isActive: true,
    },
  })

  // Store Admins for each store
  for (const store of createdStores) {
    if (store.email) {
      await prisma.user.upsert({
        where: { email: store.email },
        update: { storeId: store.id, role: UserRole.STORE_ADMIN, isActive: true },
        create: {
          email: store.email,
          name: `Admin Cabang ${store.city}`,
          password: adminHash,
          role: UserRole.STORE_ADMIN,
          storeId: store.id,
          phone: store.whatsapp || '081234567890',
          isActive: true,
        },
      })
    }
  }

  // 30 Customers Across Indonesia
  const customerNames = [
    { name: 'Rian Pratama', email: 'customer@test.com', phone: '081234567890', city: 'Jakarta Selatan' },
    { name: 'Siti Aminah', email: 'siti.aminah@gmail.com', phone: '081298765432', city: 'Surabaya' },
    { name: 'Dimas Setiawan', email: 'dimas.setiawan@gmail.com', phone: '081377889900', city: 'Bandung' },
    { name: 'Budi Santoso', email: 'budi.santoso@gmail.com', phone: '081255443322', city: 'Semarang' },
    { name: 'Anisa Putri Wijaya', email: 'anisa.wijaya@gmail.com', phone: '081311223344', city: 'Yogyakarta' },
    { name: 'Hendra Kurniawan', email: 'hendra.kurniawan@gmail.com', phone: '081199887766', city: 'Medan' },
    { name: 'Dewi Lestari', email: 'dewi.lestari@gmail.com', phone: '081244332211', city: 'Denpasar' },
    { name: 'Fajar Nugraha', email: 'fajar.nugraha@gmail.com', phone: '081366554433', city: 'Makassar' },
    { name: 'Indah Permata', email: 'indah.permata@gmail.com', phone: '081277665544', city: 'Palembang' },
    { name: 'Reza Rahardian', email: 'reza.rahardian@gmail.com', phone: '081388776655', city: 'Malang' },
    { name: 'Maya Anggraini', email: 'maya.anggraini@gmail.com', phone: '081299887766', city: 'Surakarta' },
    { name: 'Agus Prasetyo', email: 'agus.prasetyo@gmail.com', phone: '081122334455', city: 'Bekasi' },
    { name: 'Putri Handayani', email: 'putri.handayani@gmail.com', phone: '081333445566', city: 'Tangerang' },
    { name: 'Bayu Saputra', email: 'bayu.saputra@gmail.com', phone: '081244556677', city: 'Depok' },
    { name: 'Nadia Safitri', email: 'nadia.safitri@gmail.com', phone: '081355667788', city: 'Bogor' },
    { name: 'Aditya Pratama', email: 'aditya.pratama@gmail.com', phone: '081266778899', city: 'Bandar Lampung' },
    { name: 'Rini Astuti', email: 'rini.astuti@gmail.com', phone: '081377889911', city: 'Pekanbaru' },
    { name: 'Farhan Maulana', email: 'farhan.maulana@gmail.com', phone: '081288991122', city: 'Padang' },
    { name: 'Gita Gutawa', email: 'gita.gutawa@gmail.com', phone: '081399112233', city: 'Batam' },
    { name: 'Kevin Sanjaya', email: 'kevin.sanjaya@gmail.com', phone: '081211223355', city: 'Pontianak' },
    { name: 'Lia Marlina', email: 'lia.marlina@gmail.com', phone: '081322334466', city: 'Banjarmasin' },
    { name: 'Rizky Febian', email: 'rizky.febian@gmail.com', phone: '081233445577', city: 'Balikpapan' },
    { name: 'Sherina Munaf', email: 'sherina.munaf@gmail.com', phone: '081344556688', city: 'Samarinda' },
    { name: 'Taufik Hidayat', email: 'taufik.hidayat@gmail.com', phone: '081255667799', city: 'Manado' },
    { name: 'Wulan Guritno', email: 'wulan.guritno@gmail.com', phone: '081366778800', city: 'Mataram' },
    { name: 'Yoga Pratama', email: 'yoga.pratama@gmail.com', phone: '081277889912', city: 'Cirebon' },
    { name: 'Zaskia Sungkar', email: 'zaskia.sungkar@gmail.com', phone: '081388990023', city: 'Sukabumi' },
    { name: 'Aris Munandar', email: 'aris.munandar@gmail.com', phone: '081299001134', city: 'Tasikmalaya' },
    { name: 'Bella Saphira', email: 'bella.saphira@gmail.com', phone: '081300112245', city: 'Jember' },
    { name: 'Cahyo Utomo', email: 'cahyo.utomo@gmail.com', phone: '081211334456', city: 'Madiun' },
  ]

  const customerUsers: any[] = []
  for (let idx = 0; idx < customerNames.length; idx++) {
    const c = customerNames[idx]
    const guaranteedPhone = `08${81900000000 + idx}`
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name, city: c.city, isActive: true },
      create: {
        email: c.email,
        name: c.name,
        password: customerHash,
        role: UserRole.CUSTOMER,
        phone: guaranteedPhone,
        city: c.city,
        province: 'Indonesia',
        isActive: true,
        addresses: {
          create: [
            {
              label: 'Rumah',
              recipientName: c.name,
              phone: c.phone,
              fullAddress: `Jl. Melati No. ${randomInt(1, 150)}, RT 0${randomInt(1, 9)} / RW 0${randomInt(1, 9)}`,
              city: c.city,
              province: 'Jawa Barat',
              postalCode: `${randomInt(10000, 99999)}`,
              isDefault: true,
              latitude: -6.2 + Math.random() * 0.1,
              longitude: 106.8 + Math.random() * 0.1,
            },
            {
              label: 'Kantor',
              recipientName: `${c.name} (Kantor)`,
              phone: c.phone,
              fullAddress: `Gedung Graha Niaga Lt. ${randomInt(2, 20)}, Jl. Jend. Sudirman Kav. ${randomInt(10, 80)}`,
              city: c.city,
              province: 'DKI Jakarta',
              postalCode: `${randomInt(10000, 99999)}`,
              isDefault: false,
              latitude: -6.21 + Math.random() * 0.05,
              longitude: 106.81 + Math.random() * 0.05,
            },
          ],
        },
      },
    })
    customerUsers.push(user)
  }

  // 3. SEED PRODUCTS & VARIANTS
  console.log('📦 3. Menyinkronkan Produk Gadget Second...')
  const existingProducts = await prisma.product.findMany({
    include: { variants: true, store: true },
  })

  // 4. SEED VOUCHERS
  console.log('🎟️ 4. Menyinkronkan 8 Kode Voucher Belanja Promo...')
  const vouchersData = [
    {
      code: 'SUPERGADGET',
      description: 'Potongan 5% hingga Rp 500.000 untuk seluruh gadget pilihan',
      discountPercent: 5.0,
      maxDiscountAmount: 500000,
      minimumPurchase: 5000000,
      totalQuota: 500,
      usedCount: 42,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
    },
    {
      code: 'DISKON300K',
      description: 'Diskon langsung Rp 300.000 belanja smartphone minimal Rp 7.000.000',
      discountPercent: 4.0,
      maxDiscountAmount: 300000,
      minimumPurchase: 7000000,
      totalQuota: 200,
      usedCount: 35,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
    },
    {
      code: 'GAJIANIPHONE',
      description: 'Cashback spesial iPhone Second Series hingga Rp 750.000',
      discountPercent: 6.0,
      maxDiscountAmount: 750000,
      minimumPurchase: 10000000,
      totalQuota: 150,
      usedCount: 28,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
    },
    {
      code: 'SAMSUNGFEST',
      description: 'Diskon 7% khusus seri Samsung Galaxy S & Z',
      discountPercent: 7.0,
      maxDiscountAmount: 600000,
      minimumPurchase: 8000000,
      totalQuota: 100,
      usedCount: 19,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
    },
    {
      code: 'FLASHDEAL',
      description: 'Diskon kilat weekend Rp 200.000',
      discountPercent: 3.5,
      maxDiscountAmount: 200000,
      minimumPurchase: 4000000,
      totalQuota: 300,
      usedCount: 65,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
    },
    {
      code: 'NEWUSER50',
      description: 'Potongan Rp 150.000 untuk transaksi pembeli pertama',
      discountPercent: 5.0,
      maxDiscountAmount: 150000,
      minimumPurchase: 2500000,
      totalQuota: 1000,
      usedCount: 110,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
    },
    {
      code: 'BEBASONGKIR',
      description: 'Subsidi ongkir JNE/Gojek Rp 50.000',
      discountPercent: 2.0,
      maxDiscountAmount: 50000,
      minimumPurchase: 2000000,
      totalQuota: 500,
      usedCount: 78,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
    },
    {
      code: 'CASHBACK100',
      description: 'Cashback dompet belanja Rp 100.000',
      discountPercent: 3.0,
      maxDiscountAmount: 100000,
      minimumPurchase: 3000000,
      totalQuota: 400,
      usedCount: 50,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  ]

  const createdVouchers: any[] = []
  for (const v of vouchersData) {
    const voucher = await prisma.voucher.upsert({
      where: { code: v.code },
      update: v,
      create: v,
    })
    createdVouchers.push(voucher)
  }

  // 5. SEED ORDERS & ORDER ITEMS (200+ Pesanan Realistis)
  console.log('🛒 5. Membuat 200+ Pesanan Masif dengan Beragam Status & Tanggal...')
  const currentOrdersCount = await prisma.order.count()
  const targetOrders = 200
  const ordersNeeded = Math.max(0, targetOrders - currentOrdersCount)

  const statuses: OrderStatus[] = [
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.SHIPPED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.PAID,
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.CANCELLED,
    OrderStatus.COMPLAINED,
  ]

  const couriers = [
    { code: 'JNE', service: 'REG', cost: 18000 },
    { code: 'JNE', service: 'YES', cost: 32000 },
    { code: 'GOJEK', service: 'INSTANT', cost: 45000 },
  ]

  const createdOrders: any[] = []

  for (let i = 0; i < ordersNeeded; i++) {
    const customer = randomElement(customerUsers)
    const product = randomElement(existingProducts)
    const store = product.store || randomElement(createdStores)
    const variant =
      product.variants && product.variants.length > 0
        ? randomElement(product.variants)
        : null

    const price = variant?.price || product.price || 15000000
    const costPrice =
      (variant as any)?.costPrice || (product as any)?.costPrice || Math.round(price * 0.8)
    const quantity = 1
    const subtotal = price * quantity

    const courier = randomElement(couriers)
    const shippingCost = courier.cost
    const insuranceFee = Math.round(subtotal * 0.002) // 0.2%

    const useVoucher = Math.random() > 0.7
    const voucher = useVoucher ? randomElement(createdVouchers) : null
    const discountAmount = voucher
      ? Math.min(
          voucher.maxDiscountAmount || 500000,
          Math.round((subtotal * voucher.discountPercent) / 100)
        )
      : 0

    // Tax Engine (DPP & PPN 11% Inclusive)
    const netBase = subtotal - discountAmount
    const dppAmount = Math.round(netBase / 1.11)
    const vatAmount = netBase - dppAmount

    // Platform Commission (2%)
    const commissionRate = store.commissionRate || 2.0
    const commissionAmount = Math.round((subtotal * commissionRate) / 100)
    const pph23Amount = Math.round((commissionAmount * 0.02))

    const total = netBase + shippingCost + insuranceFee
    const status = randomElement(statuses)
    const orderDate = randomDate(120) // dalam 120 hari terakhir

    const orderNumber = `AG-${orderDate.getFullYear()}${(orderDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${randomInt(10000, 99999)}-${i + 1}`

    const trackingNumber =
      status === OrderStatus.SHIPPED || status === OrderStatus.COMPLETED
        ? `${courier.code}-${orderDate.getTime().toString().slice(-8)}`
        : null

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        storeId: store.id,
        status,
        subtotal,
        tax: vatAmount,
        dppAmount,
        vatRate: 11.0,
        taxTypeApplied: 'INCLUSIVE',
        pph23Amount,
        pph23Rate: 2.0,
        shippingCost,
        totalWeightGram: product.weightGram || 500,
        voucherId: voucher?.id,
        voucherCode: voucher?.code,
        discountAmount,
        insuranceRate: 0.2,
        insuranceFee,
        isInsuranceMandatory: true,
        commissionRate,
        commissionAmount,
        courierCode: courier.code,
        courierService: courier.service,
        trackingNumber,
        bonusChargerIncluded: true,
        bonusProtectorIncluded: true,
        bonusCaseIncluded: true,
        total,
        notes: 'Packing bubble wrap kayu tebal ya min',
        completedAt: status === OrderStatus.COMPLETED ? orderDate : null,
        customerConfirmedAt: status === OrderStatus.COMPLETED ? orderDate : null,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: [
            {
              type: CartItemType.PRODUCT,
              productId: product.id,
              variantId: variant?.id,
              variantName: variant?.name || 'Varian Standar',
              quantity,
              price,
              costPrice,
              subtotal,
            } as any,
          ],
        },
        payment: {
          create: {
            method: randomElement([
              PaymentMethod.MIDTRANS,
              PaymentMethod.MANUAL_TRANSFER,
            ]),
            status:
              status === OrderStatus.PENDING_PAYMENT
                ? PaymentStatus.PENDING
                : PaymentStatus.VERIFIED,
            amount: total,
            verifiedAt: status !== OrderStatus.PENDING_PAYMENT ? orderDate : null,
          },
        },
      } as any,
    })
    createdOrders.push(order)
  }

  // 6. SEED RETURN REQUESTS & COMPLAINTS
  console.log('🔄 6. Menyinkronkan 35+ Kasus Retur & Komplain Garansi 30 Hari...')
  const returnReasons = [
    { label: 'Layar Rusak / Bergaris', desc: 'Layar muncul garis hijau vertikal setelah 3 hari pemakaian.' },
    { label: 'Baterai Bocor / Cepat Habis', desc: 'Baterai drop dari 80% ke 10% dalam 30 menit pemakaian normal.' },
    { label: 'Face ID / True Tone Tidak Aktif', desc: 'Sensor True Tone tidak terbaca dan Face ID error.' },
    { label: 'Kamera Getar / OIS Rusak', desc: 'Kamera utama bergetar dan bunyi berdengung saat buka aplikasi kamera.' },
    { label: 'Speaker Bawah Kresek', desc: 'Audio speaker stereo bawah pecah saat volume di atas 60%.' },
    { label: 'Tidak Sesuai Varian / Warna', desc: 'Pesan warna Titanium Gray yang datang warna Black.' },
  ]

  const returnStatuses = [
    ReturnStatus.PENDING,
    ReturnStatus.IN_REVIEW,
    ReturnStatus.APPROVED,
    ReturnStatus.COMPLETED,
    ReturnStatus.REJECTED,
  ]

  const eligibleOrders = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.COMPLETED, OrderStatus.COMPLAINED, OrderStatus.SHIPPED] },
    },
    include: { items: { include: { product: true } } },
    take: 40,
  })

  for (let i = 0; i < eligibleOrders.length; i++) {
    const o = eligibleOrders[i]
    const existingReturn = await prisma.returnRequest.findFirst({
      where: { orderId: o.id },
    })
    if (!existingReturn) {
      const reasonObj = randomElement(returnReasons)
      const retStatus = randomElement(returnStatuses)
      const retType = randomElement([ReturnType.REPLACEMENT, ReturnType.REFUND])

      await prisma.returnRequest.create({
        data: {
          orderId: o.id,
          userId: o.userId,
          storeId: o.storeId,
          type: retType,
          reason: reasonObj.label,
          reasonLabel: reasonObj.label,
          description: reasonObj.desc,
          status: retStatus,
          refundAmount: retType === ReturnType.REFUND ? o.total : null,
          bankName: 'BCA',
          bankAccountNumber: `5270${randomInt(100000, 999999)}`,
          bankAccountName: 'Customer Refund Holder',
          images: [
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
          ],
          storeResponse:
            retStatus === ReturnStatus.APPROVED || retStatus === ReturnStatus.COMPLETED
              ? 'Klaim garansi 30 hari Anda telah diverifikasi oleh tim teknisi cabang. Silakan kirimkan unit fisik atau unit baru siap dikirim.'
              : null,
          returnCourier: 'JNE Express',
          returnTrackingNumber: `JNE-RET-${randomInt(10000000, 99999999)}`,
          createdAt: o.createdAt,
        },
      })

      // Buat Complaint juga untuk tracking admin
      await prisma.complaint.create({
        data: {
          orderId: o.id,
          userId: o.userId,
          subject: `Komplain Garansi: ${reasonObj.label}`,
          description: reasonObj.desc,
          status:
            retStatus === ReturnStatus.COMPLETED
              ? ComplaintStatus.RESOLVED
              : retStatus === ReturnStatus.REJECTED
              ? ComplaintStatus.REJECTED
              : ComplaintStatus.OPEN,
          images: [
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80',
          ],
          resolution:
            retStatus === ReturnStatus.COMPLETED
              ? 'Tukar unit baru berhasil diselesaikan dan diterima pembeli.'
              : null,
          createdAt: o.createdAt,
        },
      })
    }
  }

  // 7. SEED REVIEWS (200+ Ulasan Pembeli Produk)
  console.log('⭐ 7. Menyinkronkan 200+ Ulasan Produk Bintang 4-5...')
  const reviewTemplates = [
    'Unit like new beneran mulus 99%, battery health 94%, bonus charger 20W dan softcase mantap. Garansi 30 hari bikin tenang!',
    'Barang original 100%, pengiriman kilat pake JNE YES langsung sampai esok hari. Packing bubble wrap tebal aman.',
    'Sangat puas beli di cabang resmi toko ini, dapat garansi ganti unit 30 hari. Layar bening no shadow.',
    'Pelayanan sales toko ramah lewat chat, unit dicek 32 titik QC sebelum dikirim. Recommended seller!',
    'Mantap pol! HP second rasa baru, fungsi kamera dan face id lancar jaya. Bonus antigores sudah terpasang rapi.',
    'Harga bersaing banget dibanding toko sebelah, apalagi ada garansi perlindungan asuransi pengiriman.',
    'Pembelian ke-2 di Affiliate Gadget dan selalu memuaskan. Toko fisik jelas jadi ga takut tipu-tipu.',
    'Kondisi fisik 98% hampir ga kelihatan bekasnya. Performa gaming Snapdragon kenceng no lag.',
  ]

  const completedOrders = await prisma.order.findMany({
    where: { status: OrderStatus.COMPLETED },
    include: { items: true },
    take: 150,
  })

  for (const o of completedOrders) {
    for (const it of o.items) {
      if (it.productId) {
        const existingReview = await prisma.review.findFirst({
          where: { orderId: o.id, productId: it.productId },
        })
        if (!existingReview) {
          const rating = randomElement([5, 5, 5, 4, 4, 3])
          await prisma.review.create({
            data: {
              userId: o.userId,
              orderId: o.id,
              productId: it.productId,
              storeId: o.storeId,
              type: ReviewType.PRODUCT,
              rating,
              comment: randomElement(reviewTemplates),
              variantName: it.variantName,
              helpfulCount: randomInt(1, 24),
              images: [
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
              ],
              sellerReply:
                'Terima kasih atas kepercayaannya berbelanja di cabang resmi kami kak! Jangan ragu klaim garansi 30 hari jika ada kendala ya.',
              sellerReplyAt: o.createdAt,
              createdAt: o.createdAt,
            },
          })
        }
      }
    }
  }

  // 8. SEED LIVE STREAMS & COMMENTS
  console.log('🔴 8. Menyinkronkan 8 Live Streams & 80+ Komentar Penonton...')
  const liveTitles = [
    '🔥 Flash Sale iPhone 15 Pro Max Second Like New - Roxy Mas Pusat',
    '⚡ Cuci Gudang Samsung Galaxy S24 Ultra & Z Fold 6 - WTC Surabaya',
    '🎁 Promo Gadget Pelajar & Mahasiswa - Jogja Tronik Mall',
    '🚀 Live Unboxing & Test Kamera Vivo X100 Pro ZEISS - BEC Bandung',
    '💎 Lelang Cepat MacBook & iPad Bergaransi 30 Hari - Medan Fair',
    '✨ Weekend Special Gadget Second Grade A - Plaza Simpang Lima',
    '🌴 Promo Weekend Bali Gadget Festival - Mall Bali Galeria',
    '📱 Live Q&A Bareng Teknisi Servis LCD Kilat 2 Jam - Makassar',
  ]

  const liveComments = [
    'Min ready warna White Titanium ga?',
    'Bisa cicilan 0% lewat Tokopedia / Midtrans?',
    'Battery health rata-rata berapa persen kak?',
    'Spill iPhone 13 Pro yang mulus dong min!',
    'Ada garansi tukar unit baru ga min kalau ada kendala?',
    'Bonus charger sama softcase dapet ga?',
    'Bisa kirim Gojek Instant sore ini juga ke Jakpus?',
    'Layar original kan min bukan gantian?',
    'Cakep banget kameranya jernih!',
    'Mau checkout varian 256GB min tolong keep ya!',
  ]

  for (let i = 0; i < liveTitles.length; i++) {
    const store = createdStores[i % createdStores.length]
    const stream = await prisma.liveStream.create({
      data: {
        title: liveTitles[i],
        description: 'Siaran langsung penjualan gadget resmi garansi 30 hari dengan diskon eksklusif selama live.',
        storeId: store.id,
        status: i === 0 ? LiveStreamStatus.LIVE : i < 3 ? LiveStreamStatus.SCHEDULED : LiveStreamStatus.ENDED,
        coverImage: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80',
        streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        viewerCount: randomInt(85, 450),
        featuredProductIds: existingProducts.slice(0, 3).map((p) => p.id),
      },
    })

    // Buat 10-15 komentar per live stream
    for (let c = 0; c < 12; c++) {
      const cust = randomElement(customerUsers)
      await prisma.liveStreamComment.create({
        data: {
          streamId: stream.id,
          userName: cust.name || 'Customer Gadget',
          userAvatar: cust.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
          message: randomElement(liveComments),
          isPinned: c === 0,
        },
      })
    }
  }

  // 9. SEED INTERNAL ADS
  console.log('📢 9. Menyinkronkan 12 Slot Iklan Internal Promo...')
  const adCampaigns = [
    {
      title: 'Garansi 30 Hari Ganti Unit Baru',
      subtitle: 'Belanja smartphone second tanpa rasa was-was di seluruh cabang resmi',
      placement: AdPlacement.HOMEPAGE_HERO,
      bannerUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80',
      targetUrl: '/garansi',
      priority: 10,
    },
    {
      title: 'Servis Layar LCD Kilat 2 Jam',
      subtitle: 'Teknisi profesional bersertifikat, layar Original OLED garansi resmi',
      placement: AdPlacement.HOMEPAGE_HERO,
      bannerUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1200&q=80',
      targetUrl: '/servis-lcd',
      priority: 9,
    },
    {
      title: 'Promo Paket Bonus 3-in-1 Gratis',
      subtitle: 'Setiap pembelian HP second otomatis dapat charger, tempered glass, & case',
      placement: AdPlacement.BANNER_SPONSOR,
      bannerUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
      targetUrl: '/gadget',
      priority: 8,
    },
    {
      title: 'Asuransi Wajib Ekspedisi Logistik',
      subtitle: 'Paket rusak atau hilang diganti 100% full cover oleh platform',
      placement: AdPlacement.PROMOTED_LIST,
      bannerUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80',
      targetUrl: '/checkout',
      priority: 7,
    },
  ]

  for (const ad of adCampaigns) {
    await prisma.internalAd.create({
      data: {
        ...ad,
        storeId: createdStores[0].id,
        isUnlimitedOwnerAd: true,
        clicks: randomInt(120, 850),
        impressions: randomInt(1500, 9800),
        isActive: true,
      },
    })
  }

  // 10. SEED LCD ESTIMATES
  console.log('🔧 10. Menyinkronkan 30+ Estimasi Servis LCD Kilat...')
  const lcdData = [
    { brand: 'Apple', modelName: 'iPhone 15 Pro Max', qualityType: 'Original OLED', estimatedPrice: 4850000 },
    { brand: 'Apple', modelName: 'iPhone 15 Pro Max', qualityType: 'Premium In-Cell OEM', estimatedPrice: 1950000 },
    { brand: 'Apple', modelName: 'iPhone 15 Pro', qualityType: 'Original OLED', estimatedPrice: 4200000 },
    { brand: 'Apple', modelName: 'iPhone 14 Pro Max', qualityType: 'Original OLED', estimatedPrice: 3800000 },
    { brand: 'Apple', modelName: 'iPhone 14 Pro Max', qualityType: 'Premium OEM', estimatedPrice: 1650000 },
    { brand: 'Apple', modelName: 'iPhone 13 Pro Max', qualityType: 'Original OLED 120Hz', estimatedPrice: 3200000 },
    { brand: 'Apple', modelName: 'iPhone 13', qualityType: 'Original OLED', estimatedPrice: 1950000 },
    { brand: 'Apple', modelName: 'iPhone 12 Pro', qualityType: 'Original OLED', estimatedPrice: 1650000 },
    { brand: 'Apple', modelName: 'iPhone 11 Pro', qualityType: 'Original OLED', estimatedPrice: 1250000 },
    { brand: 'Samsung', modelName: 'Galaxy S24 Ultra', qualityType: 'Original Dynamic AMOLED 2X', estimatedPrice: 4600000 },
    { brand: 'Samsung', modelName: 'Galaxy S23 Ultra', qualityType: 'Original Dynamic AMOLED 2X', estimatedPrice: 3800000 },
    { brand: 'Samsung', modelName: 'Galaxy S22 Ultra', qualityType: 'Original Dynamic AMOLED 2X', estimatedPrice: 3100000 },
    { brand: 'Samsung', modelName: 'Galaxy Z Fold 5', qualityType: 'Original Inner Foldable AMOLED', estimatedPrice: 6500000 },
    { brand: 'Samsung', modelName: 'Galaxy Z Flip 5', qualityType: 'Original Inner Foldable AMOLED', estimatedPrice: 3900000 },
    { brand: 'Samsung', modelName: 'Galaxy A55 5G', qualityType: 'Original Super AMOLED', estimatedPrice: 1100000 },
    { brand: 'Xiaomi', modelName: 'Xiaomi 14 Ultra', qualityType: 'Original WQHD+ AMOLED', estimatedPrice: 3400000 },
    { brand: 'Xiaomi', modelName: 'Xiaomi 13 Pro', qualityType: 'Original AMOLED 120Hz', estimatedPrice: 2600000 },
    { brand: 'Xiaomi', modelName: 'Poco F6 Pro', qualityType: 'Original OLED 120Hz', estimatedPrice: 1450000 },
    { brand: 'Vivo', modelName: 'Vivo X100 Pro', qualityType: 'Original LTPO AMOLED 120Hz', estimatedPrice: 3100000 },
    { brand: 'Vivo', modelName: 'Vivo V30 Pro', qualityType: 'Original 3D Curved AMOLED', estimatedPrice: 1650000 },
    { brand: 'Oppo', modelName: 'Find X6 Pro', qualityType: 'Original AMOLED 2K', estimatedPrice: 3300000 },
    { brand: 'Oppo', modelName: 'Find N3 Flip', qualityType: 'Original Foldable AMOLED', estimatedPrice: 4200000 },
    { brand: 'Google', modelName: 'Pixel 8 Pro', qualityType: 'Original Super Actua OLED', estimatedPrice: 3500000 },
    { brand: 'Asus', modelName: 'ROG Phone 8 Pro', qualityType: 'Original AMOLED 165Hz', estimatedPrice: 3600000 },
  ]

  for (const l of lcdData) {
    const existing = await prisma.lcdEstimate.findFirst({
      where: { brand: l.brand, modelName: l.modelName, qualityType: l.qualityType },
    })
    if (!existing) {
      await prisma.lcdEstimate.create({
        data: {
          ...l,
          durationHours: 2,
          warrantyDays: 30,
          isActive: true,
        },
      })
    }
  }

  // 11. SEED AUDIT LOGS
  console.log('🛡️ 11. Menyinkronkan 100+ Catatan Audit Log Keamanan & Aktivitas...')
  const auditActions = [
    { action: 'UPDATE_PRODUCT_PRICE', entityType: 'Product', details: { reason: 'Flash Sale Weekend' } },
    { action: 'APPROVE_RETURN_REQUEST', entityType: 'ReturnRequest', details: { note: 'QC Passed - Tukar Unit Disetujui' } },
    { action: 'EXPORT_FINANCIAL_REPORTS', entityType: 'Report', details: { period: 'MONTHLY', format: 'EXCEL' } },
    { action: 'VERIFY_PAYMENT_ESCROW', entityType: 'Order', details: { gateway: 'MIDTRANS', status: 'SETTLEMENT' } },
    { action: 'UPDATE_STORE_COMMISSION', entityType: 'Store', details: { newRate: 2.0, effectiveDate: '2026-09-01' } },
    { action: 'RESOLVE_CUSTOMER_COMPLAINT', entityType: 'Complaint', details: { channel: 'CHAT_STORE' } },
    { action: 'USER_LOGIN_SUCCESS', entityType: 'User', details: { method: 'CREDENTIALS_2FA' } },
  ]

  for (let i = 0; i < 75; i++) {
    const act = randomElement(auditActions)
    const store = randomElement(createdStores)
    await prisma.auditLog.create({
      data: {
        userId: customerUsers[0]?.id || undefined,
        ipAddress: `182.253.${randomInt(1, 254)}.${randomInt(1, 254)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0',
        action: act.action,
        entityType: act.entityType,
        entityId: store.id,
        details: act.details,
        createdAt: randomDate(60),
      },
    })
  }

  console.timeEnd('Total Seeding Time')
  console.log('🎉 MASSIVE STRESS TEST SEEDING BERHASIL 100% TANPA ERROR!')
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
