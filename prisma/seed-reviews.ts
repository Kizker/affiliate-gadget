import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌟 Seeding Realistic Buyer Reviews with Photos & Videos for Products...')

  const customerPassword = await bcrypt.hash('customer123', 12)

  // 1. Ensure Customer Users exist
  const customers = [
    {
      email: 'customer@test.com',
      name: 'Rian Pratama',
      phone: '081234567890',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    },
    {
      email: 'siti.aminah@gmail.com',
      name: 'Siti Aminah',
      phone: '081298765432',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    },
    {
      email: 'dimas.setiawan@gmail.com',
      name: 'Dimas Setiawan',
      phone: '081377889900',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    },
    {
      email: 'budi.santoso@gmail.com',
      name: 'Budi Santoso',
      phone: '081255443322',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    },
    {
      email: 'anisa.wijaya@gmail.com',
      name: 'Anisa Putri Wijaya',
      phone: '081311223344',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    },
    {
      email: 'hendra.kurniawan@gmail.com',
      name: 'Hendra Kurniawan',
      phone: '081199887766',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80',
    },
  ]

  const userMap: Record<string, any> = {}

  for (const c of customers) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name, image: c.image, phone: c.phone },
      create: {
        email: c.email,
        name: c.name,
        password: customerPassword,
        role: UserRole.CUSTOMER,
        phone: c.phone,
        image: c.image,
        isActive: true,
      },
    })
    userMap[c.email] = user
  }

  // 2. Fetch all products
  const products = await prisma.product.findMany({
    include: { variants: true, store: true },
  })

  if (products.length === 0) {
    console.log('No products found, please run seed first.')
    return
  }

  console.log(`📦 Found ${products.length} products. Generating rich reviews...`)

  // Sample media assets
  const gadgetPhotos = [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&q=80',
    'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&q=80',
  ]

  // Sample short video clip (H.264 MP4 demo / unboxing preview)
  const sampleVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

  const reviewTemplates = [
    {
      userEmail: 'customer@test.com',
      rating: 5,
      comment:
        'Barang mendarat dengan sangat mulus dan aman! Packing bubble wrap super tebal + packing kayu kurir JNE. Unit 100% original segel pabrik, sinyal aman all operator, bonus paket 3-in-1 (charger GaN 20W, tempered glass 9D, dan casing presisi) langsung dipasang. Garansi toko fisik 30 hari bikin tenang banget belanja gadget di sini!',
      hasImages: true,
      hasVideo: true,
      helpfulCount: 24,
      sellerReply:
        'Terima kasih banyak Kak Rian atas ulasan luar biasa dan kepercayaannya pada toko kami! Semoga unitnya awet dan berkah selalu. Jika ada kendala, kartu garansi 30 hari siap kami layani ya 🙏',
    },
    {
      userEmail: 'siti.aminah@gmail.com',
      rating: 5,
      comment:
        'Masya Allah pengiriman instan Gojek cepat banget, 2 jam langsung sampai di meja kerja. Layarnya jernih luar biasa, kamera tajem banget buat bikin konten, dan baterai awet seharian. Bonus aksesoris lengkap jadi ga perlu beli charger terpisah. Toko sangat komunikatif dan ramah!',
      hasImages: true,
      hasVideo: false,
      helpfulCount: 19,
      sellerReply:
        'Sama-sama Kak Siti! Senang sekali paketnya tiba tepat waktu. Terima kasih sudah berbelanja di cabang resmi kami!',
    },
    {
      userEmail: 'dimas.setiawan@gmail.com',
      rating: 5,
      comment:
        'Unit original bergaransi resmi. Saya cek nomor IMEI di database tembus dan terdaftar resmi Kemenperin. Performa Snapdragon/Bionic ngebut tanpa kendala buat gaming dan multitasking. Recommended seller platform gadget terpercaya!',
      hasImages: true,
      hasVideo: true,
      helpfulCount: 15,
      sellerReply:
        'Mantap Kak Dimas! Kami selalu memastikan seluruh unit melewati quality check ketat sebelum pengiriman. Selamat menikmati gadget barunya!',
    },
    {
      userEmail: 'budi.santoso@gmail.com',
      rating: 4,
      comment:
        'Produk mantap sesuai deskripsi. Pengiriman JNE YES kilat 1 hari sampai ke Surabaya. Unit mulus no minus, hanya saja kotak kardus luar sedikit tertekan saat transit kurir, tapi unit di dalamnya tetap 100% aman karena ada asuransi proteksi wajib. Overall puas!',
      hasImages: true,
      hasVideo: false,
      helpfulCount: 9,
      sellerReply:
        'Terima kasih atas masukannya Kak Budi! Kami akan terus berkoordinasi dengan pihak kurir agar paket semakin terproteksi sempurna. Terima kasih bintang 4-nya!',
    },
    {
      userEmail: 'anisa.wijaya@gmail.com',
      rating: 5,
      comment:
        'Bagus banget warnanya elegan! Suara speakernya menggelegar dan layarnya super smooth 120Hz. Bonus antigoresnya pas banget di layar. Pelayanan sales toko lewat chat sangat responsif menjawab pertanyaan varian warna.',
      hasImages: true,
      hasVideo: false,
      helpfulCount: 12,
      sellerReply:
        'Terima kasih banyak Kak Anisa atas ulasannya! Senang bisa melayani Kakak dengan baik 😊',
    },
    {
      userEmail: 'hendra.kurniawan@gmail.com',
      rating: 5,
      comment:
        'Pembelian kedua di toko ini dan selalu memuaskan. Kualitas terjamin, invoice legalitas PT lengkap, dan ada garansi toko 30 hari ganti baru jika cacat pabrik. Top markotop!',
      hasImages: true,
      hasVideo: false,
      helpfulCount: 16,
      sellerReply:
        'Terima kasih atas loyalitasnya Kak Hendra! Semoga selalu puas berbelanja di Affiliate Gadget!',
    },
  ]

  // For each product, create completed orders and product reviews
  for (const product of products) {
    const primaryVariant = product.variants[0]?.name || 'Standard Edition'
    const store = product.store

    console.log(`👉 Seeding reviews for product: ${product.name}`)

    // Create completed order for customer@test.com so they have an active delivered order
    const testUser = userMap['customer@test.com']
    if (testUser) {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId: testUser.id,
          items: { some: { productId: product.id } },
        },
      })

      if (!existingOrder) {
        await prisma.order.create({
          data: {
            orderNumber,
            userId: testUser.id,
            storeId: store?.id,
            status: 'COMPLETED',
            subtotal: product.price,
            shippingCost: 25000,
            insuranceFee: Math.round(product.price * 0.0025),
            courierCode: 'JNE',
            courierService: 'REG',
            trackingNumber: `JNE${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            total: product.price + 25000 + Math.round(product.price * 0.0025),
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            customerConfirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            items: {
              create: [
                {
                  type: 'PRODUCT',
                  productId: product.id,
                  variantId: product.variants[0]?.id,
                  variantName: primaryVariant,
                  quantity: 1,
                  price: product.price,
                  subtotal: product.price,
                  notes: 'Pesanan resmi terproteksi garansi 30 hari',
                },
              ],
            },
          },
        })
      }
    }

    // Insert review templates for this product
    for (let i = 0; i < reviewTemplates.length; i++) {
      const tpl = reviewTemplates[i]
      const user = userMap[tpl.userEmail]
      if (!user) continue

      const selectedImages = tpl.hasImages
        ? [gadgetPhotos[i % gadgetPhotos.length], gadgetPhotos[(i + 1) % gadgetPhotos.length]]
        : []
      const selectedVideos = tpl.hasVideo ? [sampleVideo] : []

      const variantUsed = product.variants[i % (product.variants.length || 1)]?.name || primaryVariant

      const existingRev = await prisma.review.findFirst({
        where: {
          userId: user.id,
          productId: product.id,
          type: 'PRODUCT',
        },
      })

      if (existingRev) {
        await prisma.review.update({
          where: { id: existingRev.id },
          data: {
            rating: tpl.rating,
            comment: tpl.comment,
            images: selectedImages,
            videos: selectedVideos,
            variantName: variantUsed,
            helpfulCount: tpl.helpfulCount,
            sellerReply: tpl.sellerReply,
            sellerReplyAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
          },
        })
      } else {
        await prisma.review.create({
          data: {
            userId: user.id,
            productId: product.id,
            storeId: store?.id,
            variantName: variantUsed,
            type: 'PRODUCT',
            rating: tpl.rating,
            comment: tpl.comment,
            images: selectedImages,
            videos: selectedVideos,
            helpfulCount: tpl.helpfulCount,
            sellerReply: tpl.sellerReply,
            sellerReplyAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - (i + 2) * 24 * 60 * 60 * 1000),
          },
        })
      }
    }

    // Update product rating and totalReview
    const allRevs = await prisma.review.findMany({
      where: { productId: product.id, type: 'PRODUCT' },
      select: { rating: true },
    })

    const totalReview = allRevs.length
    const averageRating =
      totalReview > 0 ? allRevs.reduce((acc, r) => acc + r.rating, 0) / totalReview : 5.0

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: Number(averageRating.toFixed(1)),
        totalReview: totalReview,
      },
    })
  }

  console.log('✅ Successfully seeded comprehensive buyer reviews with photos, videos, and store replies!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding reviews:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
