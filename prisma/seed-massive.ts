import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting MASSIVE seed with varied image sizes...\n')

  // Hash password
  const hashedPassword = await bcrypt.hash('test123', 10)

  // ========== PRODUCTS - 30+ items with varied aspect ratios ==========
  console.log('📦 Creating products (30+ items)...')

  const productsData = [
    // LCD Category - Portrait/Tall images
    {
      name: 'LCD iPhone 14 Pro Max OLED',
      category: 'LCD',
      brand: 'Apple',
      price: 4500000,
      stock: 15,
      description: 'LCD OLED original untuk iPhone 14 Pro Max',
      image:
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=600&fit=crop',
    },
    {
      name: 'LCD iPhone 13 Pro OLED',
      category: 'LCD',
      brand: 'Apple',
      price: 3200000,
      stock: 20,
      description: 'LCD OLED original untuk iPhone 13 Pro',
      image:
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&h=500&fit=crop',
    },
    {
      name: 'LCD iPhone 12 OEM',
      category: 'LCD',
      brand: 'Apple',
      price: 850000,
      stock: 50,
      description: 'LCD OEM quality untuk iPhone 12',
      image:
        'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=350&h=450&fit=crop',
    },
    {
      name: 'LCD Samsung S23 Ultra AMOLED',
      category: 'LCD',
      brand: 'Samsung',
      price: 5500000,
      stock: 8,
      description: 'LCD AMOLED asli Samsung S23 Ultra',
      image:
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=700&fit=crop',
    },
    {
      name: 'LCD Samsung S22+ AMOLED',
      category: 'LCD',
      brand: 'Samsung',
      price: 3800000,
      stock: 12,
      description: 'LCD AMOLED untuk Samsung S22+',
      image:
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=380&h=550&fit=crop',
    },
    {
      name: 'LCD Samsung A54 Original',
      category: 'LCD',
      brand: 'Samsung',
      price: 1200000,
      stock: 30,
      description: 'LCD original Samsung A54',
      image:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=320&h=480&fit=crop',
    },
    {
      name: 'LCD Xiaomi 13 Pro',
      category: 'LCD',
      brand: 'Xiaomi',
      price: 2800000,
      stock: 18,
      description: 'LCD untuk Xiaomi 13 Pro',
      image:
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=500&fit=crop',
    },
    {
      name: 'LCD Oppo Find X6 Pro',
      category: 'LCD',
      brand: 'Oppo',
      price: 3500000,
      stock: 10,
      description: 'LCD AMOLED Oppo Find X6 Pro',
      image:
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=360&h=520&fit=crop',
    },

    // Battery Category - Square images
    {
      name: 'Baterai iPhone 15 Pro Max Original',
      category: 'Baterai',
      brand: 'Apple',
      price: 650000,
      stock: 40,
      description: 'Baterai original kapasitas tinggi',
      image:
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop',
    },
    {
      name: 'Baterai iPhone 14 Pro Original',
      category: 'Baterai',
      brand: 'Apple',
      price: 550000,
      stock: 35,
      description: 'Baterai original iPhone 14 Pro',
      image:
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=350&h=350&fit=crop',
    },
    {
      name: 'Baterai iPhone 13 OEM',
      category: 'Baterai',
      brand: 'Apple',
      price: 350000,
      stock: 60,
      description: 'Baterai OEM kualitas tinggi',
      image:
        'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=380&h=380&fit=crop',
    },
    {
      name: 'Baterai Samsung S23 Original',
      category: 'Baterai',
      brand: 'Samsung',
      price: 480000,
      stock: 25,
      description: 'Baterai original Samsung',
      image:
        'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=400&h=400&fit=crop',
    },
    {
      name: 'Baterai Xiaomi 14 Original',
      category: 'Baterai',
      brand: 'Xiaomi',
      price: 320000,
      stock: 45,
      description: 'Baterai original Xiaomi',
      image:
        'https://images.unsplash.com/photo-1617997455403-41f333d44d5b?w=360&h=360&fit=crop',
    },
    {
      name: 'Baterai Oppo Reno 10 Pro',
      category: 'Baterai',
      brand: 'Oppo',
      price: 280000,
      stock: 55,
      description: 'Baterai original Oppo',
      image:
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=320&h=320&fit=crop',
    },

    // Charger Category - Landscape images
    {
      name: 'Charger iPhone 20W USB-C Original',
      category: 'Charger',
      brand: 'Apple',
      price: 450000,
      stock: 100,
      description: 'Charger fast charging original Apple',
      image:
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=400&fit=crop',
    },
    {
      name: 'Charger iPhone 35W Dual Port',
      category: 'Charger',
      brand: 'Apple',
      price: 750000,
      stock: 30,
      description: 'Charger dual port original',
      image:
        'https://images.unsplash.com/photo-1618577608401-46f4a957f1fe?w=500&h=350&fit=crop',
    },
    {
      name: 'Charger Samsung 45W Super Fast',
      category: 'Charger',
      brand: 'Samsung',
      price: 550000,
      stock: 40,
      description: 'Super fast charging Samsung',
      image:
        'https://images.unsplash.com/photo-1600490722773-35753aea6332?w=550&h=380&fit=crop',
    },
    {
      name: 'Charger Samsung 25W Original',
      category: 'Charger',
      brand: 'Samsung',
      price: 280000,
      stock: 80,
      description: 'Fast charging Samsung',
      image:
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=480&h=320&fit=crop',
    },
    {
      name: 'Charger Xiaomi 120W HyperCharge',
      category: 'Charger',
      brand: 'Xiaomi',
      price: 450000,
      stock: 25,
      description: 'Hypercharge 120W',
      image:
        'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=520&h=350&fit=crop',
    },

    // Aksesoris Category - Various aspect ratios
    {
      name: 'Case iPhone 15 Pro MagSafe Clear',
      category: 'Aksesoris',
      brand: 'Apple',
      price: 180000,
      stock: 200,
      description: 'Case clear dengan MagSafe',
      image:
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=500&fit=crop',
    },
    {
      name: 'Case iPhone 14 Silicone Color',
      category: 'Aksesoris',
      brand: 'Apple',
      price: 150000,
      stock: 150,
      description: 'Silicon case warna-warni',
      image:
        'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=350&h=400&fit=crop',
    },
    {
      name: 'Case Samsung S23 Ultra Premium',
      category: 'Aksesoris',
      brand: 'Samsung',
      price: 120000,
      stock: 180,
      description: 'Premium case Samsung',
      image:
        'https://images.unsplash.com/photo-1541877944-ac82a091518a?w=380&h=450&fit=crop',
    },
    {
      name: 'Tempered Glass iPhone 15 Pro Max',
      category: 'Aksesoris',
      brand: 'Generic',
      price: 85000,
      stock: 300,
      description: 'Tempered glass 9H',
      image:
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=400&fit=crop',
    },
    {
      name: 'Tempered Glass Samsung S24 Ultra',
      category: 'Aksesoris',
      brand: 'Generic',
      price: 95000,
      stock: 250,
      description: 'Curved tempered glass',
      image:
        'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=320&h=380&fit=crop',
    },
    {
      name: 'Kabel Lightning to USB-C 2m',
      category: 'Kabel',
      brand: 'Apple',
      price: 280000,
      stock: 120,
      description: 'Kabel original 2 meter',
      image:
        'https://images.unsplash.com/photo-1618577608401-46f4a957f1fe?w=600&h=350&fit=crop',
    },
    {
      name: 'Kabel USB-C to USB-C 100W',
      category: 'Kabel',
      brand: 'Generic',
      price: 150000,
      stock: 200,
      description: 'Kabel fast charging 100W',
      image:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop',
    },
    {
      name: 'AirPods Pro 2nd Gen Case',
      category: 'Aksesoris',
      brand: 'Apple',
      price: 95000,
      stock: 80,
      description: 'Case silikon AirPods Pro',
      image:
        'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=350&h=350&fit=crop',
    },
    {
      name: 'Samsung Buds2 Pro Case',
      category: 'Aksesoris',
      brand: 'Samsung',
      price: 75000,
      stock: 90,
      description: 'Case silikon Galaxy Buds',
      image:
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=380&h=380&fit=crop',
    },
    {
      name: 'Apple Watch Band 45mm',
      category: 'Aksesoris',
      brand: 'Apple',
      price: 350000,
      stock: 60,
      description: 'Sport band original',
      image:
        'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=300&h=450&fit=crop',
    },
    {
      name: 'Wireless Charger MagSafe',
      category: 'Charger',
      brand: 'Apple',
      price: 550000,
      stock: 45,
      description: 'MagSafe wireless charger',
      image:
        'https://images.unsplash.com/photo-1622921491193-345c2a32f39a?w=400&h=400&fit=crop',
    },
  ]

  for (const product of productsData) {
    await prisma.product.upsert({
      where: {
        id: `product-${product.name.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`,
      },
      update: {
        images: [product.image],
        description: product.description,
      },
      create: {
        id: `product-${product.name.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`,
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        description: product.description,
        images: [product.image],
        isActive: true,
      },
    })
    console.log(`  ✅ ${product.name}`)
  }

  // ========== RENTAL ITEMS - 20+ items with varied aspect ratios ==========
  console.log('\n🔧 Creating rental items (20+ items)...')

  const rentalData = [
    // Tall images
    {
      name: 'Heat Gun Digital 858D',
      price: 50000,
      deposit: 500000,
      stock: 8,
      description: 'Heat gun digital dengan temperatur adjustable',
      image:
        'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=350&h=500&fit=crop',
    },
    {
      name: 'Mikroskop Digital USB 1000x',
      price: 75000,
      deposit: 750000,
      stock: 5,
      description: 'Mikroskop USB untuk inspeksi PCB',
      image:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=450&fit=crop',
    },
    {
      name: 'Oscilloscope Digital 100MHz',
      price: 150000,
      deposit: 2000000,
      stock: 3,
      description: 'Oscilloscope 2 channel 100MHz',
      image:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=550&fit=crop',
    },
    {
      name: 'Solder Station Hakko FX-888D',
      price: 35000,
      deposit: 300000,
      stock: 10,
      description: 'Solder station profesional',
      image:
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=350&h=480&fit=crop',
    },

    // Square images
    {
      name: 'Power Supply DC Adjustable 30V 10A',
      price: 40000,
      deposit: 400000,
      stock: 6,
      description: 'Power supply adjustable',
      image:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop',
    },
    {
      name: 'BGA Rework Station IR6500',
      price: 200000,
      deposit: 3000000,
      stock: 2,
      description: 'BGA rework station infrared',
      image:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=380&h=380&fit=crop',
    },
    {
      name: 'Ultrasonic Cleaner 3L',
      price: 45000,
      deposit: 350000,
      stock: 7,
      description: 'Pembersih ultrasonik 3 liter',
      image:
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop',
    },
    {
      name: 'Multimeter Digital Fluke 87V',
      price: 60000,
      deposit: 600000,
      stock: 8,
      description: 'Multimeter profesional Fluke',
      image:
        'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=350&h=350&fit=crop',
    },

    // Landscape images
    {
      name: 'Hot Air Rework Station Quick 861DW',
      price: 80000,
      deposit: 800000,
      stock: 4,
      description: 'Hot air station dengan display',
      image:
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=550&h=380&fit=crop',
    },
    {
      name: 'Logic Analyzer 24MHz',
      price: 55000,
      deposit: 450000,
      stock: 5,
      description: 'Logic analyzer 8 channel',
      image:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
    },
    {
      name: 'Programmable Power Supply',
      price: 70000,
      deposit: 700000,
      stock: 3,
      description: 'Power supply programmable',
      image:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=350&fit=crop',
    },
    {
      name: 'PCB Holder Universal',
      price: 25000,
      deposit: 150000,
      stock: 15,
      description: 'Holder PCB adjustable',
      image:
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=480&h=320&fit=crop',
    },

    // Mixed aspect ratios
    {
      name: 'Smoke Absorber Soldering',
      price: 20000,
      deposit: 100000,
      stock: 12,
      description: 'Penyerap asap solder',
      image:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=300&h=400&fit=crop',
    },
    {
      name: 'ESD Mat with Ground',
      price: 15000,
      deposit: 80000,
      stock: 20,
      description: 'Anti-static mat',
      image:
        'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=550&h=350&fit=crop',
    },
    {
      name: 'Desoldering Station ZD-915',
      price: 45000,
      deposit: 400000,
      stock: 6,
      description: 'Desoldering pump station',
      image:
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&h=480&fit=crop',
    },
    {
      name: 'Component Tester T7',
      price: 30000,
      deposit: 200000,
      stock: 8,
      description: 'Tester komponen elektronik',
      image:
        'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=380&h=450&fit=crop',
    },
    {
      name: 'DC Load Electronic 150W',
      price: 50000,
      deposit: 500000,
      stock: 4,
      description: 'Electronic load tester',
      image:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=450&h=350&fit=crop',
    },
    {
      name: 'Signal Generator 20MHz',
      price: 65000,
      deposit: 650000,
      stock: 3,
      description: 'Function generator',
      image:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=400&fit=crop',
    },
    {
      name: 'LCR Meter Digital',
      price: 40000,
      deposit: 350000,
      stock: 5,
      description: 'LCR meter untuk komponen',
      image:
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=380&h=400&fit=crop',
    },
    {
      name: 'Thermal Camera FLIR',
      price: 250000,
      deposit: 5000000,
      stock: 2,
      description: 'Kamera thermal untuk diagnosa',
      image:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
    },
  ]

  for (const item of rentalData) {
    await prisma.rentalItem.upsert({
      where: {
        id: `rental-${item.name.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`,
      },
      update: {
        images: [item.image],
        description: item.description,
      },
      create: {
        id: `rental-${item.name.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`,
        name: item.name,
        pricePerDay: item.price,
        depositAmount: item.deposit,
        stock: item.stock,
        description: item.description,
        images: [item.image],
        terms: [
          'Wajib KTP',
          'Deposit dapat diambil kembali',
          'Kerusakan ditanggung penyewa',
        ],
        isActive: true,
      },
    })
    console.log(`  ✅ ${item.name}`)
  }

  // ========== TECHNICIANS - 15+ with varied images ==========
  console.log('\n👨‍🔧 Creating technicians (15+ items)...')

  const techData = [
    {
      name: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@affiliategadget.com',
      phone: '081234567801',
      experience: 8,
      rating: 4.9,
      reviews: 156,
      specialties: ['iPhone', 'Samsung', 'iPad', 'Motherboard'],
      bio: 'Spesialis iPhone dan Samsung dengan pengalaman 8 tahun',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    },
    {
      name: 'Dewi Lestari',
      email: 'dewi.lestari@affiliategadget.com',
      phone: '081234567802',
      experience: 6,
      rating: 4.7,
      reviews: 89,
      specialties: ['Software', 'Data Recovery', 'FRP Bypass'],
      bio: 'Ahli software dan data recovery',
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=350&h=350&fit=crop',
    },
    {
      name: 'Rudi Hartono',
      email: 'rudi.hartono@affiliategadget.com',
      phone: '081234567803',
      experience: 10,
      rating: 4.8,
      reviews: 234,
      specialties: ['Laptop', 'MacBook', 'Windows'],
      bio: 'Expert laptop dan MacBook 10 tahun pengalaman',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop',
    },
    {
      name: 'Siti Nurhaliza',
      email: 'siti.nur@affiliategadget.com',
      phone: '081234567804',
      experience: 4,
      rating: 4.6,
      reviews: 67,
      specialties: ['Micro Soldering', 'IC', 'Charging Port'],
      bio: 'Spesialis micro soldering dan IC',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=380&h=450&fit=crop',
    },
    {
      name: 'Budi Santoso',
      email: 'budi.santoso@affiliategadget.com',
      phone: '081234567805',
      experience: 7,
      rating: 4.5,
      reviews: 112,
      specialties: ['Xiaomi', 'Oppo', 'Vivo', 'Realme'],
      bio: 'Ahli HP Android China brand',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=350&h=400&fit=crop',
    },
    {
      name: 'Eko Prasetyo',
      email: 'eko.prasetyo@affiliategadget.com',
      phone: '081234567806',
      experience: 5,
      rating: 4.4,
      reviews: 78,
      specialties: ['LCD', 'Touch Screen', 'Kaca'],
      bio: 'Spesialis ganti LCD dan touchscreen',
      image:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=450&fit=crop',
    },
    {
      name: 'Fitri Handayani',
      email: 'fitri.h@affiliategadget.com',
      phone: '081234567807',
      experience: 3,
      rating: 4.3,
      reviews: 45,
      specialties: ['Baterai', 'Charging', 'Power'],
      bio: 'Ahli masalah charging dan baterai',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=380&h=480&fit=crop',
    },
    {
      name: 'Gunawan Wijaya',
      email: 'gunawan@affiliategadget.com',
      phone: '081234567808',
      experience: 9,
      rating: 4.8,
      reviews: 189,
      specialties: ['Water Damage', 'Korosi', 'Recovery'],
      bio: 'Expert water damage dan korosi',
      image:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    },
    {
      name: 'Hendra Kusuma',
      email: 'hendra.k@affiliategadget.com',
      phone: '081234567809',
      experience: 6,
      rating: 4.6,
      reviews: 98,
      specialties: ['Camera', 'Speaker', 'Mic'],
      bio: 'Spesialis kamera dan audio',
      image:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=320&h=400&fit=crop',
    },
    {
      name: 'Indra Permana',
      email: 'indra.p@affiliategadget.com',
      phone: '081234567810',
      experience: 4,
      rating: 4.5,
      reviews: 56,
      specialties: ['Gaming Phone', 'ROG', 'Black Shark'],
      bio: 'Ahli gaming phone',
      image:
        'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=350&h=450&fit=crop',
    },
    {
      name: 'Joko Widodo',
      email: 'joko.w@affiliategadget.com',
      phone: '081234567811',
      experience: 12,
      rating: 4.9,
      reviews: 312,
      specialties: ['All Brand', 'Motherboard', 'IC'],
      bio: 'Master teknisi 12 tahun pengalaman',
      image:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?w=380&h=380&fit=crop',
    },
    {
      name: 'Kartika Dewi',
      email: 'kartika@affiliategadget.com',
      phone: '081234567812',
      experience: 5,
      rating: 4.4,
      reviews: 72,
      specialties: ['Tablet', 'iPad', 'Galaxy Tab'],
      bio: 'Spesialis tablet dan iPad',
      image:
        'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=300&h=380&fit=crop',
    },
    {
      name: 'Lukman Hakim',
      email: 'lukman@affiliategadget.com',
      phone: '081234567813',
      experience: 7,
      rating: 4.7,
      reviews: 134,
      specialties: ['Smartwatch', 'Wearable', 'TWS'],
      bio: 'Ahli wearable dan smartwatch',
      image:
        'https://images.unsplash.com/photo-1582015752624-e8b1c75e3711?w=400&h=500&fit=crop',
    },
    {
      name: 'Maya Sari',
      email: 'maya.sari@affiliategadget.com',
      phone: '081234567814',
      experience: 3,
      rating: 4.2,
      reviews: 38,
      specialties: ['Cleaning', 'Maintenance', 'Tune Up'],
      bio: 'Spesialis cleaning dan maintenance',
      image:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=350&h=400&fit=crop',
    },
    {
      name: 'Nando Pratama',
      email: 'nando@affiliategadget.com',
      phone: '081234567815',
      experience: 8,
      rating: 4.8,
      reviews: 167,
      specialties: ['iPhone', 'Apple', 'MacBook', 'iWatch'],
      bio: 'Apple Certified Specialist',
      image:
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=380&h=480&fit=crop',
    },
  ]

  for (const tech of techData) {
    const user = await prisma.user.upsert({
      where: { email: tech.email },
      update: {},
      create: {
        email: tech.email,
        name: tech.name,
        password: hashedPassword,
        phone: tech.phone,
        image: tech.image,
        role: 'MITRA',
        emailVerified: new Date(),
      },
    })

    await prisma.technician.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: tech.bio,
        experience: tech.experience,
        specialties: tech.specialties,
        rating: tech.rating,
        totalReview: tech.reviews,
        isAvailable: true,
      },
    })
    console.log(`  ✅ ${tech.name}`)
  }

  // ========== MITRA - 12+ with varied images ==========
  console.log('\n🏪 Creating mitra (12+ items)...')

  const mitrasData = [
    {
      businessName: 'iRepair Premium Jakarta',
      email: 'irepair.jkt@email.com',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      address: 'Jl. Sudirman No. 123',
      phone: '021-5556789',
      rating: 4.9,
      reviews: 456,
      description: 'Pusat servis premium Apple Indonesia',
      features: ['Garansi 6 Bulan', 'Sparepart Original', 'Express Service'],
      banner:
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=400&fit=crop',
    },
    {
      businessName: 'TechnoFix 24 Jam Bandung',
      email: 'technofix.bdg@email.com',
      city: 'Bandung',
      province: 'Jawa Barat',
      address: 'Jl. Asia Afrika No. 45',
      phone: '022-4445678',
      rating: 4.7,
      reviews: 567,
      description: 'Servis HP 24 jam semua brand',
      features: ['Buka 24 Jam', 'All Brand', 'Antar Jemput'],
      banner:
        'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=700&h=450&fit=crop',
    },
    {
      businessName: 'GadgetCare Pro Surabaya',
      email: 'gadgetcare.sby@email.com',
      city: 'Surabaya',
      province: 'Jawa Timur',
      address: 'Jl. Pemuda No. 67',
      phone: '031-3334567',
      rating: 4.8,
      reviews: 412,
      description: 'Servis gadget standar internasional',
      features: ['ISO Certified', 'Modern Equipment', 'Data Security'],
      banner:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
    },
    {
      businessName: 'Phone Master Yogyakarta',
      email: 'phonemaster.jog@email.com',
      city: 'Yogyakarta',
      province: 'DI Yogyakarta',
      address: 'Jl. Gejayan No. 12',
      phone: '0274-556789',
      rating: 4.6,
      reviews: 289,
      description: 'Servis HP student-friendly',
      features: ['Harga Mahasiswa', 'Lokasi Kampus', 'Fast Service'],
      banner:
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=750&h=500&fit=crop',
    },
    {
      businessName: 'SmartFix Express Medan',
      email: 'smartfix.mdn@email.com',
      city: 'Medan',
      province: 'Sumatera Utara',
      address: 'Jl. Gatot Subroto No. 88',
      phone: '061-7778889',
      rating: 4.5,
      reviews: 178,
      description: 'Solusi cerdas gadget Anda',
      features: ['Harga Transparan', 'Konsultasi Gratis', 'Garansi Part'],
      banner:
        'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=650&h=350&fit=crop',
    },
    {
      businessName: 'Apple Corner Semarang',
      email: 'applecorner.smg@email.com',
      city: 'Semarang',
      province: 'Jawa Tengah',
      address: 'Jl. Pandanaran No. 55',
      phone: '024-8889900',
      rating: 4.8,
      reviews: 234,
      description: 'Spesialis produk Apple',
      features: ['Apple Specialist', 'Genuine Parts', 'Lifetime Support'],
      banner:
        'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=450&fit=crop',
    },
    {
      businessName: 'Samsung Service Center Makassar',
      email: 'samsungsc.mks@email.com',
      city: 'Makassar',
      province: 'Sulawesi Selatan',
      address: 'Jl. Pengayoman No. 33',
      phone: '0411-2223344',
      rating: 4.7,
      reviews: 198,
      description: 'Authorized Samsung Service',
      features: ['Authorized Service', 'Original Parts', 'Warranty Covered'],
      banner:
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=700&h=400&fit=crop',
    },
    {
      businessName: 'Xiaomi Pro Service Bali',
      email: 'xiaomipro.bali@email.com',
      city: 'Denpasar',
      province: 'Bali',
      address: 'Jl. Teuku Umar No. 100',
      phone: '0361-4445566',
      rating: 4.6,
      reviews: 167,
      description: 'Expert Xiaomi ecosystem',
      features: ['Mi Authorized', 'Fast Repair', 'All Mi Products'],
      banner:
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=650&h=450&fit=crop',
    },
    {
      businessName: 'Laptop Care Palembang',
      email: 'laptopcare.plb@email.com',
      city: 'Palembang',
      province: 'Sumatera Selatan',
      address: 'Jl. Jend. Sudirman No. 77',
      phone: '0711-3334455',
      rating: 4.5,
      reviews: 145,
      description: 'Spesialis laptop dan notebook',
      features: ['All Brand Laptop', 'Upgrade Service', 'Data Recovery'],
      banner:
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=350&fit=crop',
    },
    {
      businessName: 'GameTech Station Tangerang',
      email: 'gametech.tng@email.com',
      city: 'Tangerang',
      province: 'Banten',
      address: 'Jl. MH Thamrin No. 25',
      phone: '021-55667788',
      rating: 4.7,
      reviews: 189,
      description: 'Servis gaming device dan console',
      features: ['Gaming Specialist', 'Console Repair', 'Custom Mod'],
      banner:
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=750&h=400&fit=crop',
    },
    {
      businessName: 'Digital World Bekasi',
      email: 'digitalworld.bks@email.com',
      city: 'Bekasi',
      province: 'Jawa Barat',
      address: 'Jl. Ahmad Yani No. 99',
      phone: '021-88776655',
      rating: 4.4,
      reviews: 156,
      description: 'One stop digital solution',
      features: ['Complete Service', 'Accessories Store', 'Trade-In'],
      banner:
        'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&h=350&fit=crop',
    },
    {
      businessName: 'Premium Fix Center Depok',
      email: 'premiumfix.dpk@email.com',
      city: 'Depok',
      province: 'Jawa Barat',
      address: 'Jl. Margonda Raya No. 150',
      phone: '021-77889900',
      rating: 4.6,
      reviews: 201,
      description: 'Premium quality repair service',
      features: ['Premium Service', 'VIP Lounge', 'Free Pickup'],
      banner:
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=700&h=450&fit=crop',
    },
  ]

  for (const mitra of mitrasData) {
    const user = await prisma.user.upsert({
      where: { email: mitra.email },
      update: {},
      create: {
        email: mitra.email,
        name: `Owner ${mitra.businessName}`,
        password: hashedPassword,
        phone: mitra.phone,
        role: 'MITRA',
        emailVerified: new Date(),
      },
    })

    await prisma.mitra.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: mitra.businessName,
        description: mitra.description,
        banner: mitra.banner,
        address: mitra.address,
        city: mitra.city,
        province: mitra.province,
        phone: mitra.phone,
        email: mitra.email,
        rating: mitra.rating,
        totalReview: mitra.reviews,
        features: mitra.features,
        weekdayHours: '09:00-21:00',
        weekendHours: '10:00-20:00',
        isApproved: true,
        isActive: true,
      },
    })
    console.log(`  ✅ ${mitra.businessName}`)
  }

  console.log('\n🎉 MASSIVE seed completed!')
  console.log('📊 Summary:')
  console.log(`   - Products: ${productsData.length}`)
  console.log(`   - Rental Items: ${rentalData.length}`)
  console.log(`   - Technicians: ${techData.length}`)
  console.log(`   - Mitra: ${mitrasData.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
