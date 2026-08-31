import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportDatabase() {
  console.log('🔄 Starting database export...\n')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportDir = path.join(process.cwd(), 'database-exports')
  const exportFile = path.join(exportDir, `affiliate_gadget_export_${timestamp}.sql`)

  // Create export directory if not exists
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  let sqlDump = `-- Affiliate Gadget Database Export
-- Generated: ${new Date().toISOString()}
-- Database: affiliate_gadget
-- 
-- IMPORTANT: Run this file after creating database and running Prisma migrations
-- Command: psql -U postgres -d affiliate_gadget -f ${path.basename(exportFile)}
--

-- Disable triggers temporarily
SET session_replication_role = replica;

`

  try {
    // Export Users
    console.log('📦 Exporting Users...')
    const users = await prisma.user.findMany()
    if (users.length > 0) {
      sqlDump += `\n-- Users (${users.length} records)\n`
      for (const user of users) {
        const values = [
          `'${user.id}'`,
          user.name ? `'${user.name.replace(/'/g, "''")}'` : 'NULL',
          `'${user.email}'`,
          user.emailVerified ? `'${user.emailVerified.toISOString()}'` : 'NULL',
          user.image ? `'${user.image.replace(/'/g, "''")}'` : 'NULL',
          user.password ? `'${user.password.replace(/'/g, "''")}'` : 'NULL',
          user.phone ? `'${user.phone.replace(/'/g, "''")}'` : 'NULL',
          `'${user.role}'`,
          `'${user.createdAt.toISOString()}'`,
          `'${user.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "User" (id, name, email, "emailVerified", image, password, phone, role, "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }
    }

    // Export Technicians
    console.log('📦 Exporting Technicians...')
    const technicians = await prisma.technician.findMany()
    if (technicians.length > 0) {
      sqlDump += `\n-- Technicians (${technicians.length} records)\n`
      for (const tech of technicians) {
        const values = [
          `'${tech.id}'`,
          `'${tech.userId}'`,
          tech.bio ? `'${tech.bio.replace(/'/g, "''")}'` : 'NULL',
          tech.experience,
          `ARRAY[${tech.specialties.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ')}]::text[]`,
          tech.rating,
          tech.totalReview,
          tech.isAvailable ? 'true' : 'false',
          `'${tech.createdAt.toISOString()}'`,
          `'${tech.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "Technician" (id, "userId", bio, experience, specialties, rating, "totalReview", "isAvailable", "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }
    }

    // Export Services
    console.log('📦 Exporting Services...')
    const services = await prisma.service.findMany()
    if (services.length > 0) {
      sqlDump += `\n-- Services (${services.length} records)\n`
      for (const service of services) {
        const values = [
          `'${service.id}'`,
          `'${service.technicianId}'`,
          `'${service.name.replace(/'/g, "''")}'`,
          service.description
            ? `'${service.description.replace(/'/g, "''")}'`
            : 'NULL',
          `'${service.category}'`,
          service.price,
          service.duration || 'NULL',
          `'${service.createdAt.toISOString()}'`,
          `'${service.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "Service" (id, "technicianId", name, description, category, price, duration, "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }
    }

    // Export Products
    console.log('📦 Exporting Products...')
    const products = await prisma.product.findMany()
    if (products.length > 0) {
      sqlDump += `\n-- Products (${products.length} records)\n`
      for (const product of products) {
        const values = [
          `'${product.id}'`,
          `'${product.name.replace(/'/g, "''")}'`,
          product.description
            ? `'${product.description.replace(/'/g, "''")}'`
            : 'NULL',
          `'${product.category}'`,
          product.brand ? `'${product.brand.replace(/'/g, "''")}'` : 'NULL',
          product.price,
          product.stock,
          `ARRAY[${product.images.map((img) => `'${img.replace(/'/g, "''")}'`).join(', ')}]::text[]`,
          product.isActive ? 'true' : 'false',
          `'${product.createdAt.toISOString()}'`,
          `'${product.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "Product" (id, name, description, category, brand, price, stock, images, "isActive", "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }
    }

    // Export Rental Items
    console.log('📦 Exporting Rental Items...')
    const rentalItems = await prisma.rentalItem.findMany()
    if (rentalItems.length > 0) {
      sqlDump += `\n-- Rental Items (${rentalItems.length} records)\n`
      for (const item of rentalItems) {
        const itemAny = item as any
        const values = [
          `'${item.id}'`,
          `'${item.name.replace(/'/g, "''")}'`,
          item.description
            ? `'${item.description.replace(/'/g, "''")}'`
            : 'NULL',
          item.pricePerDay,
          itemAny.weeklyDiscountPct ?? 10,
          itemAny.monthlyDiscountPct ?? 20,
          itemAny.depositAmount || 'NULL',
          item.stock,
          `ARRAY[${item.images.map((img) => `'${img.replace(/'/g, "''")}'`).join(', ')}]::text[]`,
          item.isActive ? 'true' : 'false',
          `'${item.createdAt.toISOString()}'`,
          `'${item.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "RentalItem" (id, name, description, "pricePerDay", "weeklyDiscountPct", "monthlyDiscountPct", "depositAmount", stock, images, "isActive", "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }
    }

    // Export Mitras
    console.log('📦 Exporting Mitras...')
    const mitras = await prisma.mitra.findMany({ include: { services: true } })
    if (mitras.length > 0) {
      sqlDump += `\n-- Mitras (${mitras.length} records)\n`
      for (const mitra of mitras) {
        const values = [
          `'${mitra.id}'`,
          `'${mitra.businessName.replace(/'/g, "''")}'`,
          mitra.tagline ? `'${mitra.tagline.replace(/'/g, "''")}'` : 'NULL',
          mitra.description
            ? `'${mitra.description.replace(/'/g, "''")}'`
            : 'NULL',
          `'${mitra.city.replace(/'/g, "''")}'`,
          `'${mitra.address.replace(/'/g, "''")}'`,
          `'${mitra.phone.replace(/'/g, "''")}'`,
          mitra.email ? `'${mitra.email.replace(/'/g, "''")}'` : 'NULL',
          mitra.website ? `'${mitra.website.replace(/'/g, "''")}'` : 'NULL',
          mitra.banner ? `'${mitra.banner.replace(/'/g, "''")}'` : 'NULL',
          mitra.weekdayHours
            ? `'${mitra.weekdayHours.replace(/'/g, "''")}'`
            : 'NULL',
          mitra.weekendHours
            ? `'${mitra.weekendHours.replace(/'/g, "''")}'`
            : 'NULL',
          mitra.rating,
          mitra.totalReview,
          mitra.isApproved ? 'true' : 'false',
          `'${mitra.createdAt.toISOString()}'`,
          `'${mitra.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "Mitra" (id, "businessName", tagline, description, city, address, phone, email, website, banner, "weekdayHours", "weekendHours", rating, "totalReview", "isApproved", "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }

      // Export Mitra Services
      sqlDump += `\n-- Mitra Services\n`
      for (const mitra of mitras) {
        for (const service of mitra.services) {
          const values = [
            `'${service.id}'`,
            `'${mitra.id}'`,
            `'${service.name.replace(/'/g, "''")}'`,
            service.icon ? `'${service.icon.replace(/'/g, "''")}'` : 'NULL',
            service.price ? `'${service.price.replace(/'/g, "''")}'` : 'NULL',
          ]
          sqlDump += `INSERT INTO "MitraService" (id, "mitraId", name, icon, price) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
        }
      }
    }

    // Export Articles
    console.log('📦 Exporting Articles...')
    const articles = await prisma.article.findMany()
    if (articles.length > 0) {
      sqlDump += `\n-- Articles (${articles.length} records)\n`
      for (const article of articles) {
        const values = [
          `'${article.id}'`,
          `'${article.slug}'`,
          `'${article.title.replace(/'/g, "''")}'`,
          `'${article.content.replace(/'/g, "''")}'`,
          article.excerpt ? `'${article.excerpt.replace(/'/g, "''")}'` : 'NULL',
          article.coverImage
            ? `'${article.coverImage.replace(/'/g, "''")}'`
            : 'NULL',
          article.category
            ? `'${article.category.replace(/'/g, "''")}'`
            : 'NULL',
          `ARRAY[${article.tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(', ')}]::text[]`,
          article.isPublished ? 'true' : 'false',
          article.publishedAt
            ? `'${article.publishedAt.toISOString()}'`
            : 'NULL',
          `'${article.createdAt.toISOString()}'`,
          `'${article.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "Article" (id, slug, title, content, excerpt, "coverImage", category, tags, "isPublished", "publishedAt", "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }
    }

    // Export Orders
    console.log('📦 Exporting Orders...')
    const orders = await prisma.order.findMany({
      include: { items: true, payment: true },
    })
    if (orders.length > 0) {
      sqlDump += `\n-- Orders (${orders.length} records)\n`
      for (const order of orders) {
        const values = [
          `'${order.id}'`,
          `'${order.userId}'`,
          order.technicianId ? `'${order.technicianId}'` : 'NULL',
          `'${order.orderNumber}'`,
          order.subtotal,
          order.tax,
          order.total,
          `'${order.status}'`,
          order.notes ? `'${order.notes.replace(/'/g, "''")}'` : 'NULL',
          `'${order.createdAt.toISOString()}'`,
          `'${order.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "Order" (id, "userId", "technicianId", "orderNumber", subtotal, tax, total, status, notes, "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }

      // Export Order Items
      sqlDump += `\n-- Order Items\n`
      for (const order of orders) {
        for (const item of order.items) {
          const values = [
            `'${item.id}'`,
            `'${item.orderId}'`,
            `'${item.type}'`,
            item.serviceId ? `'${item.serviceId}'` : 'NULL',
            item.productId ? `'${item.productId}'` : 'NULL',
            item.rentalItemId ? `'${item.rentalItemId}'` : 'NULL',
            item.quantity,
            item.rentalDays || 'NULL',
            item.price,
            item.subtotal,
          ]
          sqlDump += `INSERT INTO "OrderItem" (id, "orderId", type, "serviceId", "productId", "rentalItemId", quantity, "rentalDays", price, subtotal) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
        }
      }

      // Export Payments
      if (orders.some((o) => o.payment)) {
        sqlDump += `\n-- Payments\n`
        for (const order of orders) {
          if (order.payment) {
            const payment = order.payment
            const values = [
              `'${payment.id}'`,
              `'${payment.orderId}'`,
              payment.amount,
              `'${payment.method}'`,
              `'${payment.status}'`,
              payment.notes ? `'${payment.notes.replace(/'/g, "''")}'` : 'NULL',
              payment.verifiedAt
                ? `'${payment.verifiedAt.toISOString()}'`
                : 'NULL',
              `'${payment.createdAt.toISOString()}'`,
              `'${payment.updatedAt.toISOString()}'`,
            ]
            sqlDump += `INSERT INTO "Payment" (id, "orderId", amount, method, status, notes, "verifiedAt", "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
          }
        }
      }
    }

    // Export Reviews
    console.log('📦 Exporting Reviews...')
    const reviews = await prisma.review.findMany()
    if (reviews.length > 0) {
      sqlDump += `\n-- Reviews (${reviews.length} records)\n`
      for (const review of reviews) {
        const values = [
          `'${review.id}'`,
          `'${review.userId}'`,
          review.orderId ? `'${review.orderId}'` : 'NULL',
          review.mitraId ? `'${review.mitraId}'` : 'NULL',
          `'${review.type}'`,
          review.rating,
          review.comment ? `'${review.comment.replace(/'/g, "''")}'` : 'NULL',
          `'${review.createdAt.toISOString()}'`,
          `'${review.updatedAt.toISOString()}'`,
        ]
        sqlDump += `INSERT INTO "Review" (id, "userId", "orderId", "mitraId", type, rating, comment, "createdAt", "updatedAt") VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`
      }
    }

    // Re-enable triggers
    sqlDump += `\n-- Re-enable triggers\nSET session_replication_role = DEFAULT;\n`

    // Write to file
    fs.writeFileSync(exportFile, sqlDump, 'utf8')

    console.log('\n✅ Database export completed!')
    console.log(`📁 Export file: ${exportFile}`)
    console.log(
      `📊 File size: ${(fs.statSync(exportFile).size / 1024).toFixed(2)} KB`
    )
    console.log('\n📝 To import this database:')
    console.log('   1. Create new database: createdb affiliate_gadget')
    console.log('   2. Run migrations: npx prisma migrate deploy')
    console.log(
      `   3. Import data: psql -U postgres -d affiliate_gadget -f "${path.basename(exportFile)}"`
    )
  } catch (error) {
    console.error('❌ Error exporting database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

exportDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
