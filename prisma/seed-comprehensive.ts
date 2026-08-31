import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive seed...')

  // =====================
  // 1. USERS & ADMIN
  // =====================
  console.log('\n📌 Creating users...')

  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@affiliategadget.com' },
    update: {},
    create: {
      email: 'admin@affiliategadget.com',
      name: 'Admin Affiliate Gadget',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      phone: '081234567890',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    },
  })
  console.log('✅ Created admin:', admin.email)

  const customerPassword = await bcrypt.hash('customer123', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      name: 'Budi Santoso',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '081234567891',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    },
  })
  console.log('✅ Created customer:', customer.email)

  // =====================
  // 2. TECHNICIANS
  // =====================
  console.log('\n📌 Creating technicians...')

  const techniciansData = [
    {
      email: 'ahmad.teknisi@affiliategadget.com',
      name: 'Ahmad Fauzi',
      phone: '081234567801',
      image:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
      bio: 'Teknisi berpengalaman 8 tahun spesialis iPhone dan Samsung. Bersertifikasi Apple dan Samsung. Pernah bekerja di authorized service center.',
      experience: 8,
      specialties: ['iPhone', 'Samsung', 'iPad', 'LCD', 'Baterai'],
      rating: 4.9,
      totalReview: 156,
      services: [
        {
          name: 'Ganti LCD iPhone',
          category: 'SERVIS_LENGKAP',
          price: 500000,
          description: 'Penggantian LCD iPhone original/OEM',
        },
        {
          name: 'Ganti Baterai iPhone',
          category: 'SERVIS_LENGKAP',
          price: 250000,
          description: 'Penggantian baterai iPhone kapasitas tinggi',
        },
        {
          name: 'Repair Motherboard',
          category: 'SERVIS_LENGKAP',
          price: 750000,
          description: 'Perbaikan motherboard iPhone/Samsung',
        },
      ],
    },
    {
      email: 'dewi.teknisi@affiliategadget.com',
      name: 'Dewi Lestari',
      phone: '081234567802',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      bio: 'Spesialis software dan data recovery. 6 tahun pengalaman menangani berbagai masalah software Android dan iOS.',
      experience: 6,
      specialties: ['Software', 'Data Recovery', 'Android', 'Flashing', 'Root'],
      rating: 4.7,
      totalReview: 89,
      services: [
        {
          name: 'Install Ulang Android',
          category: 'SERVIS_LENGKAP',
          price: 100000,
          description: 'Flashing ROM dan install ulang sistem Android',
        },
        {
          name: 'Recovery Data',
          category: 'SERVIS_LENGKAP',
          price: 300000,
          description: 'Pemulihan data dari HP mati atau rusak',
        },
        {
          name: 'Bypass FRP/iCloud',
          category: 'SERVIS_LENGKAP',
          price: 200000,
          description: 'Bypass akun Google atau iCloud',
        },
      ],
    },
    {
      email: 'rudi.teknisi@affiliategadget.com',
      name: 'Rudi Hartono',
      phone: '081234567803',
      image:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      bio: 'Ahli perbaikan laptop dan komputer. 10 tahun pengalaman di bidang hardware dan jaringan.',
      experience: 10,
      specialties: ['Laptop', 'Komputer', 'Jaringan', 'Hardware', 'Upgrade'],
      rating: 4.8,
      totalReview: 234,
      services: [
        {
          name: 'Servis Laptop',
          category: 'SERVIS_LENGKAP',
          price: 150000,
          description: 'Diagnosa dan perbaikan laptop',
        },
        {
          name: 'Upgrade RAM/SSD',
          category: 'SERVIS_LENGKAP',
          price: 100000,
          description: 'Pemasangan RAM atau SSD baru',
        },
        {
          name: 'Install Windows',
          category: 'SERVIS_LENGKAP',
          price: 150000,
          description: 'Instalasi Windows dengan driver lengkap',
        },
      ],
    },
    {
      email: 'siti.teknisi@affiliategadget.com',
      name: 'Siti Nurhaliza',
      phone: '081234567804',
      image:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
      bio: 'Teknisi muda berbakat dengan keahlian di bidang micro soldering dan component level repair.',
      experience: 4,
      specialties: [
        'Micro Soldering',
        'IC Repair',
        'Charging Port',
        'Audio IC',
      ],
      rating: 4.6,
      totalReview: 67,
      services: [
        {
          name: 'Ganti IC Charging',
          category: 'SERVIS_LENGKAP',
          price: 350000,
          description: 'Penggantian IC charging HP',
        },
        {
          name: 'Repair Audio IC',
          category: 'SERVIS_LENGKAP',
          price: 400000,
          description: 'Perbaikan IC audio HP tidak bersuara',
        },
        {
          name: 'Ganti Konektor Charging',
          category: 'SERVIS_LENGKAP',
          price: 150000,
          description: 'Penggantian port charging HP',
        },
      ],
    },
    {
      email: 'andi.teknisi@affiliategadget.com',
      name: 'Andi Wijaya',
      phone: '081234567805',
      image:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
      bio: 'Spesialis tablet dan smartwatch. Berpengalaman menangani iPad, Galaxy Tab, dan Apple Watch.',
      experience: 5,
      specialties: [
        'iPad',
        'Galaxy Tab',
        'Apple Watch',
        'Tablet',
        'Smartwatch',
      ],
      rating: 4.5,
      totalReview: 45,
      services: [
        {
          name: 'Servis iPad',
          category: 'SERVIS_LENGKAP',
          price: 400000,
          description: 'Perbaikan iPad segala tipe',
        },
        {
          name: 'Ganti LCD Tablet',
          category: 'SERVIS_LENGKAP',
          price: 600000,
          description: 'Penggantian LCD tablet',
        },
        {
          name: 'Servis Apple Watch',
          category: 'SERVIS_LENGKAP',
          price: 500000,
          description: 'Perbaikan Apple Watch',
        },
      ],
    },
    {
      email: 'budi.teknisi@affiliategadget.com',
      name: 'Budi Prasetyo',
      phone: '081234567806',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      bio: 'Expert dalam perbaikan kamera HP dan DSLR. 7 tahun pengalaman di bidang optik dan sensor.',
      experience: 7,
      specialties: ['Kamera HP', 'DSLR', 'Sensor', 'Lensa', 'Optical'],
      rating: 4.7,
      totalReview: 112,
      services: [
        {
          name: 'Servis Kamera HP',
          category: 'SERVIS_LENGKAP',
          price: 300000,
          description: 'Perbaikan kamera belakang/depan HP',
        },
        {
          name: 'Cleaning Sensor DSLR',
          category: 'SERVIS_LENGKAP',
          price: 250000,
          description: 'Pembersihan sensor kamera DSLR',
        },
        {
          name: 'Kalibrasi Lensa',
          category: 'SERVIS_LENGKAP',
          price: 400000,
          description: 'Kalibrasi dan perbaikan lensa kamera',
        },
      ],
    },
    {
      email: 'citra.teknisi@affiliategadget.com',
      name: 'Citra Dewi',
      phone: '081234567807',
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      bio: 'Spesialis gaming console dan controller. Menangani PS5, Xbox, Nintendo Switch dengan garansi.',
      experience: 6,
      specialties: ['PS5', 'Xbox', 'Nintendo Switch', 'Controller', 'Gaming'],
      rating: 4.8,
      totalReview: 98,
      services: [
        {
          name: 'Servis PS5',
          category: 'SERVIS_LENGKAP',
          price: 500000,
          description: 'Perbaikan PlayStation 5 segala masalah',
        },
        {
          name: 'Repair Controller',
          category: 'SERVIS_LENGKAP',
          price: 200000,
          description: 'Perbaikan controller PS/Xbox/Switch',
        },
        {
          name: 'Upgrade SSD Console',
          category: 'SERVIS_LENGKAP',
          price: 150000,
          description: 'Upgrade storage console gaming',
        },
      ],
    },
    {
      email: 'doni.teknisi@affiliategadget.com',
      name: 'Doni Saputra',
      phone: '081234567808',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      bio: 'Ahli water damage dan liquid damage repair. Spesialis menyelamatkan HP yang kena air.',
      experience: 9,
      specialties: [
        'Water Damage',
        'Liquid Damage',
        'Corrosion',
        'Ultrasonic',
        'Recovery',
      ],
      rating: 4.9,
      totalReview: 187,
      services: [
        {
          name: 'Water Damage Repair',
          category: 'SERVIS_LENGKAP',
          price: 350000,
          description: 'Perbaikan HP kena air/liquid',
        },
        {
          name: 'Ultrasonic Cleaning',
          category: 'SERVIS_LENGKAP',
          price: 200000,
          description: 'Pembersihan korosi dengan ultrasonic',
        },
        {
          name: 'Data Recovery Basah',
          category: 'SERVIS_LENGKAP',
          price: 500000,
          description: 'Recovery data dari HP yang kena air',
        },
      ],
    },
    {
      email: 'eka.teknisi@affiliategadget.com',
      name: 'Eka Putra',
      phone: '081234567809',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      bio: 'Spesialis printer dan scanner. Menangani semua brand printer dari inkjet hingga laser.',
      experience: 8,
      specialties: ['Printer', 'Scanner', 'Inkjet', 'Laser', 'Maintenance'],
      rating: 4.6,
      totalReview: 134,
      services: [
        {
          name: 'Servis Printer',
          category: 'SERVIS_LENGKAP',
          price: 150000,
          description: 'Perbaikan printer inkjet/laser',
        },
        {
          name: 'Head Cleaning',
          category: 'SERVIS_LENGKAP',
          price: 100000,
          description: 'Pembersihan head printer',
        },
        {
          name: 'Refill Toner/Tinta',
          category: 'SERVIS_LENGKAP',
          price: 75000,
          description: 'Refill toner atau tinta printer',
        },
      ],
    },
  ]

  for (const tech of techniciansData) {
    const techPassword = await bcrypt.hash('tech123', 12)
    const techUser = await prisma.user.upsert({
      where: { email: tech.email },
      update: {},
      create: {
        email: tech.email,
        name: tech.name,
        password: techPassword,
        role: 'CUSTOMER',
        phone: tech.phone,
        image: tech.image,
      },
    })

    const technician = await prisma.technician.upsert({
      where: { userId: techUser.id },
      update: {},
      create: {
        userId: techUser.id,
        bio: tech.bio,
        experience: tech.experience,
        specialties: tech.specialties,
        rating: tech.rating,
        totalReview: tech.totalReview,
        isAvailable: true,
      },
    })

    // Create services
    for (const service of tech.services) {
      await prisma.service.upsert({
        where: {
          id: `${technician.id}-${service.name.replace(/\s/g, '-').toLowerCase()}`,
        },
        update: {},
        create: {
          id: `${technician.id}-${service.name.replace(/\s/g, '-').toLowerCase()}`,
          technicianId: technician.id,
          name: service.name,
          category: service.category as
            | 'KONSULTASI'
            | 'CEK_BONGKAR'
            | 'SERVIS_LENGKAP',
          price: service.price,
          description: service.description,
        },
      })
    }

    console.log(`✅ Created technician: ${tech.name}`)
  }

  // =====================
  // 3. PRODUCTS (SPAREPARTS)
  // =====================
  console.log('\n📌 Creating spareparts/products...')

  const productsData = [
    // LCD
    {
      name: 'LCD iPhone 12 Pro Max Original',
      description:
        'LCD iPhone 12 Pro Max original dengan kualitas terbaik. Termasuk touchscreen dan frame. Garansi 3 bulan.',
      category: 'LCD',
      brand: 'Apple',
      model: 'iPhone 12 Pro Max',
      price: 2500000,
      stock: 15,
      images: [
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
      ],
    },
    {
      name: 'LCD Samsung Galaxy S21 Ultra AMOLED',
      description:
        'LCD Samsung S21 Ultra Dynamic AMOLED 2X original. Resolusi 3200x1440. Mendukung 120Hz.',
      category: 'LCD',
      brand: 'Samsung',
      model: 'Galaxy S21 Ultra',
      price: 3200000,
      stock: 8,
      images: [
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
      ],
    },
    {
      name: 'LCD iPhone 11 OEM Quality',
      description:
        'LCD iPhone 11 kualitas OEM dengan harga terjangkau. Cocok untuk pemakaian sehari-hari.',
      category: 'LCD',
      brand: 'Apple',
      model: 'iPhone 11',
      price: 850000,
      stock: 25,
      images: [
        'https://images.unsplash.com/photo-1574755393849-623942496936?w=800&q=80',
      ],
    },
    // Battery
    {
      name: 'Baterai iPhone 13 Original',
      description:
        'Baterai iPhone 13 original Apple dengan kapasitas 3227mAh. Garansi 6 bulan.',
      category: 'Battery',
      brand: 'Apple',
      model: 'iPhone 13',
      price: 450000,
      stock: 30,
      images: [
        'https://images.unsplash.com/photo-1609692814858-f7cd2f0afa4f?w=800&q=80',
      ],
    },
    {
      name: 'Baterai Samsung Galaxy A52 Original',
      description:
        'Baterai Samsung A52 5000mAh original. Mendukung fast charging 25W.',
      category: 'Battery',
      brand: 'Samsung',
      model: 'Galaxy A52',
      price: 280000,
      stock: 40,
      images: [
        'https://images.unsplash.com/photo-1609692814858-f7cd2f0afa4f?w=800&q=80',
      ],
    },
    // Casing
    {
      name: 'Casing iPhone 14 Pro MagSafe Clear',
      description:
        'Casing transparan iPhone 14 Pro dengan MagSafe. Anti kuning, anti shock.',
      category: 'Casing',
      brand: 'Apple',
      model: 'iPhone 14 Pro',
      price: 150000,
      stock: 50,
      images: [
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
      ],
    },
    // Charger
    {
      name: 'Charger iPhone 20W USB-C Original',
      description:
        'Charger Apple 20W USB-C Power Adapter original. Fast charging untuk iPhone 8 ke atas.',
      category: 'Charger',
      brand: 'Apple',
      model: 'Universal',
      price: 350000,
      stock: 35,
      images: [
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
      ],
    },
    {
      name: 'Charger Samsung 45W Super Fast',
      description:
        'Charger Samsung 45W Super Fast Charging. Cocok untuk Galaxy S22/S23 series.',
      category: 'Charger',
      brand: 'Samsung',
      model: 'Universal',
      price: 450000,
      stock: 20,
      images: [
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
      ],
    },
    // Kabel
    {
      name: 'Kabel Lightning to USB-C 1m Original',
      description:
        'Kabel data Apple Lightning to USB-C 1 meter original. Mendukung fast charging.',
      category: 'Kabel',
      brand: 'Apple',
      model: 'Universal',
      price: 180000,
      stock: 60,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      ],
    },
    // Screen Protector
    {
      name: 'Tempered Glass iPhone 15 Pro Max',
      description:
        'Tempered glass 9H anti gores iPhone 15 Pro Max. Full cover dengan privacy mode.',
      category: 'Aksesoris',
      brand: 'Generic',
      model: 'iPhone 15 Pro Max',
      price: 75000,
      stock: 100,
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      ],
    },
  ]

  for (const product of productsData) {
    await prisma.product.upsert({
      where: {
        id: `product-${product.name.replace(/\s/g, '-').toLowerCase().slice(0, 20)}`,
      },
      update: {},
      create: {
        id: `product-${product.name.replace(/\s/g, '-').toLowerCase().slice(0, 20)}`,
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
        model: product.model,
        price: product.price,
        stock: product.stock,
        images: product.images,
        isActive: true,
      },
    })
    console.log(`✅ Created product: ${product.name.slice(0, 30)}...`)
  }

  // =====================
  // 4. RENTAL ITEMS (ALAT SEWA)
  // =====================
  console.log('\n📌 Creating rental items...')

  const rentalItemsData = [
    {
      name: 'Heat Gun Digital 858D',
      description:
        'Heat gun digital dengan suhu adjustable 100-450°C. Dilengkapi berbagai nozzle untuk keperluan rework dan desolder IC.',
      pricePerDay: 50000,
      stock: 5,
      images: [
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
      ],
      weeklyDiscountPct: 15,
      monthlyDiscountPct: 30,
      depositAmount: 500000,
      terms: [
        'Wajib KTP sebagai jaminan',
        'Pengembalian dalam kondisi bersih',
        'Kerusakan ditanggung penyewa',
      ],
    },
    {
      name: 'Mikroskop Digital USB 1000x',
      description:
        'Mikroskop digital USB dengan pembesaran hingga 1000x. Cocok untuk inspeksi komponen, soldering, dan quality control.',
      pricePerDay: 75000,
      stock: 3,
      images: [
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80',
      ],
      weeklyDiscountPct: 10,
      monthlyDiscountPct: 25,
      depositAmount: 750000,
      terms: [
        'Wajib KTP sebagai jaminan',
        'Termasuk stand dan kabel USB',
        'Kerusakan ditanggung penyewa',
      ],
    },
    {
      name: 'Oscilloscope Digital 100MHz',
      description:
        'Oscilloscope digital 2 channel 100MHz untuk diagnosa sinyal dan troubleshooting circuit.',
      pricePerDay: 150000,
      stock: 2,
      images: [
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
      ],
      weeklyDiscountPct: 20,
      monthlyDiscountPct: 35,
      depositAmount: 2000000,
      terms: [
        'Wajib KTP dan NPWP',
        'Termasuk probe dan accessories',
        'Asuransi wajib untuk sewa > 7 hari',
      ],
    },
    {
      name: 'Solder Station Hakko FX-888D',
      description:
        'Solder station profesional Hakko FX-888D dengan temperature adjustable. Ideal untuk micro soldering.',
      pricePerDay: 35000,
      stock: 8,
      images: [
        'https://images.unsplash.com/photo-1563880168380-5a89ef3c24c7?w=800&q=80',
      ],
      weeklyDiscountPct: 10,
      monthlyDiscountPct: 20,
      depositAmount: 300000,
      terms: [
        'Wajib KTP sebagai jaminan',
        'Termasuk tip solder standar',
        'Tip solder tambahan dijual terpisah',
      ],
    },
    {
      name: 'Power Supply DC Adjustable 30V 10A',
      description:
        'Power supply DC adjustable 0-30V 0-10A untuk testing dan charging komponen elektronik.',
      pricePerDay: 40000,
      stock: 6,
      images: [
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
      ],
      weeklyDiscountPct: 15,
      monthlyDiscountPct: 25,
      depositAmount: 400000,
      terms: [
        'Wajib KTP sebagai jaminan',
        'Termasuk kabel output',
        'Max load sesuai spesifikasi',
      ],
    },
    {
      name: 'BGA Rework Station',
      description:
        'BGA rework station lengkap untuk reballing dan replace IC BGA. Suhu hingga 450°C dengan preheater.',
      pricePerDay: 200000,
      stock: 2,
      images: [
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
      ],
      weeklyDiscountPct: 20,
      monthlyDiscountPct: 40,
      depositAmount: 3000000,
      terms: [
        'Wajib KTP, NPWP, dan jaminan tambahan',
        'Training singkat gratis',
        'Kerusakan akibat kelalaian ditanggung penyewa',
      ],
    },
    {
      name: 'Ultrasonic Cleaner 3L',
      description:
        'Ultrasonic cleaner 3 liter untuk membersihkan PCB, komponen, dan alat-alat kecil.',
      pricePerDay: 45000,
      stock: 4,
      images: [
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
      ],
      weeklyDiscountPct: 10,
      monthlyDiscountPct: 20,
      depositAmount: 350000,
      terms: [
        'Wajib KTP sebagai jaminan',
        'Cairan pembersih tidak termasuk',
        'Pengembalian dalam kondisi kering',
      ],
    },
    {
      name: 'Multimeter Digital Fluke 87V',
      description:
        'Multimeter digital profesional Fluke 87V True RMS. Akurasi tinggi untuk pengukuran presisi.',
      pricePerDay: 60000,
      stock: 5,
      images: [
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80',
      ],
      weeklyDiscountPct: 15,
      monthlyDiscountPct: 30,
      depositAmount: 600000,
      terms: [
        'Wajib KTP sebagai jaminan',
        'Termasuk probe dan baterai',
        'Kalibrasi terakhir 2024',
      ],
    },
  ]

  for (const item of rentalItemsData) {
    await prisma.rentalItem.upsert({
      where: {
        id: `rental-${item.name.replace(/\s/g, '-').toLowerCase().slice(0, 20)}`,
      },
      update: {},
      create: {
        id: `rental-${item.name.replace(/\s/g, '-').toLowerCase().slice(0, 20)}`,
        name: item.name,
        description: item.description,
        pricePerDay: item.pricePerDay,
        stock: item.stock,
        images: item.images,
        weeklyDiscountPct: item.weeklyDiscountPct,
        monthlyDiscountPct: item.monthlyDiscountPct,
        depositAmount: item.depositAmount,
        terms: item.terms,
        isActive: true,
      },
    })
    console.log(`✅ Created rental item: ${item.name.slice(0, 30)}...`)
  }

  // =====================
  // 5. MITRA (REKOMENDASI TEMPAT SERVIS)
  // =====================
  console.log('\n📌 Creating mitra (service places)...')

  const mitrasData = [
    {
      email: 'irepair.jakarta@email.com',
      name: 'Owner iRepair Jakarta',
      businessName: 'iRepair Jakarta',
      tagline: 'Spesialis iPhone & Mac Terpercaya',
      description:
        'iRepair Jakarta adalah pusat servis premium untuk produk Apple. Kami memiliki teknisi bersertifikasi Apple dengan pengalaman lebih dari 10 tahun. Menggunakan sparepart original/OEM berkualitas tinggi.',
      banner:
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80',
      address: 'Jl. Sudirman No. 123, Jakarta Pusat',
      city: 'Jakarta',
      phone: '081234560001',
      mitraEmail: 'info@irepairjakarta.com',
      website: 'www.irepairjakarta.com',
      latitude: -6.2008,
      longitude: 106.8456,
      rating: 4.9,
      totalReview: 324,
      features: [
        'Garansi 6 Bulan',
        'Sparepart Original',
        'Teknisi Bersertifikasi',
        'Free Konsultasi',
        'Antar Jemput',
      ],
      weekdayHours: 'Senin - Jumat: 09:00 - 21:00',
      weekendHours: 'Sabtu - Minggu: 10:00 - 18:00',
      services: [
        {
          name: 'Ganti LCD iPhone',
          price: 'Rp 500.000 - 3.000.000',
          icon: '📱',
        },
        {
          name: 'Ganti Baterai iPhone',
          price: 'Rp 250.000 - 500.000',
          icon: '🔋',
        },
        { name: 'Servis MacBook', price: 'Rp 300.000 - 2.000.000', icon: '💻' },
      ],
      images: [
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
      ],
    },
    {
      email: 'technofix.bandung@email.com',
      name: 'Owner TechnoFix',
      businessName: 'TechnoFix Bandung',
      tagline: 'Servis Handphone All Brand 24 Jam',
      description:
        'TechnoFix adalah bengkel servis handphone terlengkap di Bandung. Melayani semua brand dengan harga bersaing. Buka 24 jam untuk kebutuhan darurat.',
      banner:
        'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80',
      address: 'Jl. Asia Afrika No. 45, Bandung',
      city: 'Bandung',
      phone: '081234560002',
      mitraEmail: 'hello@technofixbdg.com',
      website: 'www.technofixbdg.com',
      latitude: -6.9175,
      longitude: 107.6191,
      rating: 4.7,
      totalReview: 567,
      features: [
        'Buka 24 Jam',
        'All Brand',
        'Express Service',
        'Garansi Servis',
        'Harga Bersaing',
      ],
      weekdayHours: 'Senin - Minggu: 24 Jam',
      weekendHours: 'Termasuk Hari Libur',
      services: [
        { name: 'Servis Android', price: 'Rp 100.000 - 500.000', icon: '🤖' },
        {
          name: 'Ganti LCD Samsung',
          price: 'Rp 400.000 - 2.500.000',
          icon: '📱',
        },
        { name: 'Recovery Data', price: 'Rp 200.000 - 1.000.000', icon: '💾' },
      ],
      images: [
        'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80',
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
      ],
    },
    {
      email: 'gadgetcare.surabaya@email.com',
      name: 'Owner GadgetCare',
      businessName: 'GadgetCare Surabaya',
      tagline: 'Your Trusted Gadget Partner',
      description:
        'GadgetCare Surabaya menyediakan layanan servis gadget profesional dengan standar kualitas internasional. Didukung oleh tim engineer berpengalaman dan peralatan modern.',
      banner:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80',
      address: 'Jl. Pemuda No. 67, Surabaya',
      city: 'Surabaya',
      phone: '081234560003',
      mitraEmail: 'care@gadgetcare.id',
      website: 'www.gadgetcare.id',
      latitude: -7.2575,
      longitude: 112.7521,
      rating: 4.8,
      totalReview: 412,
      features: [
        'ISO Certified',
        'Modern Equipment',
        'Data Security',
        'Express 1 Jam',
        'Home Service',
      ],
      weekdayHours: 'Senin - Sabtu: 08:00 - 20:00',
      weekendHours: 'Minggu: 10:00 - 16:00',
      services: [
        { name: 'Servis Laptop', price: 'Rp 150.000 - 1.500.000', icon: '💻' },
        { name: 'Upgrade SSD/RAM', price: 'Rp 100.000 + Parts', icon: '⚡' },
        { name: 'Cleaning Service', price: 'Rp 75.000 - 150.000', icon: '🧹' },
      ],
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80',
      ],
    },
    {
      email: 'phonemaster.yogya@email.com',
      name: 'Owner Phone Master',
      businessName: 'Phone Master Yogyakarta',
      tagline: 'Master in Phone Repair',
      description:
        'Phone Master Yogyakarta melayani perbaikan smartphone dengan konsep student-friendly. Harga mahasiswa dengan kualitas premium. Lokasi strategis dekat kampus.',
      banner:
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=1200&q=80',
      address: 'Jl. Gejayan No. 12, Yogyakarta',
      city: 'Yogyakarta',
      phone: '081234560004',
      mitraEmail: 'master@phonemaster.co.id',
      website: 'www.phonemaster.co.id',
      latitude: -7.7956,
      longitude: 110.3695,
      rating: 4.6,
      totalReview: 289,
      features: [
        'Student Discount',
        'Lokasi Kampus',
        'Fast Service',
        'Second Hand Parts',
        'Trade-in',
      ],
      weekdayHours: 'Senin - Sabtu: 09:00 - 21:00',
      weekendHours: 'Minggu: 12:00 - 18:00',
      services: [
        { name: 'Ganti LCD Budget', price: 'Rp 200.000 - 800.000', icon: '📱' },
        { name: 'Ganti Baterai', price: 'Rp 100.000 - 300.000', icon: '🔋' },
        { name: 'Software Fix', price: 'Rp 50.000 - 150.000', icon: '🔧' },
      ],
      images: [
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80',
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
      ],
    },
    {
      email: 'smartfix.medan@email.com',
      name: 'Owner SmartFix',
      businessName: 'SmartFix Medan',
      tagline: 'Smart Solution for Your Device',
      description:
        'SmartFix Medan adalah solusi cerdas untuk semua masalah gadget Anda. Dengan teknisi berpengalaman dan harga transparan, kami siap membantu.',
      banner:
        'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200&q=80',
      address: 'Jl. Gatot Subroto No. 88, Medan',
      city: 'Medan',
      phone: '081234560005',
      mitraEmail: 'fix@smartfixmedan.com',
      website: 'www.smartfixmedan.com',
      latitude: 3.5952,
      longitude: 98.6722,
      rating: 4.5,
      totalReview: 178,
      features: [
        'Harga Transparan',
        'Konsultasi Gratis',
        'Part Warranty',
        'COD Available',
        'Online Booking',
      ],
      weekdayHours: 'Senin - Jumat: 09:00 - 18:00',
      weekendHours: 'Sabtu: 09:00 - 15:00, Minggu: Tutup',
      services: [
        { name: 'Diagnosa Gratis', price: 'FREE', icon: '🔍' },
        { name: 'Servis Xiaomi', price: 'Rp 100.000 - 600.000', icon: '📱' },
        { name: 'Servis Oppo/Vivo', price: 'Rp 100.000 - 500.000', icon: '📱' },
      ],
      images: [
        'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&q=80',
        'https://images.unsplash.com/photo-1573164713619-24c711fe7878?w=800&q=80',
      ],
    },
  ]

  for (const mitra of mitrasData) {
    const mitraPassword = await bcrypt.hash('mitra123', 12)
    const mitraUser = await prisma.user.upsert({
      where: { email: mitra.email },
      update: {},
      create: {
        email: mitra.email,
        name: mitra.name,
        password: mitraPassword,
        role: 'MITRA',
        phone: mitra.phone,
        mitraStatus: 'APPROVED',
      },
    })

    const createdMitra = await prisma.mitra.upsert({
      where: { userId: mitraUser.id },
      update: {},
      create: {
        userId: mitraUser.id,
        businessName: mitra.businessName,
        tagline: mitra.tagline,
        description: mitra.description,
        banner: mitra.banner,
        address: mitra.address,
        city: mitra.city,
        province:
          mitra.city === 'Jakarta'
            ? 'DKI Jakarta'
            : mitra.city === 'Bandung'
              ? 'Jawa Barat'
              : mitra.city === 'Surabaya'
                ? 'Jawa Timur'
                : mitra.city === 'Yogyakarta'
                  ? 'DI Yogyakarta'
                  : 'Sumatera Utara',
        phone: mitra.phone,
        email: mitra.mitraEmail,
        website: mitra.website,
        latitude: mitra.latitude,
        longitude: mitra.longitude,
        rating: mitra.rating,
        totalReview: mitra.totalReview,
        features: mitra.features,
        weekdayHours: mitra.weekdayHours,
        weekendHours: mitra.weekendHours,
        isApproved: true,
      },
    })

    // Create services
    for (const service of mitra.services) {
      await prisma.mitraService.upsert({
        where: {
          id: `${createdMitra.id}-${service.name.replace(/\s/g, '-').toLowerCase()}`,
        },
        update: {},
        create: {
          id: `${createdMitra.id}-${service.name.replace(/\s/g, '-').toLowerCase()}`,
          mitraId: createdMitra.id,
          name: service.name,
          price: service.price,
          icon: service.icon,
        },
      })
    }

    // Create images
    for (let i = 0; i < mitra.images.length; i++) {
      await prisma.mitraImage.upsert({
        where: {
          id: `${createdMitra.id}-image-${i}`,
        },
        update: {},
        create: {
          id: `${createdMitra.id}-image-${i}`,
          mitraId: createdMitra.id,
          url: mitra.images[i],
        },
      })
    }

    console.log(`✅ Created mitra: ${mitra.businessName}`)
  }

  console.log('\n🎉 Comprehensive seed completed!')
  console.log('\n📊 Summary:')
  console.log(`   - Users: ${2 + techniciansData.length + mitrasData.length}`)
  console.log(`   - Technicians: ${techniciansData.length}`)
  console.log(`   - Products: ${productsData.length}`)
  console.log(`   - Rental Items: ${rentalItemsData.length}`)
  console.log(`   - Mitra: ${mitrasData.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
